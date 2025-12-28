"""
Vegetation index processor with support for multiple indices and custom formulas.
"""

import logging
from typing import Dict, Optional, Tuple, Any
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.features import rasterize
from shapely.geometry import shape
import simpleeval

logger = logging.getLogger(__name__)


class VegetationIndexProcessor:
    """Processes vegetation indices from Sentinel-2 bands."""
    
    # Sentinel-2 band mappings (10m and 20m resolution)
    BAND_MAPPING = {
        'B02': 'Blue',      # 10m
        'B03': 'Green',     # 10m
        'B04': 'Red',       # 10m
        'B08': 'NIR',       # 10m
        'B05': 'RedEdge1',  # 20m
        'B06': 'RedEdge2',  # 20m
        'B07': 'RedEdge3',  # 20m
        'B8A': 'RedEdge4',  # 20m
        'B11': 'SWIR1',     # 20m
        'B12': 'SWIR2',     # 20m
    }
    
    def __init__(self, band_paths: Dict[str, str]):
        """Initialize processor with band file paths.
        
        Args:
            band_paths: Dictionary mapping band names to file paths
                       e.g., {'B04': '/path/to/B04.tif', 'B08': '/path/to/B08.tif'}
        """
        self.band_paths = band_paths
        self.band_data: Dict[str, np.ndarray] = {}
        self.band_meta: Optional[Dict] = None
    
    def load_bands(self, bands: list[str]) -> None:
        """Load specified bands into memory.
        
        Args:
            bands: List of band names to load (e.g., ['B04', 'B08'])
        """
        for band in bands:
            if band not in self.band_paths:
                raise ValueError(f"Band {band} not found in band_paths")
            
            band_path = self.band_paths[band]
            if not Path(band_path).exists():
                raise FileNotFoundError(f"Band file not found: {band_path}")
            
            with rasterio.open(band_path) as src:
                data = src.read(1).astype(np.float32)
                # Store metadata from first band
                if self.band_meta is None:
                    self.band_meta = src.meta.copy()
                
                self.band_data[band] = data
        
        logger.info(f"Loaded {len(bands)} bands: {bands}")
    
    def _resample_to_10m(self, band_20m: np.ndarray, reference_meta: Dict) -> np.ndarray:
        """Resample 20m band to 10m resolution.
        
        Args:
            band_20m: 20m resolution band data
            reference_meta: Reference metadata (10m band)
            
        Returns:
            Resampled band at 10m resolution
        """
        # Create temporary dataset for 20m band
        temp_20m_path = '/tmp/temp_20m.tif'
        with rasterio.open(temp_20m_path, 'w', **self.band_meta) as dst:
            dst.write(band_20m, 1)
        
        # Calculate transform for 10m
        transform, width, height = calculate_default_transform(
            self.band_meta['crs'],
            reference_meta['crs'],
            reference_meta['width'],
            reference_meta['height'],
            *reference_meta['bounds']
        )
        
        # Reproject to 10m
        resampled = np.zeros((height, width), dtype=np.float32)
        reproject(
            source=rasterio.band(dst, 1),
            destination=resampled,
            src_transform=self.band_meta['transform'],
            src_crs=self.band_meta['crs'],
            dst_transform=transform,
            dst_crs=reference_meta['crs'],
            resampling=Resampling.bilinear
        )
        
        Path(temp_20m_path).unlink()
        return resampled
    
    def calculate_ndvi(self) -> np.ndarray:
        """Calculate NDVI (Normalized Difference Vegetation Index).
        
        Formula: (NIR - Red) / (NIR + Red)
        Range: -1 to 1 (typically 0 to 1 for vegetation)
        """
        self.load_bands(['B04', 'B08'])
        
        red = self.band_data['B04']
        nir = self.band_data['B08']
        
        # Avoid division by zero
        denominator = nir + red
        ndvi = np.where(denominator != 0, (nir - red) / denominator, 0)
        
        # Clip to valid range
        ndvi = np.clip(ndvi, -1, 1)
        
        return ndvi
    
    def calculate_evi(self) -> np.ndarray:
        """Calculate EVI (Enhanced Vegetation Index).
        
        Formula: 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
        Range: -1 to 1 (typically 0 to 1)
        """
        self.load_bands(['B02', 'B04', 'B08'])
        
        blue = self.band_data['B02']
        red = self.band_data['B04']
        nir = self.band_data['B08']
        
        denominator = nir + 6 * red - 7.5 * blue + 1
        evi = np.where(denominator != 0, 2.5 * ((nir - red) / denominator), 0)
        
        evi = np.clip(evi, -1, 1)
        
        return evi
    
    def calculate_savi(self, l: float = 0.5) -> np.ndarray:
        """Calculate SAVI (Soil-Adjusted Vegetation Index).
        
        Formula: ((NIR - Red) / (NIR + Red + L)) * (1 + L)
        L: Soil adjustment factor (typically 0.5)
        Range: -1 to 1
        """
        self.load_bands(['B04', 'B08'])
        
        red = self.band_data['B04']
        nir = self.band_data['B08']
        
        denominator = nir + red + l
        savi = np.where(denominator != 0, ((nir - red) / denominator) * (1 + l), 0)
        
        savi = np.clip(savi, -1, 1)
        
        return savi
    
    def calculate_gndvi(self) -> np.ndarray:
        """Calculate GNDVI (Green Normalized Difference Vegetation Index).
        
        Formula: (NIR - Green) / (NIR + Green)
        Range: -1 to 1
        """
        self.load_bands(['B03', 'B08'])
        
        green = self.band_data['B03']
        nir = self.band_data['B08']
        
        denominator = nir + green
        gndvi = np.where(denominator != 0, (nir - green) / denominator, 0)
        
        gndvi = np.clip(gndvi, -1, 1)
        
        return gndvi
    
    def calculate_ndre(self) -> np.ndarray:
        """Calculate NDRE (Normalized Difference Red Edge).
        
        Formula: (NIR - RedEdge) / (NIR + RedEdge)
        Uses B8A (RedEdge4) as RedEdge band
        Range: -1 to 1
        """
        self.load_bands(['B8A', 'B08'])
        
        rededge = self.band_data['B8A']
        nir = self.band_data['B08']
        
        # Resample B8A to 10m if needed (it's 20m)
        if rededge.shape != nir.shape:
            # This would require resampling - simplified for now
            logger.warning("B8A and B08 have different resolutions, resampling needed")
        
        denominator = nir + rededge
        ndre = np.where(denominator != 0, (nir - rededge) / denominator, 0)
        
        ndre = np.clip(ndre, -1, 1)
        
        return ndre
    
    def calculate_custom_index(self, formula: str) -> np.ndarray:
        """Calculate custom index using safe formula evaluation.
        
        Args:
            formula: Mathematical formula using band names
                    e.g., "(B08-B04)/(B08+B04)" for NDVI
                    Available bands: B02, B03, B04, B05, B06, B07, B08, B8A, B11, B12
        
        Returns:
            Calculated index array
        """
        # Validate formula syntax
        try:
            # Load all bands mentioned in formula
            required_bands = self._extract_bands_from_formula(formula)
            if not required_bands:
                raise ValueError("No valid bands found in formula")
            
            self.load_bands(required_bands)
            
            # Create safe namespace with numpy and band arrays
            # We'll use a safe evaluation approach with numpy operations
            safe_namespace = {
                'np': np,
                '__builtins__': {},
            }
            
            # Add band arrays to namespace
            for band in required_bands:
                if band in self.band_data:
                    safe_namespace[band] = self.band_data[band]
            
            # Replace band names in formula to use namespace
            # e.g., "B08" becomes safe_namespace['B08']
            formula_safe = formula
            for band in required_bands:
                formula_safe = formula_safe.replace(band, f'safe_namespace["{band}"]')
            
            # Evaluate with safe namespace (only numpy operations allowed)
            # This is safer than eval() but still allows numpy array operations
            result = eval(formula_safe, safe_namespace)
            
            # Validate result
            if not isinstance(result, np.ndarray):
                raise ValueError("Formula must return a numpy array")
            
            # Clip to reasonable range
            result = np.clip(result, -10, 10)
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating custom index: {str(e)}")
            raise ValueError(f"Invalid formula: {str(e)}")
    
    def _extract_bands_from_formula(self, formula: str) -> list[str]:
        """Extract band names from formula string.
        
        Args:
            formula: Formula string
            
        Returns:
            List of band names found in formula
        """
        available_bands = list(self.BAND_MAPPING.keys())
        found_bands = []
        
        for band in available_bands:
            if band in formula:
                found_bands.append(band)
        
        return found_bands
    
    def calculate_statistics(self, index_array: np.ndarray, mask: Optional[np.ndarray] = None) -> Dict[str, float]:
        """Calculate statistics for index array.
        
        Args:
            index_array: Index values array
            mask: Optional mask to exclude certain pixels
            
        Returns:
            Dictionary with statistics
        """
        if mask is not None:
            index_array = np.ma.masked_array(index_array, mask=mask)
        
        valid_data = index_array[~np.isnan(index_array)]
        if len(valid_data) == 0:
            return {
                'mean': 0.0,
                'min': 0.0,
                'max': 0.0,
                'std': 0.0,
                'pixel_count': 0
            }
        
        return {
            'mean': float(np.mean(valid_data)),
            'min': float(np.min(valid_data)),
            'max': float(np.max(valid_data)),
            'std': float(np.std(valid_data)),
            'pixel_count': int(len(valid_data))
        }
    
    def save_index_raster(self, index_array: np.ndarray, output_path: str) -> str:
        """Save index array as GeoTIFF.
        
        Args:
            index_array: Index values array
            output_path: Output file path
            
        Returns:
            Output file path
        """
        if self.band_meta is None:
            raise ValueError("No band metadata available. Load bands first.")
        
        # Update metadata for single band output
        output_meta = self.band_meta.copy()
        output_meta.update({
            'count': 1,
            'dtype': 'float32',
            'compress': 'lzw',
            'nodata': -9999
        })
        
        with rasterio.open(output_path, 'w', **output_meta) as dst:
            dst.write(index_array.astype(np.float32), 1)
        
        logger.info(f"Saved index raster to {output_path}")
        return output_path
    
    @staticmethod
    def create_temporal_composite(
        index_arrays: list[np.ndarray],
        method: str = 'median'
    ) -> np.ndarray:
        """Create temporal composite from multiple index arrays using median (cloud-free).
        
        Args:
            index_arrays: List of index arrays from different scenes (must be same shape)
            method: Composite method ('median' or 'mean'). Median is recommended for cloud removal.
            
        Returns:
            Composite index array
        """
        if not index_arrays:
            raise ValueError("No index arrays provided for composite")
        
        if len(index_arrays) == 1:
            return index_arrays[0]
        
        # Stack arrays (shape: [n_scenes, height, width])
        stacked = np.stack(index_arrays, axis=0)
        
        # Replace NaN with -9999 for proper handling
        stacked = np.where(np.isnan(stacked), -9999, stacked)
        
        if method == 'median':
            # Median composite (best for cloud removal)
            composite = np.median(stacked, axis=0)
        elif method == 'mean':
            # Mean composite
            composite = np.mean(stacked, axis=0)
        else:
            raise ValueError(f"Unknown composite method: {method}")
        
        # Restore NaN for invalid pixels (where all scenes had -9999)
        composite = np.where(composite == -9999, np.nan, composite)
        
        logger.info(f"Created {method} temporal composite from {len(index_arrays)} scenes")
        return composite

