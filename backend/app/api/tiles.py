"""
Tile server for vegetation indices.
Serves pre-calculated index tiles with colormap applied.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response
import rasterio
from rasterio.warp import transform_bounds
from rasterio.enums import Resampling
import numpy as np
from PIL import Image
import io

from app.middleware.auth import require_auth
from app.database import get_db_with_tenant
from app.models import VegetationIndexCache, VegetationScene
from uuid import UUID
from app.services.storage import create_storage_service, generate_tenant_bucket_name
from app.services.cache import get_tile_cache
from app.models import VegetationConfig
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vegetation/tiles", tags=["tiles"])

# Colormap for vegetation indices (NDVI-like)
# Values from -1 to 1, mapped to RGBA
NDVI_COLORMAP = {
    -1.0: (0, 0, 0, 0),  # Transparent for no data
    -0.5: (139, 69, 19, 255),  # Brown (soil)
    0.0: (255, 255, 200, 255),  # Light yellow (sparse vegetation)
    0.2: (200, 255, 100, 255),  # Light green
    0.4: (100, 255, 100, 255),  # Green
    0.6: (50, 200, 50, 255),  # Dark green
    0.8: (0, 150, 0, 255),  # Very dark green
    1.0: (0, 100, 0, 255),  # Darkest green (dense vegetation)
}


def apply_colormap(data: np.ndarray, colormap: dict) -> np.ndarray:
    """Apply colormap to index values using vectorized NumPy operations.
    
    Args:
        data: 2D array of index values
        colormap: Dictionary mapping values to RGBA tuples
        
    Returns:
        4D array (height, width, 4) with RGBA values
    """
    # Normalize data to 0-1 range
    data_min, data_max = -1.0, 1.0
    normalized = np.clip((data - data_min) / (data_max - data_min), 0, 1)
    
    # Convert colormap to arrays for vectorized operations
    colormap_keys = np.array(sorted(colormap.keys()))
    colormap_values = np.array([colormap[k] for k in colormap_keys], dtype=np.uint8)
    
    # Create RGBA output array
    height, width = normalized.shape
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    
    # Vectorized interpolation
    # For each pixel, find which colormap segment it belongs to
    # Using searchsorted for efficient lookup
    indices = np.searchsorted(colormap_keys, normalized, side='right')
    
    # Clamp indices to valid range
    indices = np.clip(indices, 1, len(colormap_keys) - 1)
    
    # Get surrounding colormap values
    idx_low = indices - 1
    idx_high = indices
    
    # Get interpolation factor t
    key_low = colormap_keys[idx_low]
    key_high = colormap_keys[idx_high]
    
    # Avoid division by zero
    key_diff = key_high - key_low
    key_diff = np.where(key_diff == 0, 1, key_diff)  # Replace zeros with 1
    
    t = (normalized - key_low) / key_diff
    t = np.clip(t, 0, 1)  # Ensure t is in [0, 1]
    
    # Expand t to 4 channels (RGBA)
    t_4d = np.expand_dims(t, axis=2)  # (H, W, 1)
    
    # Get colors for interpolation
    color_low = colormap_values[idx_low]  # (H, W, 4)
    color_high = colormap_values[idx_high]  # (H, W, 4)
    
    # Interpolate: color = color_low * (1-t) + color_high * t
    rgba = (color_low * (1 - t_4d) + color_high * t_4d).astype(np.uint8)
    
    # Handle NaN/inf values (set to transparent)
    mask = ~np.isfinite(normalized)
    rgba[mask] = [0, 0, 0, 0]
    
    return rgba


def generate_tile_from_cog(
    cog_path: str,
    z: int,
    x: int,
    y: int,
    storage_service,
    bucket: Optional[str] = None
) -> bytes:
    """Generate a tile from a Cloud Optimized GeoTIFF.
    
    Args:
        cog_path: Path to COG in storage
        z: Zoom level
        x: Tile X coordinate
        y: Tile Y coordinate
        storage_service: Storage service instance
        bucket: Optional bucket name
        
    Returns:
        PNG image bytes
    """
    # Download COG to temporary file
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.tif', delete=False) as tmp_file:
        tmp_path = tmp_file.name
    
    try:
        # Download from storage
        storage_service.download_file(cog_path, tmp_path, bucket)
        
        # Open COG
        with rasterio.open(tmp_path) as src:
            # Calculate tile bounds (Web Mercator)
            import math
            
            n = 2.0 ** z
            lon_min = (x / n) * 360.0 - 180.0
            lon_max = ((x + 1) / n) * 360.0 - 180.0
            lat_min = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
            lat_max = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
            
            # Read data for tile bounds
            window = rasterio.windows.from_bounds(
                lon_min, lat_min, lon_max, lat_max,
                src.transform
            )
            
            # Read data
            data = src.read(1, window=window, out_shape=(256, 256), resampling=Resampling.bilinear)
            
            # Apply colormap
            rgba = apply_colormap(data, NDVI_COLORMAP)
            
            # Convert to PIL Image
            img = Image.fromarray(rgba, 'RGBA')
            
            # Save to bytes
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            return img_bytes.read()
            
    finally:
        # Clean up temp file
        import os
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/{z}/{x}/{y}.png")
async def get_tile(
    z: int,
    x: int,
    y: int,
    scene_id: str = Query(..., description="Scene ID"),
    index_type: str = Query("NDVI", description="Index type"),
    current_user: dict = Depends(require_auth),
    db: Session = Depends(lambda: next(get_db_with_tenant(current_user['tenant_id'])))
):
    """Get vegetation index tile with lazy caching.
    
    Strategy:
    1. Check Redis cache (fast, <10ms)
    2. If not found, generate from COG (50-200ms)
    3. Cache result for 24 hours
    
    Args:
        z: Zoom level
        x: Tile X coordinate
        y: Tile Y coordinate
        scene_id: Scene ID
        index_type: Index type (NDVI, EVI, etc.)
        
    Returns:
        PNG image tile
    """
    # Get cache instance
    cache = get_tile_cache()
    
    # Try cache first (lazy caching strategy)
    # Note: scene_id is UUID, we'll validate and use it for cache key
    cached_tile = cache.get_tile(z, x, y, scene_id, index_type)
    if cached_tile:
        logger.debug(f"Returning cached tile {z}/{x}/{y}")
        return Response(content=cached_tile, media_type="image/png")
    
    # Cache miss - generate tile
    try:
        # Get scene first to validate
        scene = db.query(VegetationScene).filter(
            VegetationScene.tenant_id == current_user['tenant_id'],
            VegetationScene.id == UUID(scene_id)
        ).first()
        
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        # Get index cache entry
        cache_entry = db.query(VegetationIndexCache).filter(
            VegetationIndexCache.tenant_id == current_user['tenant_id'],
            VegetationIndexCache.scene_id == scene.id,
            VegetationIndexCache.index_type == index_type
        ).first()
        
        if not cache_entry:
            raise HTTPException(status_code=404, detail="Index not found for this scene")
        
        # Check if tiles are pre-generated
        if cache_entry.result_tiles_path:
            # Serve from pre-generated tiles
            tile_path = f"{cache_entry.result_tiles_path}/{z}/{x}/{y}.png"
            
            # Get storage service
            config = db.query(VegetationConfig).filter(
                VegetationConfig.tenant_id == current_user['tenant_id']
            ).first()
            
            # Generate bucket name automatically based on tenant_id (security)
            bucket_name = generate_tenant_bucket_name(current_user['tenant_id'])
            
            storage = create_storage_service(
                storage_type=config.storage_type if config else 's3',
                default_bucket=bucket_name
            )
            
            # Check if tile exists
            if storage.file_exists(tile_path, bucket_name):
                # Download and return
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                    tmp_path = tmp_file.name
                
                try:
                    storage.download_file(tile_path, tmp_path, bucket_name)
                    with open(tmp_path, 'rb') as f:
                        tile_data = f.read()
                    return Response(content=tile_data, media_type="image/png")
                finally:
                    import os
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
        
        # Fallback: Generate tile on-demand from COG
        if cache_entry.result_raster_path:
            config = db.query(VegetationConfig).filter(
                VegetationConfig.tenant_id == current_user['tenant_id']
            ).first()
            
            # Generate bucket name automatically based on tenant_id (security)
            bucket_name = generate_tenant_bucket_name(current_user['tenant_id'])
            
            storage = create_storage_service(
                storage_type=config.storage_type if config else 's3',
                default_bucket=bucket_name
            )
            
            tile_data = generate_tile_from_cog(
                cache_entry.result_raster_path,
                z, x, y,
                storage,
                bucket_name
            )
            
            # Cache the generated tile for future requests (use scene.id for cache key)
            cache.set_tile(z, x, y, str(scene.id), index_type, tile_data)
            
            return Response(content=tile_data, media_type="image/png")
        
        raise HTTPException(status_code=404, detail="No raster data available")
        
    except Exception as e:
        logger.error(f"Error generating tile: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate tile: {str(e)}")


# Register router in main.py
# from app.api.tiles import router as tiles_router
# app.include_router(tiles_router)

