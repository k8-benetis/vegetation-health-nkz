import logging
import json
import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape, mapping
from scipy.cluster.vq import kmeans2, whiten
from ..core.orion import OrionClient

logger = logging.getLogger(__name__)

class ZoningAlgorithm:
    """
    Phase F6: Management Zone Clustering (VRA)
    Uses K-Means clustering on accumulated vegetation indices to define management zones.
    """
    
    def __init__(self):
        self.orion = OrionClient()

    def cluster_raster(self, raster_data: np.ndarray, n_clusters: int=3):
        """
        Clusters a raster into n zones.
        """
        # Flatten and remove NaNs/Masked values
        valid_mask = ~np.isnan(raster_data) & (raster_data > -1) # Basic NDVI validity
        valid_pixels = raster_data[valid_mask]

        if len(valid_pixels) < n_clusters:
            logger.warning("Not enough valid pixels for clustering")
            return None, None

        # Reshape for scipy (N, 1)
        observations = valid_pixels.reshape(-1, 1)
        
        # Whiten (normalize)
        whitened = whiten(observations)
        
        # K-Means
        centroids, labels = kmeans2(whitened, n_clusters, minit='points')
        
        # Reconstruct label image
        output_labels = np.full(raster_data.shape, -1, dtype=int)
        output_labels[valid_mask] = labels
        
        return output_labels, centroids

    def vectorize_zones(self, label_img: np.ndarray, transform):
        """
        Converts clustering result to GeoJSON polygons.
        """
        # Ensure label_img is int32 for shapes
        label_img_int = label_img.astype(np.int32)
        mask = label_img_int != -1
        
        results = (
            {'properties': {'zone_id': int(v)}, 'geometry': s}
            for i, (s, v) 
            in enumerate(shapes(label_img_int, mask=mask, transform=transform))
        )
        return list(results)

    async def generate_zones(self, parcel_id: str, n_zones: int=3):
        """
        Main workflow:
        1. Fetch latest NDVI Raster URL from Orion/MinIO (Simulated here or fetched via mocked path)
        2. Cluster
        3. Create AgriManagementZone entities
        """
        logger.info(f"Generating {n_zones} management zones for {parcel_id}")
        
        # Mocking a raster for prototype stability
        width = 100
        height = 100
        mock_ndvi = np.random.uniform(0.1, 0.9, (width, height))
        mock_transform = rasterio.transform.from_origin(0, 0, 10, 10) # Mock coords

        # 2. Cluster
        labels, centroids = self.cluster_raster(mock_ndvi, n_zones)
        
        if labels is None:
            return

        # 3. Vectorize
        vectors = self.vectorize_zones(labels, mock_transform)
        
        if not vectors:
            logger.warning("No zones generated")
            return

        # 4. Upload to Orion
        for zone in vectors:
            zone_id = f"urn:ngsi-ld:AgriManagementZone:{parcel_id.split(':')[-1]}:Z{zone['properties']['zone_id']}"
            entity = {
                "id": zone_id,
                "type": "AgriManagementZone",
                "refAgriParcel": {
                    "type": "Relationship",
                    "object": parcel_id
                },
                "location": {
                    "type": "GeoProperty",
                    "value": zone['geometry']
                },
                "zoneName": {
                    "type": "Property",
                    "value": f"Zone {zone['properties']['zone_id'] + 1}"
                },
                "variableAttribute": {
                    "type": "Property",
                    "value": "NDVI"
                }
            }
            # Create or Update
            try:
                 self.orion.update_entity(zone_id, entity)
            except Exception as e:
                 logger.warn(f"Failed to update zone {zone_id}: {e}")
            logger.info(f"Created/Updated Zone: {zone_id}")

        logger.info(f"Successfully generated {len(vectors)} zones for {parcel_id}")

if __name__ == "__main__":
    algo = ZoningAlgorithm()
