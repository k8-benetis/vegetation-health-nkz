/**
 * Global state context for Vegetation Prime module.
 * Context is OPTIONAL - returns default values when no provider present.
 * This allows slots to work independently without requiring a shared provider.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { VegetationIndexType } from '../types';

interface VegetationContextType {
  selectedIndex: VegetationIndexType;
  selectedDate: string | null;
  selectedEntityId: string | null;
  selectedSceneId: string | null;
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
  setSelectedIndex: () => {},
  setSelectedDate: () => {},
  setSelectedEntityId: () => {},
  setSelectedSceneId: () => {},
};

const VegetationContext = createContext<VegetationContextType | undefined>(undefined);

export function VegetationProvider({ children }: { children: ReactNode }) {
  const [selectedIndex, setSelectedIndex] = useState<VegetationIndexType>('NDVI');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const handleIndexChange = useCallback((index: VegetationIndexType) => {
    setSelectedIndex(index);
  }, []);

  const handleDateChange = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, []);

  const handleEntityChange = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
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
 * Returns default values if no provider is present (allows standalone slot usage).
 */
export function useVegetationContext(): VegetationContextType {
  const context = useContext(VegetationContext);
  // Return default context if not in provider - allows standalone slot usage
  if (!context) {
    console.warn('[VegetationContext] No provider found, using default values');
    return defaultContext;
  }
  return context;
}
