/**
 * Zoning Layer Component (Phase F6 Frontend)
 * Renders VRA Management Zones on the map using Deck.gl GeoJsonLayer.
 * Fetches zone polygons from backend /api/jobs/zoning/{parcel_id}/geojson
 */

import React, { useEffect, useState } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { useVegetationContext } from '../../services/vegetationContext';
import { useAuth } from '../../hooks/useAuth';

// Zone colors based on cluster ID (vigor levels)
const ZONE_COLORS: Record<number, [number, number, number, number]> = {
  0: [220, 53, 69, 180],   // Low vigor - Red
  1: [255, 193, 7, 180],   // Medium vigor - Yellow
  2: [40, 167, 69, 180],   // High vigor - Green
};

interface ZoningLayerProps {
  parcelId?: string;
  visible?: boolean;
}

interface ZoneFeature {
  type: string;
  properties: {
    zone_id: number;
    mean_ndvi?: number;
    area_ha?: number;
    recommendation?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface ZoningGeoJSON {
  type: 'FeatureCollection';
  features: ZoneFeature[];
}

export function createZoningLayer(
  geojsonData: ZoningGeoJSON | null,
  visible: boolean = true,
  onZoneClick?: (zoneId: number, properties: Record<string, unknown>) => void
): GeoJsonLayer | null {
  if (!geojsonData || !visible) return null;

  return new GeoJsonLayer({
    id: 'vra-zoning-layer',
    data: geojsonData as any, // Cast to any to avoid strict Deck.gl GeoJSON mismatches
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    lineWidthScale: 1,
    lineWidthMinPixels: 2,
    
    // Explicitly cast return type to any or Color to satisfy Deck.gl typings
    getFillColor: ((feature: ZoneFeature) => {
      const zoneId = feature.properties?.zone_id ?? 1;
      return (ZONE_COLORS[zoneId] || [128, 128, 128, 150]) as [number, number, number, number];
    }) as any,
    
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    
    onClick: (info: any) => {
      if (info.object && onZoneClick) {
        const props = (info.object as ZoneFeature).properties;
        onZoneClick(props.zone_id, props);
      }
    },
    
    updateTriggers: {
      getFillColor: [geojsonData],
    },
  });
}

export const ZoningLayerControl: React.FC<ZoningLayerProps> = ({
  parcelId: propParcelId,
  visible = true,
}) => {
  const { selectedEntityId, selectedIndex } = useVegetationContext();
  const { token } = useAuth();
  
  const effectiveParcelId = propParcelId || selectedEntityId;
  
  const [geojsonData, setGeojsonData] = useState<ZoningGeoJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show zoning when VRA_ZONES index is selected
  const shouldShowZoning = selectedIndex === 'VRA_ZONES' && visible;

  useEffect(() => {
    if (!shouldShowZoning || !effectiveParcelId || !token) {
      setGeojsonData(null);
      return;
    }

    const fetchZones = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/vegetation/jobs/zoning/${encodeURIComponent(effectiveParcelId)}/geojson`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.status === 404) {
          // No zones generated yet
          setGeojsonData(null);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch zones: ${response.status}`);
        }
        
        const data = await response.json();
        setGeojsonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading zones');
        setGeojsonData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, [shouldShowZoning, effectiveParcelId, token]);

  // This component just manages the data - the actual layer is created
  // by the parent (VegetationLayer) using createZoningLayer()
  
  if (loading) {
    return (
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm text-slate-600">Cargando zonas VRA...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute bottom-4 left-4 bg-red-50 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (!geojsonData && shouldShowZoning && effectiveParcelId) {
    return (
      <div className="absolute bottom-4 left-4 bg-amber-50 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm text-amber-700">
          Sin zonas VRA. Lanza un análisis primero.
        </span>
      </div>
    );
  }

  // Legend when zones are visible
  if (geojsonData && shouldShowZoning) {
    return (
      <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Zonas de Manejo</h4>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(40, 167, 69, 0.7)' }} />
            <span className="text-xs text-slate-600">Alto Vigor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 193, 7, 0.7)' }} />
            <span className="text-xs text-slate-600">Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(220, 53, 69, 0.7)' }} />
            <span className="text-xs text-slate-600">Bajo Vigor</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          {geojsonData.features.length} zonas detectadas
        </p>
      </div>
    );
  }

  return null;
};

export default ZoningLayerControl;
