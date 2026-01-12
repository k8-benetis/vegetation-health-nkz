/**
 * Global state context for Vegetation Prime module.
 * Context is OPTIONAL - returns default values when no provider present.
 * This allows slots to work independently without requiring a shared provider.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { VegetationIndexType } from '../types';
import { useVegetationApi } from '../hooks/useVegetationApi';
import { useCropRecommendation } from '../hooks/useCropRecommendation';
import { useVegetationScenes } from '../hooks/useVegetationScenes';

interface VegetationContextType {
  selectedIndex: VegetationIndexType;
  selectedDate: string | null;
  selectedEntityId: string | null;
  selectedSceneId: string | null;
  parcels: any[];
  loading: boolean;
  setSelectedIndex: (index: VegetationIndexType) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedEntityId: (entityId: string | null) => void;
  setSelectedSceneId: (sceneId: string | null) => void;
}

// Default context values for standalone usage
const defaultContext: VegetationContextType = {
  selectedIndex: 'NDVI',
  selectedDate: null,
  selectedEntityId: null,
  selectedSceneId: null,
  parcels: [],
  loading: false,
  setSelectedIndex: () => {},
  setSelectedDate: () => {},
  setSelectedEntityId: () => {},
  setSelectedSceneId: () => {},
};

// Export context object for consumers that might import it directly (handling TS2724)
export const VegetationContext = createContext<VegetationContextType | undefined>(undefined);

export function VegetationProvider({ children }: { children: ReactNode }) {
  const [selectedIndex, setSelectedIndex] = useState<VegetationIndexType>('NDVI');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const api = useVegetationApi();
  const { scenes } = useVegetationScenes(selectedEntityId, undefined, undefined);

  // Load Parcels on mount
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listParcels().then(data => {
      if (active) {
        setParcels(data || []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [api]); // api is stable (useCallback)

  // Auto-select latest scene when scenes load and none selected
  useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      console.log('[VegetationContext] Auto-selecting latest scene:', scenes[0].id);
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  // Auto-detect crop type
  const { recommendation } = useCropRecommendation(
    parcels.find(p => p.id === selectedEntityId)?.cropSpecies?.value
  );

  useEffect(() => {
    if (recommendation?.default_index) {
      setSelectedIndex(recommendation.default_index as VegetationIndexType);
    }
  }, [recommendation]);

  const handleIndexChange = useCallback((index: VegetationIndexType) => {
    setSelectedIndex(index);
  }, []);

  const handleDateChange = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, []);

  const handleEntityChange = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
    // Reset scene when entity changes to force re-selection logic
    setSelectedSceneId(null); 
  }, []);

  const handleSceneChange = useCallback((sceneId: string | null) => {
    setSelectedSceneId(sceneId);
  }, []);

  return (
    <VegetationContext.Provider
      value={{
        selectedIndex,
        selectedDate,
        selectedEntityId,
        selectedSceneId,
        parcels,
        loading,
        setSelectedIndex: handleIndexChange,
        setSelectedDate: handleDateChange,
        setSelectedEntityId: handleEntityChange,
        setSelectedSceneId: handleSceneChange,
      }}
    >
      {children}
    </VegetationContext.Provider>
  );
}

/**
 * Hook to access vegetation context.
 */
export function useVegetationContext(): VegetationContextType {
  const context = useContext(VegetationContext);
  if (!context) {
    // console.warn('[VegetationContext] No provider found, using default values');
    return defaultContext;
  }
  return context;
}
