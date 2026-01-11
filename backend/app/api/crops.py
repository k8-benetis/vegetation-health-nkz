from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any

router = APIRouter()

CROP_LOGIC = {
    "olive": {"default_index": "SAVI", "valid_indices": ["SAVI", "NDMI", "NDVI"]},
    "vineyard": {"default_index": "SAVI", "valid_indices": ["SAVI", "NDMI", "NDVI"]},
    "almond": {"default_index": "SAVI", "valid_indices": ["SAVI", "NDMI", "NDVI"]},
    "wheat": {"default_index": "NDVI", "valid_indices": ["NDVI", "NDRE", "GNDVI"]},
    "corn": {"default_index": "NDVI", "valid_indices": ["NDVI", "NDRE", "GNDVI"]},
    "barley": {"default_index": "NDVI", "valid_indices": ["NDVI", "NDRE", "GNDVI"]},
}

@router.get("/logic/recommendation/{crop_species}")
async def get_crop_recommendation(crop_species: str) -> Dict[str, Any]:
    """
    Get vegetation index recommendations based on crop species.
    """
    species_key = crop_species.lower()
    
    if species_key in CROP_LOGIC:
        return CROP_LOGIC[species_key]
    else:
        # Default behavior
        return {"default_index": "NDVI", "valid_indices": ["NDVI", "NDMI", "SAVI"]}
