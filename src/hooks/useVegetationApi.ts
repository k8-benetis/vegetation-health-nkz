/**
 * useVegetationApi Hook
 * Centralized API client for Vegetation Prime module.
 * Wraps authenticated fetch calls.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

interface CarbonConfig {
  strawRemoved: boolean;
  soilType: 'clay' | 'loam' | 'sandy' | 'organic';
  tillageType?: 'conventional' | 'reduced' | 'no-till';
}

interface EntityDetails {
  id: string;
  type: string;
  cropSpecies?: {
    value: string;
    type: string;
  };
  [key: string]: any;
}

export function useVegetationApi() {
  const { token } = useAuth();

  const getCarbonConfig = useCallback(async (entityId: string): Promise<CarbonConfig | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/vegetation/carbon/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch carbon config');
      return await res.json();
    } catch (e) {
      console.warn('Error fetching carbon config:', e);
      return null;
    }
  }, [token]);

  const saveCarbonConfig = useCallback(async (entityId: string, config: CarbonConfig): Promise<void> => {
    if (!token) return;
    await fetch(`/api/vegetation/carbon/${entityId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
  }, [token]);

  const getEntityDetails = useCallback(async (entityId: string): Promise<EntityDetails | null> => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/vegetation/entities/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error fetching entity details:', e);
      return null;
    }
  }, [token]);

  const listParcels = useCallback(async (): Promise<EntityDetails[]> => {
    if (!token) {
        return [];
    }
    try {
      const url = `/api/entities?type=AgriParcel&limit=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error('[API] Failed to list parcels:', res.statusText);
        return [];
      }
      
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("[API] Error listing parcels:", e);
      return [];
    }
  }, [token]);

  /* --- NEW METHODS FOR WIRING (v1.11/v1.12) --- */

  const getSceneStats = useCallback(async (entityId: string, indexType: string = 'NDVI', months: number = 12) => {
    if (!token) return { stats: [] };
    try {
      // Endpoint: /api/scenes/{entity_id}/stats?index_type=NDVI&months=12
      const url = `/api/scenes/${encodeURIComponent(entityId)}/stats?index_type=${indexType}&months=${months}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch (e) {
      console.warn('[API] Error fetching stats:', e);
      return { stats: [] };
    }
  }, [token]);

  const calculateIndex = useCallback(async (entityId: string, indexType: string, sceneId?: string, _geometry?: any) => {
    if (!token) throw new Error("No token");
    // _geometry is ignored (unused but kept for signature compatibility)
    // Formula derivation from indexType (simple map)
    const formulas: Record<string, string> = {
        'NDVI': '(B08-B04)/(B08+B04)',
        'EVI': '2.5*((B08-B04)/(B08+6*B04-7.5*B02+1))',
        'NDMI': '(B08-B11)/(B08+B11)',
        'SAVI': '((B08-B04)/(B08+B04+0.5))*(1.5)'
    };
    const formula = formulas[indexType] || formulas['NDVI'];

    const res = await fetch('/api/vegetation/calculate/preview', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            formula,
            scene_id: sceneId,
            entity_id: entityId,
            bbox: null 
        })
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Calculation failed');
    }
    return await res.json();
  }, [token]);

  const getPrediction = useCallback(async (entityId: string) => {
     if (!token) return null;
     try {
         const res = await fetch(`/api/vegetation/prediction/${entityId}`, {
             headers: { Authorization: `Bearer ${token}` }
         });
         if (!res.ok) return null;
         return await res.json();
     } catch (e) {
         return null;
     }
  }, [token]);

  // Memoize the API object to prevent infinite loops in consumers
  const api = useMemo(() => ({
    getCarbonConfig,
    saveCarbonConfig,
    getEntityDetails,
    listParcels,
    getSceneStats,
    calculateIndex,
    getPrediction
  }), [getCarbonConfig, saveCarbonConfig, getEntityDetails, listParcels, getSceneStats, calculateIndex, getPrediction]);

  return api;
}
