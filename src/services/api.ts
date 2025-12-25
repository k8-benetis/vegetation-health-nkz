/**
 * API client for Vegetation Prime backend.
 */

import { NKZClient } from '@nekazari/sdk';
import { useAuth } from '@nekazari/sdk';
import type {
  VegetationJob,
  VegetationIndex,
  VegetationConfig,
  JobCreateParams,
  IndexCalculationParams,
  TimeseriesDataPoint,
  VegetationScene,
} from '../types';

const API_BASE_URL = '/api/vegetation';

export class VegetationApiClient {
  private client: NKZClient;

  constructor(getToken: () => string | undefined, getTenantId: () => string | undefined) {
    this.client = new NKZClient({
      baseUrl: API_BASE_URL,
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

  async listJobs(status?: string, limit = 50, offset = 0): Promise<{ jobs: VegetationJob[]; total: number }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await this.client.get(`/jobs?${params.toString()}`);
    return response as { jobs: VegetationJob[]; total: number };
  }

  async listScenes(
    entityId?: string,
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
}

// Hook for using API client
export function useVegetationApi(): VegetationApiClient {
  const { getToken, tenantId } = useAuth();
  
  return new VegetationApiClient(
    () => getToken(),
    () => tenantId
  );
}
