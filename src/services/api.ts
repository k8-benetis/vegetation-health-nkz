/**
 * API client for Vegetation Prime backend.
 */

import { useMemo } from 'react';
import { NKZClient } from '@nekazari/sdk';
import type {
  VegetationJob,
  VegetationConfig,
  JobCreateParams,
  IndexCalculationParams,
  TimeseriesDataPoint,
  VegetationScene,
} from '../types';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL?: string;
    };
  }
}

export class VegetationApiClient {
  private client: NKZClient;

  constructor(getToken: () => string | undefined, getTenantId: () => string | undefined) {
    const baseUrl = (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) 
      ? `${window.__ENV__.VITE_API_URL}/api/vegetation`
      : '/api/vegetation';
    console.log('[VegetationApiClient] Initializing with baseUrl:', baseUrl);
    this.client = new NKZClient({
      baseUrl: baseUrl,
      getToken: getToken,
      getTenantId: getTenantId,
    });
  }

  async createJob(params: JobCreateParams): Promise<VegetationJob> {
    const response = await this.client.post('/jobs', params);
    return response as VegetationJob;
  }

  async getJob(jobId: string): Promise<VegetationJob> {
    const response = await this.client.get(`/jobs/${jobId}`);
    return response as VegetationJob;
  }

  async getJobDetails(jobId: string): Promise<{
    job: VegetationJob;
    index_stats?: {
      mean: number;
      min: number;
      max: number;
      std_dev: number;
      pixel_count: number;
    };
    timeseries?: Array<{
      date: string;
      index_type: string;
      mean_value: number;
      min_value: number;
      max_value: number;
      std_dev: number;
    }>;
    scene_info?: {
      id: string;
      sensing_date: string;
      cloud_coverage: number;
      scene_id: string;
    };
  }> {
    const response = await this.client.get(`/jobs/${jobId}/details`);
    return response as {
      job: VegetationJob;
      index_stats?: {
        mean: number;
        min: number;
        max: number;
        std_dev: number;
        pixel_count: number;
      };
      timeseries?: Array<{
        date: string;
        index_type: string;
        mean_value: number;
        min_value: number;
        max_value: number;
        std_dev: number;
      }>;
      scene_info?: {
        id: string;
        sensing_date: string;
        cloud_coverage: number;
        scene_id: string;
      };
    };
  }

  async listJobs(status?: string, limit = 50, offset = 0): Promise<{ jobs: VegetationJob[]; total: number }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await this.client.get(`/jobs?${params.toString()}`);
    return response as { jobs: VegetationJob[]; total: number };
  }

  async listScenes(
    entityId?: string | null,
    startDate?: string,
    endDate?: string,
    limit = 50
  ): Promise<{ scenes: VegetationScene[]; total: number }> {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit.toString());
    
    const response = await this.client.get(`/scenes?${params.toString()}`);
    return response as { scenes: VegetationScene[]; total: number };
  }

  async getIndices(
    entityId?: string,
    sceneId?: string,
    indexType?: string,
    format: 'geojson' | 'xyz' = 'geojson'
  ): Promise<any> {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    if (sceneId) params.append('scene_id', sceneId);
    if (indexType) params.append('index_type', indexType);
    params.append('format', format);
    
    const response = await this.client.get(`/indices?${params.toString()}`);
    return response;
  }

  async getTimeseries(
    entityId: string,
    indexType: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ entity_id: string; index_type: string; data_points: TimeseriesDataPoint[] }> {
    const params = new URLSearchParams();
    params.append('entity_id', entityId);
    params.append('index_type', indexType);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.client.get(`/timeseries?${params.toString()}`);
    return response as { entity_id: string; index_type: string; data_points: TimeseriesDataPoint[] };
  }

  async calculateIndex(params: IndexCalculationParams): Promise<{ job_id: string; message: string }> {
    const response = await this.client.post('/calculate', params);
    return response as { job_id: string; message: string };
  }

  async getJobHistogram(
    jobId: string,
    bins: number = 50
  ): Promise<{
    bins: number[];
    counts: number[];
    statistics: {
      mean: number;
      min: number;
      max: number;
      std_dev: number;
      pixel_count: number;
    };
    approximation: boolean;
    note?: string;
  }> {
    const response = await this.client.get(`/jobs/${jobId}/histogram?bins=${bins}`);
    return response as {
      bins: number[];
      counts: number[];
      statistics: {
        mean: number;
        min: number;
        max: number;
        std_dev: number;
        pixel_count: number;
      };
      approximation: boolean;
      note?: string;
    };
  }

  async getConfig(): Promise<VegetationConfig> {
    const response = await this.client.get('/config');
    return response as VegetationConfig;
  }

  async updateConfig(config: Partial<VegetationConfig>): Promise<{ message: string; config: VegetationConfig }> {
    const response = await this.client.post('/config', config);
    return response as { message: string; config: VegetationConfig };
  }

  async getCurrentUsage(): Promise<{
    plan: string;
    volume: { used_ha: number; limit_ha: number };
    frequency: { used_jobs_today: number; limit_jobs_today: number };
  }> {
    const response = await this.client.get('/usage/current');
    return response as {
      plan: string;
      volume: { used_ha: number; limit_ha: number };
      frequency: { used_jobs_today: number; limit_jobs_today: number };
    };
  }

  async getCredentialsStatus(): Promise<{
    available: boolean;
    source: 'platform' | 'module' | null;
    message: string;
    client_id_preview?: string;
  }> {
    console.log('[VegetationApiClient] Calling getCredentialsStatus...');
    try {
      const response = await this.client.get('/config/credentials-status');
      console.log('[VegetationApiClient] getCredentialsStatus response:', response);
      return response as {
        available: boolean;
        source: 'platform' | 'module' | null;
        message: string;
        client_id_preview?: string;
      };
    } catch (error) {
      console.error('[VegetationApiClient] Error in getCredentialsStatus:', error);
      throw error;
    }
  }
}

// Hook for using API client
export function useVegetationApi(): VegetationApiClient {
  // Access host auth context directly from window (more reliable than SDK's useAuth in remote modules)
  // The host exposes KeycloakAuthContextType with getToken() function and tenantId property
  const getTokenFromHost = (): string | undefined => {
    try {
      const hostAuth = (window as any).__nekazariAuthContext;
      if (hostAuth && typeof hostAuth.getToken === 'function') {
        const token = hostAuth.getToken();
        return token;
      }
    } catch (error) {
      console.warn('[useVegetationApi] Error accessing host auth:', error);
    }
    return undefined;
  };

  const getTenantIdFromHost = (): string | undefined => {
    try {
      const hostAuth = (window as any).__nekazariAuthContext;
      if (hostAuth && hostAuth.tenantId) {
        return hostAuth.tenantId;
      }
    } catch (error) {
      console.warn('[useVegetationApi] Error accessing host tenantId:', error);
    }
    return undefined;
  };

  // Check if host auth is available
  const hostAuth = (window as any).__nekazariAuthContext;
  if (!hostAuth) {
    console.warn('[useVegetationApi] Host auth context not available in window.__nekazariAuthContext');
  } else {
    const token = getTokenFromHost();
    const tenantId = getTenantIdFromHost();
    console.log('[useVegetationApi] Host auth available - token:', token ? `${token.substring(0, 20)}...` : 'undefined', 'tenantId:', tenantId);
  }
  
  // CRITICAL: Memoize the client to prevent infinite re-renders
  // Without useMemo, a new client instance is created on every render
  return useMemo(
    () => new VegetationApiClient(getTokenFromHost, getTenantIdFromHost),
    []
  );
}
