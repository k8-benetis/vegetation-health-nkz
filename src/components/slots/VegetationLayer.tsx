/**
 * Vegetation Layer - Deck.gl layer component for rendering vegetation index tiles.
 * This component does NOT render DOM, it returns a Deck.gl layer configuration.
 */

import React, { useEffect, useState } from 'react';
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { useVegetationContext } from '../../services/vegetationContext';
import type { VegetationIndexType } from '../../types';

interface VegetationLayerProps {
  /** Map view state (from Deck.gl or Mapbox) */
  viewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  /** Callback when layer is ready */
  onLayerReady?: (layer: any) => void;
}

/**
 * Creates a Deck.gl TileLayer for vegetation indices or Zoning.
 * This function returns a layer configuration, not a React component.
 */
export function createVegetationLayer(
  selectedIndex: VegetationIndexType,
  selectedDate: string | null,
  sceneId?: string
): TileLayer | GeoJsonLayer | null {
  if (!selectedDate && selectedIndex !== 'VRA_ZONES') {
     return null;
  }
  
  if (!sceneId) return null;

  // Handle Zoning (Vector)
  if (selectedIndex === 'VRA_ZONES') {
     // Fetch GeoJSON for the parcel's management zones
     return new GeoJsonLayer({
        id: 'zoning-layer',
        data: `/api/jobs/zoning/${sceneId}/geojson`, 
        pickable: true,
        stroked: true,
        filled: true,
        extruded: true,
        lineWidthScale: 20,
        lineWidthMinPixels: 2,
        getFillColor: [160, 160, 180, 200],
        getLineColor: [0, 0, 0, 255],
        getElevation: (d: any) => d.properties.cluster_id * 10 || 10, 
        onHover: ({object: _object}: any) => {
            // Tooltip handled by host
        }
     });
  }

  // Handle Raster (Optical & SAR)
  const tileUrl = `/api/vegetation/tiles/{z}/{x}/{y}.png?scene_id=${sceneId}&index_type=${selectedIndex}`;

  // Create BitmapLayer for each tile
  const renderSubLayers = (props: any) => {
    const { bbox, tile } = props;
    
    return new BitmapLayer(props, {
      data: undefined,
      image: tile.data,
      bounds: bbox,
      opacity: 0.8,
      transparent: true,
      colorMode: 'multiply',
    });
  };

  // Create TileLayer
  return new TileLayer({
    id: `vegetation-layer-${selectedIndex}`,
    data: tileUrl,
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256,
    renderSubLayers,
    updateTriggers: {
      getTileData: [selectedIndex, selectedDate, sceneId],
    },
    onTileError: (error: Error, tile: any) => {
      console.warn('Tile load error:', error, tile);
    },
  });
}

/**
 * Hook to get the current vegetation layer based on context.
 * Returns the layer configuration ready to be added to Deck.gl.
 */
export function useVegetationLayer(
  sceneId?: string
): TileLayer | GeoJsonLayer | null {
  const { selectedIndex, selectedDate, selectedSceneId } = useVegetationContext();
  const [layer, setLayer] = useState<TileLayer | GeoJsonLayer | null>(null);

  // Use provided sceneId or fallback to context
  const effectiveSceneId = sceneId || selectedSceneId;

  useEffect(() => {
    // For VRA_ZONES, we may not need a Date, but we need an Entity/Scene ID
    if (selectedIndex === 'VRA_ZONES' && effectiveSceneId) {
        setLayer(createVegetationLayer(selectedIndex, null, effectiveSceneId));
    } else if (selectedDate && effectiveSceneId) {
        setLayer(createVegetationLayer(selectedIndex, selectedDate, effectiveSceneId));
    } else {
        setLayer(null);
    }
  }, [selectedIndex, selectedDate, effectiveSceneId]);

  return layer;
}

/**
 * React component wrapper for vegetation layer.
 */
export const VegetationLayer: React.FC<VegetationLayerProps> = ({
  onLayerReady,
}) => {
  const { selectedEntityId } = useVegetationContext();
  const layer = useVegetationLayer(selectedEntityId || undefined);

  useEffect(() => {
    if (layer && onLayerReady) {
      onLayerReady(layer);
    }
  }, [layer, onLayerReady]);

  return null;
};

export default VegetationLayer;
