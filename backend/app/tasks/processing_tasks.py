"""
Celery tasks for processing vegetation indices.
"""

import logging
from typing import Dict, Any
from datetime import datetime
import uuid

from app.celery_app import celery_app
from app.models import VegetationJob, VegetationScene, VegetationIndexCache
from app.services.processor import VegetationIndexProcessor
from app.services.storage import create_storage_service, generate_tenant_bucket_name
from app.database import get_db_session

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='vegetation.calculate_vegetation_index')
def calculate_vegetation_index(
    self,
    job_id: str,
    tenant_id: str,
    scene_id: str,
    index_type: str,
    formula: str = None
):
    """Calculate vegetation index for a scene.
    
    Args:
        job_id: Job ID
        tenant_id: Tenant ID
        scene_id: Scene ID
        index_type: Type of index (NDVI, EVI, SAVI, GNDVI, NDRE, CUSTOM)
        formula: Custom formula (if index_type is CUSTOM)
    """
    db = next(get_db_session())
    
    try:
        # Get job
        job = db.query(VegetationJob).filter(VegetationJob.id == uuid.UUID(job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        # Get scene
        scene = db.query(VegetationScene).filter(VegetationScene.id == uuid.UUID(scene_id)).first()
        if not scene:
            logger.error(f"Scene {scene_id} not found")
            job.mark_failed("Scene not found")
            db.commit()
            return
        
        # Update job status
        job.mark_started()
        job.celery_task_id = self.request.id
        db.commit()
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10, 'message': 'Loading bands'})
        
        # Generate bucket name automatically based on tenant_id (security: prevents bucket name conflicts)
        bucket_name = generate_tenant_bucket_name(tenant_id)
        
        # Get storage service - use scene's storage_type if available, otherwise default to s3
        from app.models import VegetationConfig
        config = db.query(VegetationConfig).filter(
            VegetationConfig.tenant_id == tenant_id
        ).first()
        storage_type = config.storage_type if config else 's3'
        
        storage = create_storage_service(
            storage_type=storage_type,
            default_bucket=bucket_name
        )
        
        # Load band paths
        band_paths = scene.bands or {}
        
        # Create processor
        processor = VegetationIndexProcessor(band_paths)
        
        # Calculate index
        self.update_state(state='PROGRESS', meta={'progress': 30, 'message': f'Calculating {index_type}'})
        
        if index_type == 'NDVI':
            index_array = processor.calculate_ndvi()
        elif index_type == 'EVI':
            index_array = processor.calculate_evi()
        elif index_type == 'SAVI':
            index_array = processor.calculate_savi()
        elif index_type == 'GNDVI':
            index_array = processor.calculate_gndvi()
        elif index_type == 'NDRE':
            index_array = processor.calculate_ndre()
        elif index_type == 'CUSTOM' and formula:
            index_array = processor.calculate_custom_index(formula)
        else:
            raise ValueError(f"Unsupported index type: {index_type}")
        
        # Calculate statistics
        self.update_state(state='PROGRESS', meta={'progress': 60, 'message': 'Calculating statistics'})
        statistics = processor.calculate_statistics(index_array)
        
        # Save raster
        self.update_state(state='PROGRESS', meta={'progress': 80, 'message': 'Saving results'})
        output_path = f"{scene.storage_path}/indices/{index_type}.tif"
        processor.save_index_raster(index_array, output_path)
        
        # Upload to storage (use auto-generated bucket for security)
        storage.upload_file(output_path, output_path, bucket_name)
        
        # Create cache entry
        cache_entry = VegetationIndexCache(
            tenant_id=tenant_id,
            scene_id=scene.id,
            entity_id=job.entity_id,
            index_type=index_type,
            formula=formula,
            mean_value=statistics['mean'],
            min_value=statistics['min'],
            max_value=statistics['max'],
            std_dev=statistics['std'],
            pixel_count=statistics['pixel_count'],
            result_raster_path=output_path,
            calculated_at=datetime.utcnow().isoformat(),
            calculation_time_ms=None  # TODO: Track calculation time
        )
        
        db.add(cache_entry)
        
        # Mark job as completed
        job.mark_completed({
            'index_type': index_type,
            'statistics': statistics,
            'raster_path': output_path
        })
        db.commit()
        
        # Update job status in usage stats
        from app.services.usage_tracker import UsageTracker
        UsageTracker.update_job_status(db, tenant_id, str(job.id), 'completed')
        
        logger.info(f"Index {index_type} calculated successfully for scene {scene_id}")
        
    except Exception as e:
        logger.error(f"Error calculating index: {str(e)}", exc_info=True)
        if job:
            job.mark_failed(str(e), str(e.__traceback__))
            db.commit()
            # Update job status in usage stats
            from app.services.usage_tracker import UsageTracker
            UsageTracker.update_job_status(db, tenant_id, str(job.id), 'failed')
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name='vegetation.process_index_job')
def process_index_job(self, job_id: str):
    """Process an index calculation job."""
    db = next(get_db_session())
    
    try:
        job = db.query(VegetationJob).filter(VegetationJob.id == uuid.UUID(job_id)).first()
        if not job:
            return
        
        calculate_vegetation_index.delay(
            str(job.id),
            job.tenant_id,
            job.parameters.get('scene_id'),
            job.parameters.get('index_type'),
            job.parameters.get('formula')
        )
        
    finally:
        db.close()

