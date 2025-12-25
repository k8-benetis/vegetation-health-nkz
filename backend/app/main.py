"""
FastAPI main application for Vegetation Prime module.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db_with_tenant, get_db_session, init_db
from app.middleware.auth import require_auth, get_tenant_id
from app.middleware.service_auth import require_service_auth
from app.models import (
    VegetationConfig, VegetationJob, VegetationScene,
    VegetationIndexCache, VegetationCustomFormula,
    VegetationPlanLimits, VegetationUsageStats
)
from app.tasks import download_sentinel2_scene, calculate_vegetation_index
from app.services.storage import create_storage_service
from app.services.fiware_integration import FIWAREMapper, FIWAREClient
from app.services.limits import LimitsValidator
from app.services.usage_tracker import UsageTracker
from app.middleware.limits import validate_limits_dependency
from decimal import Decimal
from app.api.tiles import router as tiles_router

logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Vegetation Prime API...")
    # init_db()  # Uncomment if you want to auto-create tables
    yield
    # Shutdown
    logger.info("Shutting down Vegetation Prime API...")


# Create FastAPI app
app = FastAPI(
    title="Vegetation Prime API",
    description="High-performance vegetation intelligence suite for Nekazari Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include tile router
app.include_router(tiles_router)


# =============================================================================
# Pydantic Models
# =============================================================================

class JobCreateRequest(BaseModel):
    """Request model for creating a job."""
    job_type: str = Field(..., description="Type of job: download, process, calculate_index")
    entity_id: Optional[str] = Field(None, description="FIWARE entity ID (AgriParcel)")
    entity_type: str = Field("AgriParcel", description="Entity type")
    bounds: Optional[Dict[str, Any]] = Field(None, description="GeoJSON polygon bounds")
    start_date: Optional[date] = Field(None, description="Start date for scene search")
    end_date: Optional[date] = Field(None, description="End date for scene search")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Additional parameters")


class JobResponse(BaseModel):
    """Response model for job."""
    id: str
    tenant_id: str
    job_type: str
    status: str
    progress_percentage: int
    progress_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]


class ConfigUpdateRequest(BaseModel):
    """Request model for updating configuration."""
    copernicus_client_id: Optional[str] = None
    copernicus_client_secret: Optional[str] = None  # Will be encrypted
    default_index_type: Optional[str] = None
    cloud_coverage_threshold: Optional[float] = None
    auto_process: Optional[bool] = None
    storage_type: Optional[str] = None
    storage_bucket: Optional[str] = None


class IndexCalculationRequest(BaseModel):
    """Request model for calculating index."""
    scene_id: str
    index_type: str = Field(..., description="NDVI, EVI, SAVI, GNDVI, NDRE, CUSTOM")
    formula: Optional[str] = Field(None, description="Custom formula if index_type is CUSTOM")
    entity_id: Optional[str] = None


class TimeseriesRequest(BaseModel):
    """Request model for timeseries."""
    entity_id: str
    index_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "vegetation-prime"}


class LimitsSyncRequest(BaseModel):
    """Request model for syncing limits from Core."""
    tenant_id: str
    plan_type: str
    plan_name: Optional[str] = None
    monthly_ha_limit: float
    daily_ha_limit: float
    daily_jobs_limit: int
    monthly_jobs_limit: int
    daily_download_jobs_limit: int
    daily_process_jobs_limit: int
    daily_calculate_jobs_limit: int
    is_active: bool = True
    synced_by: Optional[str] = None


class UsageResponse(BaseModel):
    """Response model for usage statistics (simplified format)."""
    plan: str
    volume: Dict[str, float]
    frequency: Dict[str, int]
    _detailed: Optional[Dict[str, Any]] = None  # Internal detailed info


@app.post("/api/vegetation/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    request: JobCreateRequest,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Create a new vegetation processing job.
    
    Validates limits before creating the job.
    """
    try:
        # Validate limits BEFORE creating job
        validator = LimitsValidator(db, current_user['tenant_id'])
        
        ha_to_process = None
        if request.ha_to_process:
            from decimal import Decimal
            ha_to_process = Decimal(str(request.ha_to_process))
        
        is_allowed, error_message, usage_info = validator.check_all_limits(
            job_type=request.job_type,
            bounds=request.bounds,
            ha_to_process=ha_to_process
        )
        
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Limit exceeded',
                    'message': error_message,
                    'usage': usage_info,
                    'limits': validator.limits,
                }
            )
        
        # Limits OK, create job
        job = VegetationJob(
            tenant_id=current_user['tenant_id'],
            job_type=request.job_type,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            start_date=request.start_date,
            end_date=request.end_date,
            parameters=request.parameters,
            created_by=current_user.get('user_id')
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Record usage (increment counters)
        from decimal import Decimal
        ha_processed = ha_to_process or UsageTracker.calculate_area_hectares(request.bounds)
        UsageTracker.record_job_usage(
            db=db,
            tenant_id=current_user['tenant_id'],
            job_id=str(job.id),
            job_type=request.job_type,
            bounds=request.bounds,
            ha_processed=ha_processed
        )
        
        # Queue Celery task based on job type
        if request.job_type == 'download':
            download_sentinel2_scene.delay(
                str(job.id),
                current_user['tenant_id'],
                request.parameters
            )
        elif request.job_type == 'calculate_index':
            calculate_vegetation_index.delay(
                str(job.id),
                current_user['tenant_id'],
                request.parameters.get('scene_id'),
                request.parameters.get('index_type'),
                request.parameters.get('formula')
            )
        
        return JobResponse(
            id=str(job.id),
            tenant_id=job.tenant_id,
            job_type=job.job_type,
            status=job.status,
            progress_percentage=job.progress_percentage,
            progress_message=job.progress_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            result=job.result,
            error_message=job.error_message
        )
        
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job: {str(e)}"
        )


@app.get("/api/vegetation/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get job status and details."""
    job = db.query(VegetationJob).filter(
        VegetationJob.id == job_id,
        VegetationJob.tenant_id == current_user['tenant_id']
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return JobResponse(
        id=str(job.id),
        tenant_id=job.tenant_id,
        job_type=job.job_type,
        status=job.status,
        progress_percentage=job.progress_percentage,
        progress_message=job.progress_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        result=job.result,
        error_message=job.error_message
    )


@app.get("/api/vegetation/jobs")
async def list_jobs(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """List jobs for current tenant."""
    query = db.query(VegetationJob).filter(
        VegetationJob.tenant_id == current_user['tenant_id']
    )
    
    if status_filter:
        query = query.filter(VegetationJob.status == status_filter)
    
    jobs = query.order_by(VegetationJob.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "jobs": [
            {
                "id": str(job.id),
                "job_type": job.job_type,
                "status": job.status,
                "progress_percentage": job.progress_percentage,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None
            }
            for job in jobs
        ],
        "total": query.count()
    }


@app.get("/api/vegetation/indices")
async def get_indices(
    entity_id: Optional[str] = None,
    scene_id: Optional[str] = None,
    index_type: Optional[str] = None,
    format: str = "geojson",  # geojson or xyz
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get vegetation indices (as tiles or GeoJSON)."""
    query = db.query(VegetationIndexCache).filter(
        VegetationIndexCache.tenant_id == current_user['tenant_id']
    )
    
    if entity_id:
        query = query.filter(VegetationIndexCache.entity_id == entity_id)
    if scene_id:
        query = query.filter(VegetationIndexCache.scene_id == UUID(scene_id))
    if index_type:
        query = query.filter(VegetationIndexCache.index_type == index_type)
    
    indices = query.all()
    
    if format == "geojson":
        # Return as GeoJSON
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "index_type": idx.index_type,
                        "mean_value": float(idx.mean_value) if idx.mean_value else None,
                        "min_value": float(idx.min_value) if idx.min_value else None,
                        "max_value": float(idx.max_value) if idx.max_value else None,
                        "calculated_at": idx.calculated_at
                    },
                    "geometry": idx.statistics_geojson if idx.statistics_geojson else None
                }
                for idx in indices
            ]
        }
    else:
        # Return tile URLs
        return {
            "tiles": [
                {
                    "index_type": idx.index_type,
                    "tiles_url": idx.result_tiles_path,
                    "calculated_at": idx.calculated_at
                }
                for idx in indices
            ]
        }


@app.get("/api/vegetation/scenes")
async def list_scenes(
    entity_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """List available scenes for current tenant.
    
    Args:
        entity_id: Optional entity ID filter
        start_date: Optional start date filter
        end_date: Optional end date filter
        limit: Maximum number of results
        
    Returns:
        List of scenes with metadata
    """
    query = db.query(VegetationScene).filter(
        VegetationScene.tenant_id == current_user['tenant_id']
    )
    
    if entity_id:
        # Join with indices to filter by entity
        query = query.join(VegetationIndexCache).filter(
            VegetationIndexCache.entity_id == entity_id
        )
    
    if start_date:
        query = query.filter(VegetationScene.sensing_date >= start_date)
    if end_date:
        query = query.filter(VegetationScene.sensing_date <= end_date)
    
    scenes = query.order_by(VegetationScene.sensing_date.desc()).limit(limit).all()
    
    return {
        "scenes": [
            {
                "id": str(scene.id),
                "scene_id": scene.scene_id,
                "sensing_date": scene.sensing_date.isoformat(),
                "cloud_coverage": float(scene.cloud_coverage) if scene.cloud_coverage else None,
                "platform": scene.platform,
                "product_type": scene.product_type,
            }
            for scene in scenes
        ],
        "total": query.count()
    }


@app.get("/api/vegetation/timeseries")
async def get_timeseries(
    request: TimeseriesRequest = Depends(),
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get time series data for vegetation indices."""
    query = db.query(VegetationIndexCache).filter(
        VegetationIndexCache.tenant_id == current_user['tenant_id'],
        VegetationIndexCache.entity_id == request.entity_id,
        VegetationIndexCache.index_type == request.index_type
    )
    
    if request.start_date:
        # Join with scenes to filter by date
        query = query.join(VegetationScene).filter(
            VegetationScene.sensing_date >= request.start_date
        )
    if request.end_date:
        query = query.join(VegetationScene).filter(
            VegetationScene.sensing_date <= request.end_date
        )
    
    indices = query.order_by(VegetationIndexCache.calculated_at).all()
    
    return {
        "entity_id": request.entity_id,
        "index_type": request.index_type,
        "data_points": [
            {
                "date": idx.calculated_at,
                "value": float(idx.mean_value) if idx.mean_value else None,
                "min": float(idx.min_value) if idx.min_value else None,
                "max": float(idx.max_value) if idx.max_value else None,
                "std": float(idx.std_dev) if idx.std_dev else None
            }
            for idx in indices
        ]
    }


@app.post("/api/vegetation/config")
async def update_config(
    request: ConfigUpdateRequest,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Update tenant configuration."""
    config = db.query(VegetationConfig).filter(
        VegetationConfig.tenant_id == current_user['tenant_id']
    ).first()
    
    if not config:
        config = VegetationConfig(tenant_id=current_user['tenant_id'])
        db.add(config)
    
    # Update fields
    if request.copernicus_client_id is not None:
        config.copernicus_client_id = request.copernicus_client_id
    if request.copernicus_client_secret is not None:
        # TODO: Encrypt secret before storing
        config.copernicus_client_secret_encrypted = request.copernicus_client_secret
    if request.default_index_type is not None:
        config.default_index_type = request.default_index_type
    if request.cloud_coverage_threshold is not None:
        config.cloud_coverage_threshold = request.cloud_coverage_threshold
    if request.auto_process is not None:
        config.auto_process = request.auto_process
    if request.storage_type is not None:
        config.storage_type = request.storage_type
    if request.storage_bucket is not None:
        config.storage_bucket = request.storage_bucket
    
    db.commit()
    db.refresh(config)
    
    return {"message": "Configuration updated", "config": config.to_dict()}


@app.get("/api/vegetation/config")
async def get_config(
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get tenant configuration."""
    config = db.query(VegetationConfig).filter(
        VegetationConfig.tenant_id == current_user['tenant_id']
    ).first()
    
    if not config:
        # Return default config
        return {
            "tenant_id": current_user['tenant_id'],
            "default_index_type": "NDVI",
            "cloud_coverage_threshold": 20.0,
            "auto_process": True,
            "storage_type": "s3"
        }
    
    return config.to_dict()


@app.post("/api/vegetation/admin/sync-limits", status_code=status.HTTP_200_OK)
async def sync_limits(
    request: LimitsSyncRequest,
    _: None = Depends(require_service_auth),  # Service authentication required
    db: Session = Depends(get_db_session)  # Direct DB session (no tenant context needed for admin)
):
    """Sync limits from Core Platform.
    
    This endpoint is called by the Core Platform to push limit updates.
    Protected by X-Service-Auth header validation.
    """
    
    try:
        from decimal import Decimal
        
        # Get or create limits record
        limits = db.query(VegetationPlanLimits).filter(
            VegetationPlanLimits.tenant_id == request.tenant_id
        ).first()
        
        if not limits:
            limits = VegetationPlanLimits(tenant_id=request.tenant_id)
            db.add(limits)
        
        # Update limits
        limits.plan_type = request.plan_type
        limits.plan_name = request.plan_name
        limits.monthly_ha_limit = Decimal(str(request.monthly_ha_limit))
        limits.daily_ha_limit = Decimal(str(request.daily_ha_limit))
        limits.daily_jobs_limit = request.daily_jobs_limit
        limits.monthly_jobs_limit = request.monthly_jobs_limit
        limits.daily_download_jobs_limit = request.daily_download_jobs_limit
        limits.daily_process_jobs_limit = request.daily_process_jobs_limit
        limits.daily_calculate_jobs_limit = request.daily_calculate_jobs_limit
        limits.is_active = request.is_active
        limits.synced_at = datetime.utcnow()
        limits.synced_by = request.synced_by or 'core-platform'
        
        db.commit()
        db.refresh(limits)
        
        logger.info(f"Limits synced for tenant {request.tenant_id}: {request.plan_type}")
        
        return {
            "message": "Limits synced successfully",
            "tenant_id": request.tenant_id,
            "plan_type": request.plan_type,
            "limits": {
                "monthly_ha_limit": float(limits.monthly_ha_limit),
                "daily_ha_limit": float(limits.daily_ha_limit),
                "daily_jobs_limit": limits.daily_jobs_limit,
            }
        }
        
    except Exception as e:
        logger.error(f"Error syncing limits: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync limits: {str(e)}"
        )


@app.get("/api/vegetation/usage/current", response_model=UsageResponse)
async def get_current_usage(
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get current usage statistics for the tenant."""
    validator = LimitsValidator(db, current_user['tenant_id'])
    usage = validator.get_current_usage()
    
    return UsageResponse(**usage)


@app.post("/api/vegetation/calculate")
async def calculate_index(
    request: IndexCalculationRequest,
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Calculate vegetation index for a scene.
    
    Validates limits before creating the job.
    """
    try:
        # Validate limits (calculate_index jobs have minimal area, but check frequency)
        validator = LimitsValidator(db, current_user['tenant_id'])
        
        is_allowed, error_message, usage_info = validator.check_frequency_limit('calculate_index')
        
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Limit exceeded',
                    'message': error_message,
                    'usage': usage_info,
                    'limits': validator.limits,
                }
            )
        
        # Create job
        job = VegetationJob(
            tenant_id=current_user['tenant_id'],
            job_type='calculate_index',
            parameters={
                'scene_id': request.scene_id,
                'index_type': request.index_type,
                'formula': request.formula
            },
            entity_id=request.entity_id,
            created_by=current_user.get('user_id')
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Record usage (calculate jobs have minimal area, but count as job)
        UsageTracker.record_job_usage(
            db=db,
            tenant_id=current_user['tenant_id'],
            job_id=str(job.id),
            job_type='calculate_index',
            bounds=None,
            ha_processed=Decimal('0.0')  # Calculate jobs don't process new area
        )
        
        # Queue calculation task
        calculate_vegetation_index.delay(
            str(job.id),
            current_user['tenant_id'],
            request.scene_id,
            request.index_type,
            request.formula
        )
        
        return {
            "job_id": str(job.id),
            "message": "Index calculation queued"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating index: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate index: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

