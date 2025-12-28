/**
 * Job Details Modal - Shows detailed information, statistics, and visualizations for a job.
 */

import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Info, Cloud } from 'lucide-react';
import { useUIKit } from '../hooks/useUIKit';
import { useVegetationApi } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JobDetailsModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ jobId, isOpen, onClose }) => {
  const { Card } = useUIKit();
  const api = useVegetationApi();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{
    job: any;
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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
    }
  }, [isOpen, jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getJobDetails(jobId);
      setDetails(data);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Prepare timeseries data for chart
  const timeseriesData = details?.timeseries
    ?.filter(ts => ts.mean_value !== null)
    .map(ts => ({
      date: new Date(ts.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      value: ts.mean_value,
      index_type: ts.index_type,
    }))
    .reverse() || [];

  // Prepare histogram data (simplified - using min/max/std to create bins)
  const histogramData = details?.index_stats
    ? (() => {
        const { min, max, mean, std_dev } = details.index_stats;
        if (min === null || max === null || mean === null) return null;
        
        // Create 10 bins between min and max
        const bins = 10;
        const binWidth = (max - min) / bins;
        const histogram: { range: string; count: number }[] = [];
        
        for (let i = 0; i < bins; i++) {
          const binMin = min + i * binWidth;
          const binMax = min + (i + 1) * binWidth;
          // Estimate count based on normal distribution (simplified)
          const center = (binMin + binMax) / 2;
          const distance = Math.abs(center - mean);
          const estimatedCount = Math.max(0, 100 * Math.exp(-(distance * distance) / (2 * (std_dev || 1) * (std_dev || 1))));
          
          histogram.push({
            range: `${binMin.toFixed(2)}-${binMax.toFixed(2)}`,
            count: Math.round(estimatedCount),
          });
        }
        return histogram;
      })()
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles del Job
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {details?.job && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-mono">{details.job.id.substring(0, 8)}...</span>
                {' • '}
                <span className="capitalize">{details.job.job_type}</span>
                {' • '}
                <span className={`capitalize ${
                  details.job.status === 'completed' ? 'text-green-600' :
                  details.job.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {details.job.status}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-500">Cargando detalles del job...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : details ? (
              <div className="space-y-6">
                {/* Statistics Cards */}
                {details.index_stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card padding="md">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Valor Medio</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {details.index_stats.mean?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                    </Card>
                    <Card padding="md">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {details.index_stats.min?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                    </Card>
                    <Card padding="md">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Máximo</p>
                        <p className="text-2xl font-bold text-green-600">
                          {details.index_stats.max?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                    </Card>
                    <Card padding="md">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Desv. Estándar</p>
                        <p className="text-2xl font-bold text-gray-700">
                          {details.index_stats.std_dev?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Scene Info */}
                {details.scene_info && (
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Información de la Escena</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Fecha de Sensado</p>
                        <p className="font-medium text-gray-900">
                          {new Date(details.scene_info.sensing_date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cobertura de Nubes</p>
                        <div className="flex items-center gap-2">
                          <Cloud className={`w-4 h-4 ${
                            details.scene_info.cloud_coverage < 10 ? 'text-green-500' :
                            details.scene_info.cloud_coverage < 30 ? 'text-yellow-500' :
                            'text-red-500'
                          }`} />
                          <p className="font-medium text-gray-900">
                            {details.scene_info.cloud_coverage?.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Timeseries Chart */}
                {timeseriesData.length > 0 && (
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Evolución Temporal</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeseriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Valor del Índice"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Histogram */}
                {histogramData && (
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Distribución de Valores</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={histogramData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" name="Frecuencia" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* No data message */}
                {!details.index_stats && !details.timeseries && !details.scene_info && (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay datos estadísticos disponibles para este job.</p>
                    <p className="text-sm mt-1">
                      {details.job.status === 'completed'
                        ? 'El job se completó pero no generó estadísticas.'
                        : 'El job aún no se ha completado.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No se encontraron detalles para este job.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


