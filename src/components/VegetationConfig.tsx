/**
 * VegetationConfig Component - Refactored from ConfigPage
 * Mobile-first design for panel (300-400px) and full-page modes
 */

import React, { useState } from 'react';
import { 
  Key, 
  Database, 
  Cloud, 
  Save, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { useViewer } from '@nekazari/sdk';
import { useUIKit } from '../hooks/useUIKit';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useVegetationConfig } from '../hooks/useVegetationConfig';
import type { VegetationIndexType } from '../types';

export interface VegetationConfigProps {
  parcelId?: string | null; // Parcela seleccionada (opcional, se obtiene de useViewer si no se proporciona)
  mode?: 'panel' | 'full-page'; // Adapta layout según contexto
  onJobCreated?: (jobId: string) => void;
  className?: string;
}

export const VegetationConfig: React.FC<VegetationConfigProps> = ({
  parcelId: propParcelId,
  mode = 'panel',
  onJobCreated,
  className
}) => {
  // Get parcelId from useViewer if not provided as prop
  const { selectedEntityId, selectedEntityType } = useViewer();
  const parcelId = propParcelId ?? (selectedEntityType === 'AgriParcel' ? selectedEntityId : null);
  const { Card, Button } = useUIKit();
  const {
    config,
    loading,
    saving,
    error,
    success,
    credentialsStatus,
    credentialsLoading,
    usage,
    recentJobs,
    jobsLoading,
    saveConfig,
    refreshCredentials,
    refreshUsage,
    refreshJobs,
  } = useVegetationConfig();

  const [localConfig, setLocalConfig] = useState<Partial<typeof config>>({});

  // Initialize local config when config loads
  React.useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      setLocalConfig(config);
    }
  }, [config]);

  // Layout adaptativo según mode
  const containerClass = mode === 'panel' 
    ? 'space-y-3' // Compacto para panel
    : 'space-y-6'; // Generoso para página completa
  
  const cardPadding = mode === 'panel' ? 'md' : 'lg';
  const textSize = mode === 'panel' ? 'text-sm' : 'text-base';
  const headingSize = mode === 'panel' ? 'text-lg' : 'text-xl';

  const handleSave = async () => {
    // Only send fields that have values
    const configToSave: Partial<typeof config> = {};
    if (localConfig.default_index_type) configToSave.default_index_type = localConfig.default_index_type as VegetationIndexType;
    if (localConfig.cloud_coverage_threshold !== undefined) configToSave.cloud_coverage_threshold = localConfig.cloud_coverage_threshold;
    if (localConfig.auto_process !== undefined) configToSave.auto_process = localConfig.auto_process;
    if (localConfig.storage_type) configToSave.storage_type = localConfig.storage_type;
    if (localConfig.copernicus_client_id) configToSave.copernicus_client_id = localConfig.copernicus_client_id;
    if (localConfig.copernicus_client_secret) configToSave.copernicus_client_secret = localConfig.copernicus_client_secret;

    await saveConfig(configToSave);
  };

  if (loading) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className={textSize}>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} ${className || ''}`}>
      {/* Success/Error Messages */}
      {success && (
        <div className={`p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 ${textSize}`}>
          Configuración guardada exitosamente
        </div>
      )}
      {error && (
        <div className={`p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 ${textSize}`}>
          {error}
        </div>
      )}

      {/* Copernicus Credentials Status - Compact Card */}
      <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Key className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
          <h2 className={`${headingSize} font-semibold text-slate-800`}>
            {mode === 'panel' ? 'Copernicus' : 'Copernicus Data Space'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshCredentials}
            disabled={credentialsLoading}
            className="ml-auto"
          >
            {credentialsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
          </Button>
        </div>

        {credentialsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className={textSize}>Verificando...</p>
          </div>
        ) : credentialsStatus ? (
          <div className={`p-3 rounded-lg border ${
            credentialsStatus.available
              ? credentialsStatus.source === 'platform'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {credentialsStatus.available ? (
                credentialsStatus.source === 'platform' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                )
              ) : (
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium mb-1 ${textSize} ${
                  credentialsStatus.available
                    ? credentialsStatus.source === 'platform'
                      ? 'text-green-900'
                      : 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  {credentialsStatus.available
                    ? credentialsStatus.source === 'platform'
                      ? 'Disponibles (Plataforma)'
                      : 'Disponibles (Módulo)'
                    : 'No Disponibles'
                  }
                </p>
                <p className={`text-xs ${
                  credentialsStatus.available
                    ? credentialsStatus.source === 'platform'
                      ? 'text-green-800'
                      : 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {credentialsStatus.message}
                </p>
                {credentialsStatus.available && credentialsStatus.client_id_preview && (
                  <p className={`text-xs mt-1 font-mono ${
                    credentialsStatus.source === 'platform'
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}>
                    ID: {credentialsStatus.client_id_preview}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`${textSize} text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200`}>
            <p>No se pudo verificar el estado de las credenciales.</p>
          </div>
        )}
      </Card>

      {/* Usage & Limits - Compact Progress Bars */}
      {usage && (
        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
            <h2 className={`${headingSize} font-semibold text-slate-800`}>Uso y Límites</h2>
            <span className={`ml-auto px-2 py-0.5 ${textSize} font-semibold rounded-full ${
              usage?.plan === 'ADMIN' 
                ? 'bg-purple-100 text-purple-800'
                : usage?.plan === 'NO_CONFIGURADO'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {usage?.plan === 'ADMIN' 
                ? 'Admin'
                : usage?.plan === 'NO_CONFIGURADO'
                ? 'Sin Config'
                : usage?.plan || 'Unknown'}
            </span>
          </div>

          <div className="space-y-3">
            {/* Volume Usage */}
            {usage.volume ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`${textSize} font-medium text-slate-700`}>Hectáreas Mensuales</span>
                  <span className={`${textSize} text-slate-600`}>
                    {usage.volume.used_ha.toFixed(1)} / {
                      usage.volume.limit_ha >= 999999 
                        ? '∞' 
                        : usage.volume.limit_ha.toFixed(1)
                    } Ha
                  </span>
                </div>
                {usage.volume.limit_ha < 999999 ? (
                  <>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (usage.volume.used_ha / usage.volume.limit_ha) >= 0.9
                            ? 'bg-red-500'
                            : (usage.volume.used_ha / usage.volume.limit_ha) >= 0.75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((usage.volume.used_ha / usage.volume.limit_ha) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {((usage.volume.limit_ha - usage.volume.used_ha) / usage.volume.limit_ha * 100).toFixed(1)}% restante
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Acceso ilimitado (Admin)</p>
                )}
              </div>
            ) : (
              <div className={`${textSize} text-yellow-600`}>
                <p className="font-medium mb-1">Datos de uso no disponibles</p>
                <p className="text-xs text-slate-500">
                  {usage?.plan === 'NO_CONFIGURADO' 
                    ? 'El plan no está configurado. Contacte al administrador.'
                    : 'Los límites no se han sincronizado desde la plataforma.'}
                </p>
              </div>
            )}

            {/* Frequency Usage */}
            {usage.frequency && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`${textSize} font-medium text-slate-700`}>Trabajos Diarios</span>
                  <span className={`${textSize} text-slate-600`}>
                    {usage.frequency.used_jobs_today} / {usage.frequency.limit_jobs_today}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (usage.frequency.used_jobs_today / usage.frequency.limit_jobs_today) >= 0.9
                        ? 'bg-red-500'
                        : (usage.frequency.used_jobs_today / usage.frequency.limit_jobs_today) >= 0.75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((usage.frequency.used_jobs_today / usage.frequency.limit_jobs_today) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.max(0, usage.frequency.limit_jobs_today - usage.frequency.used_jobs_today)} restantes hoy
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Processing Settings */}
      <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Database className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
          <h2 className={`${headingSize} font-semibold text-slate-800`}>
            {mode === 'panel' ? 'Procesamiento' : 'Processing Settings'}
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className={`block ${textSize} font-medium text-slate-700 mb-1`}>
              Tipo de Índice por Defecto
            </label>
            <Select
              value={localConfig.default_index_type || 'NDVI'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                setLocalConfig({ ...localConfig, default_index_type: e.target.value as VegetationIndexType })
              }
              options={[
                { value: 'NDVI', label: 'NDVI' },
                { value: 'EVI', label: 'EVI' },
                { value: 'SAVI', label: 'SAVI' },
                { value: 'GNDVI', label: 'GNDVI' },
                { value: 'NDRE', label: 'NDRE' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className={`block ${textSize} font-medium text-slate-700 mb-1`}>
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
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Escenas con nubes por encima de este umbral serán excluidas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_process"
              checked={localConfig.auto_process ?? true}
              onChange={(e) => setLocalConfig({ ...localConfig, auto_process: e.target.checked })}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="auto_process" className={`${textSize} font-medium text-slate-700`}>
              Procesar automáticamente escenas descargadas
            </label>
          </div>
        </div>
      </Card>

      {/* Storage Settings */}
      <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
          <h2 className={`${headingSize} font-semibold text-slate-800`}>
            {mode === 'panel' ? 'Almacenamiento' : 'Storage Settings'}
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className={`block ${textSize} font-medium text-slate-700 mb-1`}>
              Tipo de Almacenamiento
            </label>
            <Select
              value={localConfig.storage_type || 's3'}
              onChange={(e) => setLocalConfig({ ...localConfig, storage_type: e.target.value as 's3' | 'minio' | 'local' })}
              options={[
                { value: 's3', label: 'AWS S3' },
                { value: 'minio', label: 'MinIO' },
                { value: 'local', label: 'Local Filesystem' },
              ]}
              className="w-full"
            />
          </div>

          <div className={`${textSize} text-slate-500 bg-slate-50 p-3 rounded border border-slate-200`}>
            <p className="font-medium mb-1 text-slate-700">Storage Bucket</p>
            <p className="text-xs">
              El bucket se genera automáticamente basado en su tenant para garantizar seguridad y aislamiento de datos.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size={mode === 'panel' ? 'md' : 'lg'}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      {/* Recent Download Jobs - Compact List */}
      <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`${mode === 'panel' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600`} />
          <h2 className={`${headingSize} font-semibold text-slate-800`}>
            {mode === 'panel' ? 'Trabajos Recientes' : 'Recent Download Jobs'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshJobs}
            disabled={jobsLoading}
            className="ml-auto"
          >
            {jobsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar'}
          </Button>
        </div>

        {jobsLoading && recentJobs.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            <p className={textSize}>Cargando trabajos...</p>
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            <p className={textSize}>No hay trabajos de descarga aún.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`${textSize} font-mono text-slate-700`}>
                    {job.id.substring(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {job.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {job.status === 'running' && (
                      <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                    )}
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : job.status === 'running'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        job.status === 'completed'
                          ? 'bg-green-600'
                          : job.status === 'failed'
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }`}
                      style={{ width: `${job.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{job.progress_percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(job.created_at).toLocaleString()}
                </p>
                {job.progress_message || job.error_message ? (
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {job.progress_message || job.error_message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

