import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useVegetationApi } from '../hooks/useVegetationApi';
import { useVegetationScenes } from '../hooks/useVegetationScenes';
import { useAuth } from '../hooks/useAuth'; // Direct Auth Dependency

interface VegetationContextType {
  selectedIndex: string | null;
  selectedDate: string;
  selectedEntityId: string | null;
  selectedSceneId: string | null;
  parcels: any[];
  loading: boolean;
  setSelectedIndex: (index: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedSceneId: (id: string | null) => void;
}

const defaultContext: VegetationContextType = {
  selectedIndex: null,
  selectedDate: '',
  selectedEntityId: null,
  selectedSceneId: null,
  parcels: [],
  loading: false,
  setSelectedIndex: () => {},
  setSelectedDate: () => {},
  setSelectedEntityId: () => {},
  setSelectedSceneId: () => {},
};

const VegetationContext = createContext<VegetationContextType>(defaultContext);

export function VegetationProvider({ children }: { children: React.ReactNode }) {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { token } = useAuth(); // Hard Dependency
  const api = useVegetationApi();

  // Load parcels on mount (or when token arrives)
  useEffect(() => {
    let active = true;
    console.log('[Module:Context] 🔄 Effect Triggered', { 
      hasToken: !!token, 
      tokenLen: token?.length,
      hasListParcels: !!api.listParcels 
    });

    if (!token) {
        console.warn('[Module:Context] ⏳ Waiting for Token...');
        return;
    }

    setLoading(true);
    
    api.listParcels().then(data => {
      if (active) {
        console.log('[Module:Context] 📦 Data Received:', Array.isArray(data) ? `Array(${data.length})` : 'Invalid');
        if (Array.isArray(data)) {
          setParcels(data);
        } else {
          setParcels([]);
        }
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, [api.listParcels, token]); // Add token as direct dependency

  // Handle scene auto-selection Logic
  const { scenes } = useVegetationScenes({ entityId: selectedEntityId || undefined });

  useEffect(() => {
    if (scenes && scenes.length > 0 && !selectedSceneId) {
      // Auto-select the latest scene
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const handleIndexChange = useCallback((index: string) => {
    setSelectedIndex(index);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleEntityChange = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
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

export function useVegetationContext(): VegetationContextType {
  const context = useContext(VegetationContext);
  if (!context) {
    return defaultContext;
  }
  return context;
}
