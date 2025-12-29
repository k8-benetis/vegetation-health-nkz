/**
 * Hook for managing vegetation configuration
 * Extracted from ConfigPage for reusability
 */

import { useState, useEffect, useCallback } from 'react';
import { useVegetationApi } from '../services/api';
import { useVegetationJobs } from './useVegetationJobs';
import type { VegetationConfig } from '../types';

export interface CredentialsStatus {
  available: boolean;
  source: 'platform' | 'module' | null;
  message: string;
  client_id_preview?: string;
}

export interface UsageData {
  plan: string;
  volume?: { used_ha: number; limit_ha: number };
  frequency?: { used_jobs_today: number; limit_jobs_today: number };
}

export function useVegetationConfig() {
  const api = useVegetationApi();
  const [config, setConfig] = useState<Partial<VegetationConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Use useVegetationJobs for recent download jobs
  const { jobs: recentJobs, loading: jobsLoading, refresh: refreshJobs } = useVegetationJobs({
    statusFilter: 'all',
    limit: 5,
  });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadCredentialsStatus = useCallback(async () => {
    try {
      setCredentialsLoading(true);
      const status = await api.getCredentialsStatus();
      setCredentialsStatus(status);
    } catch (err) {
      console.error('[useVegetationConfig] Error loading credentials status:', err);
      setCredentialsStatus({
        available: false,
        source: null,
        message: 'Error al verificar el estado de las credenciales'
      });
    } finally {
      setCredentialsLoading(false);
    }
  }, [api]);

  const loadUsage = useCallback(async () => {
    try {
      const data = await api.getCurrentUsage();
      setUsage(data);
    } catch (err) {
      console.error('[useVegetationConfig] Error loading usage:', err);
    }
  }, [api]);

  const saveConfig = useCallback(async (configToSave: Partial<VegetationConfig>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await api.updateConfig(configToSave);
      setSuccess(true);
      
      // Reload config and related data
      await loadConfig();
      refreshJobs();
      loadCredentialsStatus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[useVegetationConfig] Error saving config:', err);
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
  }, [api, loadConfig, refreshJobs, loadCredentialsStatus]);

  // Load initial data
  useEffect(() => {
    loadConfig();
    loadUsage();
    loadCredentialsStatus();
  }, [loadConfig, loadUsage, loadCredentialsStatus]);

  // Filter recent download jobs
  const downloadJobs = recentJobs.filter(j => j.job_type === 'download');

  return {
    config,
    loading,
    saving,
    error,
    success,
    credentialsStatus,
    credentialsLoading,
    usage,
    recentJobs: downloadJobs,
    jobsLoading,
    saveConfig,
    refresh: loadConfig,
    refreshCredentials: loadCredentialsStatus,
    refreshUsage: loadUsage,
    refreshJobs,
  };
}

