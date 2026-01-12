/**
 * useVegetationApi Hook
 * Centralized API client for Vegetation Prime module.
 * Wraps authenticated fetch calls for Carbon Config and Entity details.
 */

import { useCallback } from 'react';
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
      // Logic would be: GET /api/vegetation/carbon/{entityId}
      // For now mocking or assuming endpoint exists
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
    listParcels,
    if (!token) return null;
    try {
      // Assuming generic NGSI-LD proxy or dedicated endpoint
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
    if (!token) return [];
    try {
      const res = await fetch(`/api/entities?type=AgriParcel&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error("Error listing parcels:", e);
      return [];
    }
  }, [token]);

  return {
    getCarbonConfig,
    saveCarbonConfig,
    getEntityDetails
    listParcels,
  };
}
