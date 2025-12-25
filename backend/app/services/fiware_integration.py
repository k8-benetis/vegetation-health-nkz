"""
FIWARE NGSI-LD integration for Vegetation Prime module.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import uuid4

logger = logging.getLogger(__name__)

# FIWARE Smart Data Models context
FIWARE_CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
AGRIPARCEL_CONTEXT = "https://smart-data-models.org/dataModel.Agrifood/AgriParcel/context.jsonld"


class FIWAREMapper:
    """Maps vegetation index data to FIWARE NGSI-LD format."""
    
    @staticmethod
    def create_agri_parcel_record(
        entity_id: str,
        parcel_id: str,
        index_type: str,
        index_value: float,
        sensing_date: str,
        statistics: Optional[Dict[str, float]] = None,
        geometry: Optional[Dict] = None,
        additional_properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create an AgriParcelRecord entity in NGSI-LD format.
        
        Args:
            entity_id: Unique entity ID (or None to generate)
            parcel_id: Reference to AgriParcel entity
            index_type: Type of vegetation index (NDVI, EVI, etc.)
            index_value: Mean index value
            sensing_date: Date of sensing (ISO format)
            statistics: Optional statistics dictionary
            geometry: Optional GeoJSON geometry
            additional_properties: Optional additional properties
            
        Returns:
            NGSI-LD entity dictionary
        """
        if entity_id is None:
            entity_id = f"urn:ngsi-ld:AgriParcelRecord:{uuid4()}"
        
        entity = {
            "@context": [
                FIWARE_CONTEXT,
                AGRIPARCEL_CONTEXT
            ],
            "id": entity_id,
            "type": "AgriParcelRecord",
            "dateObserved": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": sensing_date
                }
            },
            "refAgriParcel": {
                "type": "Relationship",
                "object": parcel_id
            },
            "vegetationIndex": {
                "type": "Property",
                "value": {
                    "indexType": index_type,
                    "value": float(index_value),
                    "unit": "dimensionless"
                }
            }
        }
        
        # Add statistics if provided
        if statistics:
            entity["vegetationIndex"]["value"]["statistics"] = {
                "mean": statistics.get("mean", index_value),
                "min": statistics.get("min", 0.0),
                "max": statistics.get("max", 0.0),
                "stdDev": statistics.get("std", 0.0),
                "pixelCount": statistics.get("pixel_count", 0)
            }
        
        # Add geometry if provided
        if geometry:
            entity["location"] = {
                "type": "GeoProperty",
                "value": geometry
            }
        
        # Add additional properties
        if additional_properties:
            for key, value in additional_properties.items():
                if key not in entity:
                    entity[key] = {
                        "type": "Property",
                        "value": value
                    }
        
        return entity
    
    @staticmethod
    def update_agri_parcel(
        parcel_entity: Dict[str, Any],
        index_type: str,
        index_value: float,
        sensing_date: str,
        statistics: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Update an existing AgriParcel entity with vegetation index data.
        
        Args:
            parcel_entity: Existing AgriParcel entity
            index_type: Type of vegetation index
            index_value: Mean index value
            sensing_date: Date of sensing
            statistics: Optional statistics
            
        Returns:
            Updated AgriParcel entity
        """
        # Ensure @context exists
        if "@context" not in parcel_entity:
            parcel_entity["@context"] = [FIWARE_CONTEXT, AGRIPARCEL_CONTEXT]
        
        # Add or update vegetationIndex property
        index_property = {
            "type": "Property",
            "value": {
                "indexType": index_type,
                "value": float(index_value),
                "unit": "dimensionless",
                "dateObserved": sensing_date
            }
        }
        
        if statistics:
            index_property["value"]["statistics"] = {
                "mean": statistics.get("mean", index_value),
                "min": statistics.get("min", 0.0),
                "max": statistics.get("max", 0.0),
                "stdDev": statistics.get("std", 0.0),
                "pixelCount": statistics.get("pixel_count", 0)
            }
        
        # Store in a vegetationIndices array or as separate property
        if "vegetationIndices" not in parcel_entity:
            parcel_entity["vegetationIndices"] = {
                "type": "Property",
                "value": []
            }
        
        # Add new index reading
        parcel_entity["vegetationIndices"]["value"].append(index_property["value"])
        
        # Also set as latest index
        parcel_entity[f"latest{index_type}"] = index_property
        
        return parcel_entity
    
    @staticmethod
    def create_timeseries_batch(
        parcel_id: str,
        index_type: str,
        time_series_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Create a batch of AgriParcelRecord entities for time series.
        
        Args:
            parcel_id: Reference to AgriParcel entity
            index_type: Type of vegetation index
            time_series_data: List of dicts with 'date', 'value', 'statistics'
            
        Returns:
            List of NGSI-LD entities
        """
        entities = []
        
        for data_point in time_series_data:
            entity = FIWAREMapper.create_agri_parcel_record(
                entity_id=None,  # Auto-generate
                parcel_id=parcel_id,
                index_type=index_type,
                index_value=data_point.get("value", 0.0),
                sensing_date=data_point.get("date"),
                statistics=data_point.get("statistics"),
                additional_properties=data_point.get("additional_properties")
            )
            entities.append(entity)
        
        return entities


class FIWAREClient:
    """Client for interacting with FIWARE Context Broker."""
    
    def __init__(self, context_broker_url: str, tenant_id: str, auth_token: Optional[str] = None):
        """Initialize FIWARE client.
        
        Args:
            context_broker_url: URL of the Context Broker (e.g., http://orion:1026)
            tenant_id: Tenant ID for multi-tenancy
            auth_token: Optional authentication token
        """
        self.context_broker_url = context_broker_url.rstrip('/')
        self.tenant_id = tenant_id
        self.auth_token = auth_token
        
        import requests
        self.session = requests.Session()
        
        if auth_token:
            self.session.headers.update({
                'Authorization': f'Bearer {auth_token}'
            })
        
        # FIWARE-Service header for multi-tenancy
        self.session.headers.update({
            'Fiware-Service': tenant_id,
            'Content-Type': 'application/ld+json'
        })
    
    def create_entity(self, entity: Dict[str, Any]) -> bool:
        """Create or update an entity in Context Broker.
        
        Args:
            entity: NGSI-LD entity dictionary
            
        Returns:
            True if successful
        """
        try:
            url = f"{self.context_broker_url}/ngsi-ld/v1/entities"
            
            response = self.session.post(url, json=entity)
            response.raise_for_status()
            
            logger.info(f"Created entity {entity.get('id')} in Context Broker")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create entity in Context Broker: {str(e)}")
            # Try update if create fails (entity might already exist)
            return self.update_entity(entity)
    
    def update_entity(self, entity: Dict[str, Any]) -> bool:
        """Update an existing entity in Context Broker.
        
        Args:
            entity: NGSI-LD entity dictionary
            
        Returns:
            True if successful
        """
        try:
            entity_id = entity.get('id')
            if not entity_id:
                raise ValueError("Entity ID is required for update")
            
            url = f"{self.context_broker_url}/ngsi-ld/v1/entities/{entity_id}/attrs"
            
            # Extract attributes (everything except id, type, @context)
            attrs = {k: v for k, v in entity.items() if k not in ('id', 'type', '@context')}
            
            response = self.session.patch(url, json=attrs)
            response.raise_for_status()
            
            logger.info(f"Updated entity {entity_id} in Context Broker")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update entity in Context Broker: {str(e)}")
            return False
    
    def query_entities(
        self,
        entity_type: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query entities from Context Broker.
        
        Args:
            entity_type: Type of entity to query
            filters: Optional filters (e.g., {'refAgriParcel': 'parcel-id'})
            limit: Maximum number of results
            
        Returns:
            List of entities
        """
        try:
            url = f"{self.context_broker_url}/ngsi-ld/v1/entities"
            
            params = {
                'type': entity_type,
                'limit': limit
            }
            
            # Add filters as query parameters
            if filters:
                for key, value in filters.items():
                    params[f'q'] = f"{key}=={value}"
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to query entities from Context Broker: {str(e)}")
            return []

