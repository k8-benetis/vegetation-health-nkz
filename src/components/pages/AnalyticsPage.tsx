/**
 * Analytics Page - Advanced Mode for deep analysis.
 * 
 * Features:
 * - Split screen: Map + Charts
 * - A/B Comparison slider
 * - Multi-chart timeseries
 * - Advanced calculation configuration
 * - Historical comparisons
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter, Map, Layers, Settings, Compare, LineChart } from 'lucide-react';
import { useUIKit } from '../../hooks/useUIKit';
import { Select } from '../ui/Select';
import { useVegetationApi } from '../../services/api';
import { useVegetationContext } from '../../services/vegetationContext';
import { useTimeseries } from '../../hooks/useTimeseries';
import { JobDetailsModal } from '../JobDetailsModal';
import { ComparisonSlider } from '../analytics/ComparisonSlider';
import { TimeseriesChart } from '../analytics/TimeseriesChart';
import { DistributionHistogram } from '../analytics/DistributionHistogram';
import { IndexPillSelector } from '../widgets/IndexPillSelector';
import { CalculationButton } from '../widgets/CalculationButton';
import type { VegetationJob, VegetationIndexType, VegetationScene } from '../../types';

type TabType = 'calculations' | 'timeseries' | 'comparison' | 'advanced';

export const AnalyticsPage: React.FC = () => {
  // Get UI components safely from Host
  const { Card, Button } = useUIKit();
  const api = useVegetationApi();
  const { selectedIndex, selectedEntityId, selectedDate, setSelectedIndex } = useVegetationContext();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('calculations');
  const [jobs, setJobs] = useState<VegetationJob[]>([]);
  const [scenes, setScenes] = useState<VegetationScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Comparison state
  const [comparisonLeftDate, setComparisonLeftDate] = useState<string | null>(null);
  const [comparisonRightDate, setComparisonRightDate] = useState<string | null>(null);
  
  // Histogram state
  const [histogramData, setHistogramData] = useState<number[]>([]);
  const [histogramLoading, setHistogramLoading] = useState(false);
  const [selectedJobForHistogram, setSelectedJobForHistogram] = useState<string | null>(null);
  
  // Timeseries state
  const timeseries = useTimeseries({
    entityId: selectedEntityId || '',
    indexType: selectedIndex,
  });

  // Load histogram data from backend
  const loadHistogramData = async (jobId: string) => {
    setHistogramLoading(true);
    try {
      const histogram = await api.getJobHistogram(jobId, 100);
      
      // Convert bins and counts to array of values for DistributionHistogram component
      // This creates a representative sample from the histogram
      const values: number[] = [];
      histogram.bins.forEach((bin, idx) => {
        const count = histogram.counts[idx];
        // Add count number of values at this bin center
        for (let i = 0; i < count; i++) {
          values.push(bin);
        }
      });
      
      setHistogramData(values);
      setSelectedJobForHistogram(jobId);
    } catch (err) {
      console.error('Error loading histogram:', err);
      setHistogramData([]);
    } finally {
      setHistogramLoading(false);
    }
  };

  // Auto-load histogram for first completed calculate_index job
  useEffect(() => {
    const completedJob = jobs.find(
      (j) => j.job_type === 'calculate_index' && j.status === 'completed'
    );
    
    if (completedJob && completedJob.id !== selectedJobForHistogram) {
      loadHistogramData(completedJob.id);
    } else if (!completedJob) {
      setHistogramData([]);
      setSelectedJobForHistogram(null);
    }
  }, [jobs]);

  useEffect(() => {
    loadJobs();
    loadScenes();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs(statusFilter !== 'all' ? statusFilter : undefined);
      setJobs(data?.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadScenes = async () => {
    try {
      const data = await api.listScenes(selectedEntityId || undefined);
      setScenes(data.scenes || []);
      
      // Auto-select dates for comparison if available
      if (data.scenes && data.scenes.length >= 2 && !comparisonLeftDate && !comparisonRightDate) {
        setComparisonLeftDate(data.scenes[data.scenes.length - 1].sensing_date);
        setComparisonRightDate(data.scenes[0].sensing_date);
      }
    } catch (err) {
      console.error('Error loading scenes:', err);
      setScenes([]);
    }
  };

  // Calculate statistics
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;

  // Prepare timeseries data for chart
  const timeseriesData = timeseries.data.length > 0
    ? [
        {
          label: 'Vigor Actual',
          color: '#10b981',
          data: timeseries.data,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Análisis Avanzado</h1>
              </div>
              <p className="text-gray-600">Análisis profundo y comparaciones históricas</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 border-b border-gray-200">
            {[
              { id: 'calculations' as TabType, label: 'Cálculos', icon: Layers },
              { id: 'timeseries' as TabType, label: 'Series Temporales', icon: LineChart },
              { id: 'comparison' as TabType, label: 'Comparación A/B', icon: Compare },
              { id: 'advanced' as TabType, label: 'Configuración', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Proceso</p>
                <p className="text-2xl font-bold text-yellow-600">{runningJobs}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{failedJobs}</p>
              </div>
              <Filter className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === 'calculations' && (
          <div className="space-y-6">
            {/* Split Screen: Configuration + Map Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Configuration */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Nuevo Cálculo</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Índice
                    </label>
                    <IndexPillSelector
                      selectedIndex={selectedIndex}
                      onIndexChange={setSelectedIndex}
                      showCustom={true}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escena
                    </label>
                    <Select
                      value={selectedDate || ''}
                      onChange={(e) => {
                        const scene = scenes.find(s => s.sensing_date === e.target.value);
                        if (scene) {
                          // Update context with scene
                        }
                      }}
                      options={scenes.map(s => ({
                        value: s.sensing_date,
                        label: `${s.sensing_date} (${s.cloud_coverage?.toFixed(1) || 'N/A'}% nubes)`,
                      }))}
                      className="w-full"
                    />
                  </div>

                  <CalculationButton
                    variant="primary"
                    size="lg"
                  />
                </div>
              </Card>

              {/* Right: Map Preview Placeholder */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vista Previa</h2>
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Map className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Mapa de visualización</p>
                    <p className="text-xs mt-1">Integrar con visor unificado</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Histogram - Distribution Analysis */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Distribución de Valores
                </h2>
                {selectedJobForHistogram && (
                  <button
                    onClick={() => {
                      const job = jobs.find(j => j.id === selectedJobForHistogram);
                      if (job) {
                        setSelectedJobId(job.id);
                        setIsModalOpen(true);
                      }
                    }}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    Ver detalles del job
                  </button>
                )}
              </div>
              {histogramLoading ? (
                <div className="text-center py-8 text-gray-500">Cargando histograma...</div>
              ) : histogramData.length > 0 ? (
                <DistributionHistogram
                  values={histogramData}
                  indexType={selectedIndex}
                  bins={6}
                  height={250}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay datos de histograma disponibles.</p>
                  <p className="text-xs mt-2">Completa un cálculo de índice para ver la distribución.</p>
                </div>
              )}
            </Card>

            {/* Jobs Table */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Jobs Recientes</h2>
                <Select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'pending', label: 'Pendientes' },
                    { value: 'running', label: 'En Proceso' },
                    { value: 'completed', label: 'Completados' },
                    { value: 'failed', label: 'Fallidos' },
                  ]}
                  className="w-48"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No se encontraron jobs</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progreso</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                            {job.id.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{job.job_type}</td>
                          <td className="py-3 px-4">
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
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${job.progress_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{job.progress_percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'timeseries' && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Series Temporales</h2>
              {timeseries.loading ? (
                <div className="text-center py-8 text-gray-500">Cargando datos...</div>
              ) : timeseries.error ? (
                <div className="text-center py-8 text-red-500">{timeseries.error}</div>
              ) : (
                <TimeseriesChart
                  series={timeseriesData}
                  indexType={selectedIndex}
                  height={400}
                />
              )}
            </Card>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparación A/B</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Izquierda
                  </label>
                  <Select
                    value={comparisonLeftDate || ''}
                    onChange={(e) => setComparisonLeftDate(e.target.value)}
                    options={scenes.map(s => ({
                      value: s.sensing_date,
                      label: `${s.sensing_date} (${s.cloud_coverage?.toFixed(1) || 'N/A'}% nubes)`,
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Derecha
                  </label>
                  <Select
                    value={comparisonRightDate || ''}
                    onChange={(e) => setComparisonRightDate(e.target.value)}
                    options={scenes.map(s => ({
                      value: s.sensing_date,
                      label: `${s.sensing_date} (${s.cloud_coverage?.toFixed(1) || 'N/A'}% nubes)`,
                    }))}
                    className="w-full"
                  />
                </div>
              </div>

              <ComparisonSlider
                leftImage={null} // TODO: Get actual tile URLs
                rightImage={null} // TODO: Get actual tile URLs
                leftLabel={comparisonLeftDate || 'Sin seleccionar'}
                rightLabel={comparisonRightDate || 'Sin seleccionar'}
              />
            </Card>
          </div>
        )}

        {activeTab === 'advanced' && (
          <Card padding="lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración Avanzada</h2>
            <p className="text-gray-600">Configuración avanzada de cálculos (próximamente)</p>
          </Card>
        )}

        {/* Job Details Modal */}
        {selectedJobId && (
          <JobDetailsModal
            jobId={selectedJobId}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedJobId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
