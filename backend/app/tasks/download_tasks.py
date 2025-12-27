"""
Celery tasks for downloading Sentinel-2 scenes.
UPDATED: Real implementation with Copernicus Data Space Ecosystem.
"""

import logging
from typing import Dict, Any
from datetime import datetime, timedelta, date
import uuid
import os
from pathlib import Path

from app.celery_app import celery_app
from app.models import VegetationJob, VegetationScene, VegetationConfig
from app.services.storage import create_storage_service, generate_tenant_bucket_name
from app.services.copernicus_client import CopernicusDataSpaceClient
from app.services.platform_credentials import get_copernicus_credentials_with_fallback
from app.database import get_db_session

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='vegetation.download_sentinel2_scene')
def download_sentinel2_scene(self, job_id: str, tenant_id: str, parameters: Dict[str, Any]):
    """Download Sentinel-2 scene from Copernicus Data Space Ecosystem.
    
    Args:
        job_id: Job ID
        tenant_id: Tenant ID
        parameters: Job parameters including bounds, date range, etc.
    """
    db = next(get_db_session())
    
    try:
        # Get job
        job = db.query(VegetationJob).filter(VegetationJob.id == uuid.UUID(job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        # Update job status
        job.mark_started()
        job.celery_task_id = self.request.id
        db.commit()
        
        # Get tenant configuration
        config = db.query(VegetationConfig).filter(
            VegetationConfig.tenant_id == tenant_id
        ).first()
        
        # Get Copernicus credentials from platform (preferred) or module config (fallback)
        creds = get_copernicus_credentials_with_fallback(
            db=db,
            fallback_client_id=config.copernicus_client_id if config else None,
            fallback_client_secret=config.copernicus_client_secret_encrypted if config else None
        )
        
        if not creds:
            raise ValueError(
                "Copernicus credentials not available. "
                "Please configure credentials in the platform admin panel or in module settings."
            )
        
        # Initialize Copernicus client with credentials from platform or module config
        copernicus_client = CopernicusDataSpaceClient()
        copernicus_client.set_credentials(
            client_id=creds['client_id'],
            client_secret=creds['client_secret']
        )
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10, 'message': 'Searching for scenes'})
        
        # Extract parameters
        bounds = parameters.get('bounds')  # GeoJSON polygon
        start_date = parameters.get('start_date')
        end_date = parameters.get('end_date')
        cloud_threshold = parameters.get('cloud_coverage_threshold', config.cloud_coverage_threshold)
        
        # Convert bounds to bbox [min_lon, min_lat, max_lon, max_lat]
        if bounds and bounds.get('type') == 'Polygon':
            coords = bounds['coordinates'][0]
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            bbox = [min(lons), min(lats), max(lons), max(lats)]
        else:
            raise ValueError("Invalid bounds provided")
        
        # Parse dates
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)
        
        # Search for scenes
        self.update_state(state='PROGRESS', meta={'progress': 20, 'message': 'Searching Copernicus catalog'})
        scenes = copernicus_client.search_scenes(
            bbox=bbox,
            start_date=start_date,
            end_date=end_date,
            cloud_cover_max=float(cloud_threshold),
            limit=10  # Get top 10 matches
        )
        
        if not scenes:
            raise ValueError("No scenes found matching criteria")
        
        # Select best scene (lowest cloud cover, most recent)
        best_scene = sorted(scenes, key=lambda s: (s['cloud_cover'], s['sensing_date']), reverse=True)[0]
        scene_id = best_scene['id']
        
        self.update_state(state='PROGRESS', meta={'progress': 30, 'message': f'Found scene {scene_id}'})
        
        # Determine which bands to download based on default index type
        required_bands = {
            'NDVI': ['B04', 'B08'],
            'EVI': ['B02', 'B04', 'B08'],
            'SAVI': ['B04', 'B08'],
            'GNDVI': ['B03', 'B08'],
            'NDRE': ['B8A', 'B08'],
        }.get(config.default_index_type, ['B04', 'B08'])
        
        # Create temporary directory for downloads
        temp_dir = Path(f"/tmp/vegetation_downloads/{tenant_id}/{job_id}")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Download bands
        self.update_state(state='PROGRESS', meta={'progress': 40, 'message': 'Downloading bands'})
        band_paths = copernicus_client.download_scene_bands(
            scene_id=scene_id,
            bands=required_bands,
            output_dir=str(temp_dir)
        )
        
        if not band_paths:
            raise ValueError("Failed to download any bands")
        
        self.update_state(state='PROGRESS', meta={'progress': 70, 'message': 'Uploading to storage'})
        
        # Generate bucket name automatically based on tenant_id (security: prevents bucket name conflicts)
        bucket_name = generate_tenant_bucket_name(tenant_id)
        
        # Get storage service
        storage = create_storage_service(
            storage_type=config.storage_type,
            default_bucket=bucket_name
        )
        
        # Upload bands to storage
        storage_band_paths = {}
        for band, local_path in band_paths.items():
            remote_path = f"{config.storage_path}scenes/{scene_id}/{band}.tif"
            storage.upload_file(local_path, remote_path, bucket_name)
            storage_band_paths[band] = remote_path
            
            # Clean up local file
            Path(local_path).unlink()
        
        self.update_state(state='PROGRESS', meta={'progress': 90, 'message': 'Creating scene record'})
        
        # Create scene record
        scene = VegetationScene(
            tenant_id=tenant_id,
            scene_id=scene_id,
            sensing_date=date.fromisoformat(best_scene['sensing_date']),
            footprint=None,  # TODO: Convert geometry to PostGIS
            cloud_coverage=str(best_scene['cloud_cover']),
            storage_path=f"{config.storage_path}scenes/{scene_id}/",
            storage_bucket=bucket_name,  # Auto-generated from tenant_id
            bands=storage_band_paths,
            job_id=job.id
        )
        
        db.add(scene)
        db.commit()
        
        # Clean up temp directory
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Mark job as completed
        job.mark_completed({
            'scene_id': str(scene.id),
            'scene_product_id': scene_id,
            'bands_downloaded': list(band_paths.keys()),
            'message': 'Scene downloaded successfully'
        })
        db.commit()
        
        # Update job status in usage stats
        from app.services.usage_tracker import UsageTracker
        UsageTracker.update_job_status(db, tenant_id, str(job.id), 'completed')
        
        logger.info(f"Job {job_id} completed successfully - Scene {scene_id}")
        
    except Exception as e:
        logger.error(f"Error in download task: {str(e)}", exc_info=True)
        if job:
            job.mark_failed(str(e), str(e.__traceback__))
            db.commit()
            # Update job status in usage stats
            from app.services.usage_tracker import UsageTracker
            UsageTracker.update_job_status(db, tenant_id, str(job.id), 'failed')
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name='vegetation.process_download_job')
def process_download_job(self, job_id: str):
    """Process a download job (wrapper for download_sentinel2_scene)."""
    db = next(get_db_session())
    
    try:
        job = db.query(VegetationJob).filter(VegetationJob.id == uuid.UUID(job_id)).first()
        if not job:
            return
        
        download_sentinel2_scene.delay(
            str(job.id),
            job.tenant_id,
            job.parameters
        )
        
    finally:
        db.close()
