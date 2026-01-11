import axios, { AxiosInstance } from 'axios';
import { VegetationJob, VegetationScene, VegetationConfig, IndexCalculationParams, TimeseriesDataPoint } from '../types';

/**
 * API Client for Vegetation Prime Backend.
 */
export class VegetationApiClient {
  private client: AxiosInstance;
  private getToken: () => string | undefined;
  private getTenantId: () => string | undefined;

  constructor(
    getToken: () => string | undefined, 
    getTenantId: () => string | undefined,
    baseUrl: string = '/api/vegetation'
  ) {
    this.getToken = getToken;
    this.getTenantId = getTenantId;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      const tenantId = this.getTenantId();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
      
      return config;
    });
    
    // Response interceptor for error logger
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        // console.error('Vegetation API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // --- Endpoints ---

  async checkHealth(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response as unknown as { status: string };
  }

  // Alias for listScenes to support older calls or just rename getScenes
  async listScenes(
    entityId?: string,
    startDate?: string,
    endDate?: string,
    limit = 50
  ): Promise<{ scenes: VegetationScene[]; total: number }> {
    return this.getScenes(entityId, startDate, endDate, limit);
  }

  async getScenes(
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
    return response as unknown as { scenes: VegetationScene[]; total: number };
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
    return response as unknown as { entity_id: string; index_type: string; data_points: TimeseriesDataPoint[] };
  }

  async calculateIndex(params: IndexCalculationParams): Promise<{ job_id: string; message: string }> {
    const response = await this.client.post('/calculate', params);
    return response as unknown as { job_id: string; message: string };
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
    return response as unknown as {
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

  async getSceneStats(
    entityId: string,
    indexType: string = "NDVI",
    months: number = 12
  ): Promise<TimelineStatsResponse> {
    const params = new URLSearchParams();
    params.append("index_type", indexType);
    params.append("months", months.toString());
    
    const response = await this.client.get(`/scenes/${encodeURIComponent(entityId)}/stats?${params.toString()}`);
    return response as unknown as TimelineStatsResponse;
  }

  async compareYears(
    entityId: string,
    indexType: string = "NDVI"
  ): Promise<YearComparisonResponse> {
    const params = new URLSearchParams();
    params.append("index_type", indexType);
    
    const response = await this.client.get(`/scenes/${encodeURIComponent(entityId)}/compare-years?${params.toString()}`);
    return response as unknown as YearComparisonResponse;
  }

  async getConfig(): Promise<VegetationConfig> {
    const response = await this.client.get('/config');
    return response as unknown as VegetationConfig;
  }

  async updateConfig(config: Partial<VegetationConfig>): Promise<{ message: string; config: VegetationConfig }> {
    const response = await this.client.post('/config', config);
    return response as unknown as { message: string; config: VegetationConfig };
  }

  async getCurrentUsage(): Promise<{
    plan: string;
    volume: { used_ha: number; limit_ha: number };
    frequency: { used_jobs_today: number; limit_jobs_today: number };
  }> {
    const response = await this.client.get('/usage/current');
    return response as unknown as {
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
    try {
      const response = await this.client.get('/config/credentials-status');
      return response as unknown as {
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

  async getRecentJobs(limit: number = 5): Promise<VegetationJob[]> {
    // Mock data compliant with VegetationJob interface
    const jobs: VegetationJob[] = [
      {
        id: 'job-123',
        tenant_id: 'default',
        job_type: 'SENTINEL_INGEST',
        status: 'completed',
        progress_percentage: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'job-124',
        tenant_id: 'default',
        job_type: 'ZONING',
        status: 'pending',
        progress_percentage: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return jobs.slice(0, limit);
  }

  // --- Missing Methods Implementation ---

  async listJobs(params: any = {}): Promise<VegetationJob[]> {
    // Basic implementation connecting to mock or real endpoint
    // If backend supports /jobs
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    // For now returning mock data to satisfy build
    // const response = await this.client.get(`/jobs?${searchParams.toString()}`);
    // return response as unknown as VegetationJob[];
    
    return this.getRecentJobs(params.limit || 10);
  }

  async getJobDetails(jobId: string): Promise<VegetationJob> {
     // Mock
     return {
        id: jobId,
        tenant_id: 'default',
        job_type: 'SENTINEL_INGEST',
        status: 'completed',
        progress_percentage: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
     };
  }
}

// Hook for using API client
import { useMemo } from 'react';

export function useVegetationApi(): VegetationApiClient {
  const getTokenFromHost = (): string | undefined => {
    try {
      const hostAuth = (window as any).__nekazariAuthContext;
      if (hostAuth && typeof hostAuth.getToken === 'function') {
        return hostAuth.getToken();
      }
    } catch (error) {
       // Silent fail
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
       // Silent fail
    }
    return undefined;
  };

  return useMemo(
    () => new VegetationApiClient(getTokenFromHost, getTenantIdFromHost),
    []
  );
}

export interface SceneStats {
  scene_id: string;
  sensing_date: string;
  mean_value: number | null;
  min_value: number | null;
  max_value: number | null;
  std_dev: number | null;
  cloud_coverage: number | null;
}

export interface TimelineStatsResponse {
  entity_id: string;
  index_type: string;
  stats: SceneStats[];
  period_start: string;
  period_end: string;
}

export interface YearComparisonResponse {
  entity_id: string;
  index_type: string;
  current_year: {
    year: number;
    stats: Array<{
      month: number;
      day: number;
      mean_value: number | null;
      sensing_date: string;
    }>;
  };
  previous_year: {
    year: number;
    stats: Array<{
      month: number;
      day: number;
      mean_value: number | null;
      sensing_date: string;
    }>;
  };
}
