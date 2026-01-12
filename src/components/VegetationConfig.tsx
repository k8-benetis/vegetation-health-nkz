/**
 * Configuration Page/Panel
 * Handles setting default indices and cloud coverage thresholds.
 * Also monitors usage limits (API calls/Processing units).
 */

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Layers, Info, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useUIKit } from '../hooks/useUIKit';
import { useVegetationApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useVegetationContext } from '../services/vegetationContext';
import { ModeSelector } from './widgets/ModeSelector';
import { CalculationButton } from './widgets/CalculationButton';
import type { VegetationIndexType, VegetationConfig as ConfigType, VegetationJob } from '../types';

interface ConfigProps {
  mode?: 'page' | 'panel';
}

export const VegetationConfig: React.FC<ConfigProps> = ({ mode = 'page' }) => {
  const { Card, Input, Button, Badge } = useUIKit();
  const api = useVegetationApi();
  const { isAuthenticated } = useAuth();
  const { selectedIndex, setSelectedIndex } = useVegetationContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [localConfig, setLocalConfig] = useState<Partial<ConfigType>>({
    default_index_type: 'NDVI',
    cloud_coverage_threshold: 20,
  });
  
  // Recent jobs for quick status check
  const [recentJobs, setRecentJobs] = useState<VegetationJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
      refreshJobs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadConfig = async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
      setLocalConfig(data);
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshJobs = async () => {
    setJobsLoading(true);
    try {
       const jobs = await api.getRecentJobs(3);
       setRecentJobs(jobs);
    } catch (err) {
       console.error('Error refreshing jobs:', err);
    } finally {
       setJobsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Optimistic update
      if (localConfig) {
        // TODO: Backend updateConfig implementation
        // await api.updateConfig(localConfig);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 800));
        setConfig(localConfig as ConfigType);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = (indexType: string) => {
    setSelectedIndex(indexType as VegetationIndexType);
    setLocalConfig((prev: Partial<ConfigType>) => ({ ...prev, default_index_type: indexType as VegetationIndexType }));
  };

  if (loading && !config) {
    return (
      <Card padding="md" className="animate-pulse bg-white/90 backdrop-blur-md rounded-xl">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-slate-200 rounded w-full mb-4"></div>
        <div className="h-10 bg-slate-200 rounded w-full"></div>
      </Card>
    );
  }

  // Adjust styling based on mode
  const headingSize = mode === 'panel' ? 'text-sm' : 'text-lg';
  const cardPadding = mode === 'panel' ? 'sm' : 'lg';
  
  if (!isAuthenticated && !loading) {
     return (
        <Card padding={cardPadding} className="bg-amber-50 border border-amber-200 rounded-xl">
           <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Please log in to configure settings.</p>
           </div>
        </Card>
     );
  }

  return (
    <div className={`space-y-3 ${mode === 'page' ? 'max-w-4xl mx-auto py-8' : ''}`}>
      
      {/* Analysis Settings */}
      {mode === 'panel' ? (
        // Panel Mode: Simple Mode Selector
        <Card padding="sm" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Layers className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-800">Modo de Análisis</h2>
          </div>
          
          <ModeSelector 
            currentIndex={selectedIndex}
            onChange={handleModeChange}
          />

          <div className="mt-4 pt-3 border-t border-slate-100">
             <CalculationButton 
                variant="primary" 
                size="md" 
                className="w-full"
             />
          </div>
          
          <div className="mt-3 flex items-start gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              El modo determina qué índice y mapa de colores se aplica al visor.
            </p>
          </div>
        </Card>
      ) : (
        // Page Mode: Full Settings (Standard)
        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Analysis Defaults
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-base font-medium text-slate-700 mb-2">
                Índice por Defecto
              </label>
              <ModeSelector 
                currentIndex={localConfig.default_index_type || 'NDVI'}
                onChange={(idx) => setLocalConfig({...localConfig, default_index_type: idx as VegetationIndexType})}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">
                Umbral de Cobertura de Nubes (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={localConfig.cloud_coverage_threshold?.toString() || '20'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseFloat(value);
                  setLocalConfig({ ...localConfig, cloud_coverage_threshold: numValue });
                }}
                className="w-full max-w-xs"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Cloud & Processing Settings (Only in Panel if advanced needed, usually Page mode) */}
      {mode === 'panel' && (
        <Card padding="sm" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Filtro de Nubes (%)
              </label>
              <Input
                type="number"
                size="sm"
                min={0}
                max={100}
                value={localConfig.cloud_coverage_threshold?.toString() || '20'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                   const val = e.target.value ? parseFloat(e.target.value) : 20;
                   setLocalConfig({...localConfig, cloud_coverage_threshold: val});
                }}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Actualizar Filtros'}
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Download Jobs */}
      <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
          <h2 className={`${headingSize} font-semibold text-slate-800`}>
             {mode === 'panel' ? 'Descargas Recientes' : 'Recent Download Jobs'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshJobs}
            disabled={jobsLoading}
            className="ml-auto p-1 h-auto"
          >
            {jobsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-2 text-slate-400 text-xs">
            Sin descargas activas
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-2 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-600">
                    {job.id.substring(0, 6)}...
                  </span>
                  <Badge variant={
                    job.status === 'completed' ? 'success' : 
                    job.status === 'failed' ? 'error' : 'warning'
                  } className="text-[10px] px-1.5 py-0">
                    {job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' : 
                        job.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${job.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VegetationConfig;
