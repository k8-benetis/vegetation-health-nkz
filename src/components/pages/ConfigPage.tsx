/**
 * Configuration Page - Manage module settings and credentials.
 */

import React, { useState, useEffect } from 'react';
import { Settings, Key, Database, Cloud, Save, Clock, CheckCircle, XCircle, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useUIKit } from '../../hooks/useUIKit';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useVegetationApi } from '../../services/api';
import type { VegetationConfig, VegetationIndexType, VegetationJob } from '../../types';

export const ConfigPage: React.FC = () => {
  console.log('[ConfigPage] Component rendering...');
  
  // Get UI components safely from Host
  const { Card, Button } = useUIKit();
  const api = useVegetationApi();
  const [config, setConfig] = useState<Partial<VegetationConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recentJobs, setRecentJobs] = useState<VegetationJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [usage, setUsage] = useState<{
    plan: string;
    volume?: { used_ha: number; limit_ha: number };
    frequency?: { used_jobs_today: number; limit_jobs_today: number };
  } | null>(null);
  const [credentialsStatus, setCredentialsStatus] = useState<{
    available: boolean;
    source: 'platform' | 'module' | null;
    message: string;
    client_id_preview?: string;
  } | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  useEffect(() => {
    console.log('[ConfigPage] useEffect triggered - loading data...');
    loadConfig();
    loadRecentJobs();
    loadUsage();
    loadCredentialsStatus();
  }, []);

  const loadCredentialsStatus = async () => {
    try {
      setCredentialsLoading(true);
      console.log('[ConfigPage] Loading credentials status...');
      const status = await api.getCredentialsStatus();
      console.log('[ConfigPage] Credentials status received:', status);
      setCredentialsStatus(status);
    } catch (err) {
      console.error('[ConfigPage] Error loading credentials status:', err);
      setCredentialsStatus({
        available: false,
        source: null,
        message: 'Error al verificar el estado de las credenciales'
      });
    } finally {
      setCredentialsLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await api.getCurrentUsage();
      setUsage(data);
    } catch (err) {
      console.error('Error loading usage:', err);
    }
  };

  const loadRecentJobs = async () => {
    try {
      setJobsLoading(true);
      const data = await api.listJobs(undefined, 5, 0);
      setRecentJobs(data?.jobs?.filter(j => j.job_type === 'download') || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setRecentJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Only send fields that have values to avoid sending empty strings
      const configToSave: Partial<VegetationConfig> = {};
      if (config.default_index_type) configToSave.default_index_type = config.default_index_type;
      if (config.cloud_coverage_threshold !== undefined) configToSave.cloud_coverage_threshold = config.cloud_coverage_threshold;
      if (config.auto_process !== undefined) configToSave.auto_process = config.auto_process;
      if (config.storage_type) configToSave.storage_type = config.storage_type;
      // Note: Copernicus credentials are managed by platform, but can be set as fallback
      if (config.copernicus_client_id) configToSave.copernicus_client_id = config.copernicus_client_id;
      if (config.copernicus_client_secret) configToSave.copernicus_client_secret = config.copernicus_client_secret;

      await api.updateConfig(configToSave);
      setSuccess(true);
      
      // Reload config and jobs to show updated status
      await loadConfig();
      loadRecentJobs();
      loadCredentialsStatus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving config:', err);
      // Better error message handling
      if (err?.response?.status === 405) {
        setError('Método no permitido. Por favor, verifique la configuración del servidor.');
      } else if (err?.response?.status === 401) {
        setError('No autorizado. Por favor, inicie sesión nuevamente.');
      } else if (err?.response?.status === 400) {
        setError(err?.response?.data?.detail || 'Datos inválidos. Por favor, verifique los valores ingresados.');
      } else {
        setError(err?.message || err?.toString() || 'Error al guardar la configuración. Por favor, intente nuevamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Vegetation Prime Configuration</h1>
          </div>
          <p className="text-gray-600">Manage module settings and API credentials</p>
        </div>

        {/* Usage Limits (Progress Bars) */}
        {usage && (
          <Card padding="lg" className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Usage & Limits</h2>
              <span className={`ml-auto px-3 py-1 text-sm font-semibold rounded-full ${
                usage?.plan === 'ADMIN' 
                  ? 'bg-purple-100 text-purple-800'
                  : usage?.plan === 'NO_CONFIGURADO'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {usage?.plan === 'ADMIN' 
                  ? 'Admin Plan'
                  : usage?.plan === 'NO_CONFIGURADO'
                  ? 'Plan No Configurado'
                  : usage?.plan || 'Unknown Plan'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Volume Usage */}
              <div>
                {usage.volume ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly Hectares</span>
                    <span className="text-sm text-gray-600">
                      {usage.volume.used_ha.toFixed(2)} / {
                        usage.volume.limit_ha >= 999999 
                          ? '∞' 
                          : usage.volume.limit_ha.toFixed(2)
                      } Ha
                    </span>
                  </div>
                  {usage.volume.limit_ha < 999999 ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
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
                      <p className="text-xs text-gray-500 mt-1">
                        {((usage.volume.limit_ha - usage.volume.used_ha) / usage.volume.limit_ha * 100).toFixed(1)}% remaining this month
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Acceso ilimitado (Admin)
                    </p>
                  )}
                </>
              ) : (
                <div className="text-sm">
                  <p className="text-yellow-600 font-medium mb-1">Datos de uso no disponibles</p>
                  <p className="text-gray-500 text-xs">
                    {usage?.plan === 'NO_CONFIGURADO' 
                      ? 'El plan no está configurado. Se están usando límites por defecto. Contacte al administrador para configurar los límites.'
                      : 'Los límites no se han sincronizado desde la plataforma. Contacte al administrador.'}
                  </p>
                </div>
              )}
              </div>

              {/* Frequency Usage */}
              <div>
                {usage.frequency ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Daily Jobs</span>
                      <span className="text-sm text-gray-600">
                        {usage.frequency.used_jobs_today} / {usage.frequency.limit_jobs_today} jobs
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
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
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.max(0, usage.frequency.limit_jobs_today - usage.frequency.used_jobs_today)} jobs remaining today
                    </p>
                  </>
                ) : (
                  <div className="text-sm">
                    <p className="text-yellow-600 font-medium mb-1">Datos de frecuencia no disponibles</p>
                    <p className="text-gray-500 text-xs">
                      {usage?.plan === 'NO_CONFIGURADO' 
                        ? 'El plan no está configurado. Se están usando límites por defecto.'
                        : 'Los límites no se han sincronizado desde la plataforma.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Configuration saved successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Copernicus Credentials Status */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Copernicus Data Space</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadCredentialsStatus}
              disabled={credentialsLoading}
              className="ml-auto"
            >
              {credentialsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
            </Button>
          </div>

          {credentialsLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p>Verificando estado de credenciales...</p>
            </div>
          ) : credentialsStatus ? (
            <div className={`p-4 rounded-lg border ${
              credentialsStatus.available
                ? credentialsStatus.source === 'platform'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {credentialsStatus.available ? (
                  credentialsStatus.source === 'platform' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium mb-1 ${
                    credentialsStatus.available
                      ? credentialsStatus.source === 'platform'
                        ? 'text-green-900'
                        : 'text-yellow-900'
                      : 'text-red-900'
                  }`}>
                    {credentialsStatus.available
                      ? credentialsStatus.source === 'platform'
                        ? 'Credenciales Disponibles (Plataforma)'
                        : 'Credenciales Disponibles (Módulo)'
                      : 'Credenciales No Disponibles'
                    }
                  </p>
                  <p className={`text-sm ${
                    credentialsStatus.available
                      ? credentialsStatus.source === 'platform'
                        ? 'text-green-800'
                        : 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {credentialsStatus.message}
                  </p>
                  {credentialsStatus.available && credentialsStatus.client_id_preview && (
                    <p className={`text-xs mt-2 font-mono ${
                      credentialsStatus.source === 'platform'
                        ? 'text-green-700'
                        : 'text-yellow-700'
                    }`}>
                      Client ID: {credentialsStatus.client_id_preview}
                    </p>
                  )}
                  {!credentialsStatus.available && (
                    <div className="mt-3 text-xs text-red-700">
                      <p className="font-medium mb-1">Acción requerida:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Contacte al administrador de la plataforma para configurar las credenciales</li>
                        <li>O configure credenciales específicas del módulo (configuración avanzada)</li>
                      </ul>
                    </div>
                  )}
                  {credentialsStatus.available && credentialsStatus.source === 'module' && (
                    <div className="mt-3 text-xs text-yellow-700">
                      <p className="font-medium mb-1">Recomendación:</p>
                      <p>Se recomienda usar credenciales gestionadas por la plataforma para mayor seguridad y consistencia.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p>No se pudo verificar el estado de las credenciales.</p>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-medium text-gray-700 mb-1">Información:</p>
            <p>
              Las credenciales de Copernicus Data Space se gestionan centralmente desde el panel de administración de la plataforma.
              Haga clic en "Verificar" para comprobar el estado actual.
            </p>
          </div>
        </Card>

        {/* Processing Settings */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Processing Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Index Type
              </label>
              <Select
                value={config.default_index_type || 'NDVI'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConfig({ ...config, default_index_type: e.target.value as VegetationIndexType })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cloud Coverage Threshold (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.cloud_coverage_threshold?.toString() || '20'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseFloat(value);
                  setConfig({ ...config, cloud_coverage_threshold: numValue });
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Scenes with cloud coverage above this threshold will be excluded
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_process"
                checked={config.auto_process ?? true}
                onChange={(e) => setConfig({ ...config, auto_process: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="auto_process" className="text-sm font-medium text-gray-700">
                Auto-process downloaded scenes
              </label>
            </div>
          </div>
        </Card>

        {/* Storage Settings */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Storage Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Type
              </label>
              <Select
                value={config.storage_type || 's3'}
                onChange={(e) => setConfig({ ...config, storage_type: e.target.value as 's3' | 'minio' | 'local' })}
                options={[
                  { value: 's3', label: 'AWS S3' },
                  { value: 'minio', label: 'MinIO' },
                  { value: 'local', label: 'Local Filesystem' },
                ]}
                className="w-full"
              />
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Storage Bucket</p>
              <p>El bucket se genera automáticamente basado en su tenant para garantizar seguridad y aislamiento de datos. No es necesario configurarlo manualmente.</p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {/* Recent Download Jobs */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Download Jobs</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecentJobs}
              disabled={jobsLoading}
              className="ml-auto"
            >
              {jobsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>

          {jobsLoading && recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading jobs...</p>
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No download jobs yet. Create a job to download Sentinel-2 scenes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                        {job.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
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
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : job.status === 'running'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                job.status === 'completed'
                                  ? 'bg-green-600'
                                  : job.status === 'failed'
                                  ? 'bg-red-600'
                                  : 'bg-yellow-600'
                              }`}
                              style={{ width: `${job.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{job.progress_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {job.progress_message || job.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;

