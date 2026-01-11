/**
 * TypeScript type definitions for Vegetation Prime module.
 */

export type VegetationIndexType = 'NDVI' | 'EVI' | 'SAVI' | 'GNDVI' | 'NDRE' | 'NDMI' | 'CUSTOM' | 'SAMI' | 'VRA_ZONES';

export type JobType = 'download' | 'process' | 'calculate_index';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface VegetationJob {
  id: string;
  tenant_id: string;
  job_type: JobType;
  status: JobStatus;
  progress_percentage: number;
  progress_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
  error_message?: string;
  entity_id?: string;
  entity_type?: string;
}

export interface VegetationScene {
  id: string;
  scene_id: string;
  sensing_date: string;
  cloud_coverage?: number;
  storage_path?: string;
  bands?: Record<string, string>;
  platform?: string;
  product_type?: string;
}

export interface VegetationIndex {
  id: string;
  scene_id: string;
  index_type: VegetationIndexType;
  mean_value: number;
  min_value: number;
  max_value: number;
  std_dev: number;
  pixel_count: number;
  calculated_at: string;
  result_raster_path?: string;
  result_tiles_path?: string;
}

export interface TimeseriesDataPoint {
  date: string;
  value: number;
  min?: number;
  max?: number;
  std?: number;
}

export interface VegetationConfig {
  tenant_id: string;
  default_index_type: VegetationIndexType;
  cloud_coverage_threshold: number;
  auto_process: boolean;
  storage_type: 's3' | 'minio' | 'local';
  storage_bucket?: string;
  copernicus_client_id?: string;
  copernicus_client_secret?: string;
}

export interface Bounds {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface JobCreateParams {
  job_type: JobType;
  entity_id?: string;
  entity_type?: string;
  bounds?: Bounds;
  start_date?: string;
  end_date?: string;
  parameters?: Record<string, any>;
}

export interface IndexCalculationParams {
  scene_id?: string;
  index_type: VegetationIndexType;
  formula?: string;
  entity_id?: string;
  // Temporal composite options
  start_date?: string;
  end_date?: string;
}

// Slot component props
export interface VegetationLayerControlProps {
  selectedIndex?: VegetationIndexType;
  selectedDate?: string;
  onIndexChange?: (index: VegetationIndexType) => void;
  onDateChange?: (date: string) => void;
}

export interface TimelineWidgetProps {
  entityId?: string;
  indexType?: VegetationIndexType;
  onDateSelect?: (date: string) => void;
}

