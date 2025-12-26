/**
 * Global state context for Vegetation Prime module.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
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

export function useVegetationContext(): VegetationContextType {
  const context = useContext(VegetationContext);
  if (!context) {
    throw new Error('useVegetationContext must be used within VegetationProvider');
  }
  return context;
}

