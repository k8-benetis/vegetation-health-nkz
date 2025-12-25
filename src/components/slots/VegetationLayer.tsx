/**
 * Vegetation Layer - Deck.gl layer component for rendering vegetation index tiles.
 * This component does NOT render DOM, it returns a Deck.gl layer configuration.
 */

import React, { useEffect, useState } from 'react';
import { BitmapLayer } from '@deck.gl/layers';
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
 * Creates a Deck.gl TileLayer for vegetation indices.
 * This function returns a layer configuration, not a React component.
 */
export function createVegetationLayer(
  selectedIndex: VegetationIndexType,
  selectedDate: string | null,
  sceneId?: string
): TileLayer | null {
  if (!selectedDate || !sceneId) {
    return null;
  }

  // Build tile URL template
  const tileUrl = `/api/vegetation/tiles/{z}/{x}/{y}.png?scene_id=${sceneId}&index_type=${selectedIndex}`;

  // Create BitmapLayer for each tile
  const renderSubLayers = (props: any) => {
    const { bbox, tile } = props;
    
    return new BitmapLayer(props, {
      data: undefined,
      image: tile.data,
      bounds: bbox,
      opacity: 0.8,
      // Enable transparency
      transparent: true,
      // Color mode for vegetation visualization
      colorMode: 'multiply',
    });
  };

  // Create TileLayer
  return new TileLayer({
    id: 'vegetation-layer',
    data: tileUrl,
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256,
    renderSubLayers,
    // Update strategy for smooth panning
    updateTriggers: {
      getTileData: [selectedIndex, selectedDate, sceneId],
    },
    // Error handling
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
): TileLayer | null {
  const { selectedIndex, selectedDate, selectedSceneId } = useVegetationContext();
  const [layer, setLayer] = useState<TileLayer | null>(null);

  // Use provided sceneId or fallback to context
  const effectiveSceneId = sceneId || selectedSceneId;

  useEffect(() => {
    if (selectedDate && effectiveSceneId) {
      const newLayer = createVegetationLayer(selectedIndex, selectedDate, effectiveSceneId);
      setLayer(newLayer);
    } else {
      setLayer(null);
    }
  }, [selectedIndex, selectedDate, effectiveSceneId]);

  return layer;
}

/**
 * React component wrapper for vegetation layer.
 * This component manages the layer lifecycle and provides it to the parent.
 * 
 * Usage in UnifiedViewer:
 * ```tsx
 * const vegetationLayer = useVegetationLayer(sceneId);
 * <DeckGL layers={[vegetationLayer, ...otherLayers]} />
 * ```
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

  // This component doesn't render anything
  // It just manages the layer state
  return null;
};

/**
 * Standalone function to get layer configuration.
 * Useful for integration with external Deck.gl setups.
 */
export function getVegetationLayerConfig(
  selectedIndex: VegetationIndexType,
  selectedDate: string | null,
  sceneId?: string
): {
  layer: TileLayer | null;
  isReady: boolean;
} {
  const layer = createVegetationLayer(selectedIndex, selectedDate, sceneId);
  
  return {
    layer,
    isReady: layer !== null && selectedDate !== null,
  };
}

export default VegetationLayer;

