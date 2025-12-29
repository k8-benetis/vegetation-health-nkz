/**
 * VegetationAnalytics Component - Refactored from AnalyticsPage
 * Mobile-first design for panel (300-400px) and full-page modes
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Layers, 
  GitCompare, 
  LineChart,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useViewer } from '@nekazari/sdk';
import { useUIKit } from '../hooks/useUIKit';
import { Select } from './ui/Select';
import { useVegetationApi } from '../services/api';
import { useVegetationContext } from '../services/vegetationContext';
import { useVegetationJobs } from '../hooks/useVegetationJobs';
import { useVegetationScenes } from '../hooks/useVegetationScenes';
import { useTimeseries } from '../hooks/useTimeseries';
import { JobDetailsModal } from './JobDetailsModal';
import { ComparisonSlider } from './analytics/ComparisonSlider';
import { TimeseriesChart } from './analytics/TimeseriesChart';
import { DistributionHistogram } from './analytics/DistributionHistogram';
import { IndexPillSelector } from './widgets/IndexPillSelector';
import { CalculationButton } from './widgets/CalculationButton';
import type { VegetationJob } from '../types';

export interface VegetationAnalyticsProps {
  parcelId?: string | null; // Parcela seleccionada (opcional, se obtiene de useViewer si no se proporciona)
  mode?: 'panel' | 'full-page';
  className?: string;
}

type TabType = 'calculations' | 'timeseries' | 'comparison';

export const VegetationAnalytics: React.FC<VegetationAnalyticsProps> = ({
  parcelId: propParcelId,
  mode = 'panel',
  className
}) => {
  // Get parcelId from useViewer if not provided as prop
  const { selectedEntityId, selectedEntityType } = useViewer();
  const parcelId = propParcelId ?? (selectedEntityType === 'AgriParcel' ? selectedEntityId : null);
  const { Card } = useUIKit();
  const api = useVegetationApi();
  const { selectedIndex, selectedDate, selectedSceneId, setSelectedIndex } = useVegetationContext();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('calculations');
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
  
  // Calculation mode: 'single' or 'composite'
  const [calculationMode, setCalculationMode] = useState<'single' | 'composite'>('composite');
  const [compositeStartDate, setCompositeStartDate] = useState<string>('');
  const [compositeEndDate, setCompositeEndDate] = useState<string>('');

  // Use hooks
  const effectiveEntityId = parcelId || null;
  const { jobs, loading: jobsLoading, statistics } = useVegetationJobs({
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    limit: mode === 'panel' ? 10 : 50,
  });
  
  const { scenes, loading: scenesLoading } = useVegetationScenes({
    entityId: effectiveEntityId,
    autoRefresh: false,
  });

  const timeseries = useTimeseries({
    entityId: effectiveEntityId || '',
    indexType: selectedIndex,
  });

  // Load histogram data from backend
  const loadHistogramData = async (jobId: string) => {
    setHistogramLoading(true);
    try {
      const histogram = await api.getJobHistogram(jobId, 100);
      
      // Convert bins and counts to array of values for DistributionHistogram component
      const values: number[] = [];
      histogram.bins.forEach((bin, idx) => {
        const count = histogram.counts[idx];
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

  // Auto-select dates for comparison if available
  useEffect(() => {
    if (scenes && scenes.length >= 2 && !comparisonLeftDate && !comparisonRightDate) {
      setComparisonLeftDate(scenes[scenes.length - 1].sensing_date);
      setComparisonRightDate(scenes[0].sensing_date);
    }
  }, [scenes, comparisonLeftDate, comparisonRightDate]);

  // Layout adaptativo según mode
  const containerClass = mode === 'panel' 
    ? 'space-y-3' // Compacto para panel
    : 'space-y-6'; // Generoso para página completa
  
  const cardPadding = mode === 'panel' ? 'md' : 'lg';
  const textSize = mode === 'panel' ? 'text-sm' : 'text-base';
  const headingSize = mode === 'panel' ? 'text-lg' : 'text-xl';
  const chartHeight = mode === 'panel' ? 200 : 400;

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
    <div className={`${containerClass} ${className || ''}`}>
      {/* Statistics Cards - Compact 2x2 grid in panel */}
      <div className={`grid ${mode === 'panel' ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-4'}`}>
        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSize} text-slate-500`}>Total</p>
              <p className={`${mode === 'panel' ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>
                {statistics.total}
              </p>
            </div>
            <BarChart3 className={`${mode === 'panel' ? 'w-6 h-6' : 'w-8 h-8'} text-blue-500`} />
          </div>
        </Card>

        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSize} text-slate-500`}>Completados</p>
              <p className={`${mode === 'panel' ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                {statistics.completed}
              </p>
            </div>
            <TrendingUp className={`${mode === 'panel' ? 'w-6 h-6' : 'w-8 h-8'} text-green-500`} />
          </div>
        </Card>

        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSize} text-slate-500`}>En Proceso</p>
              <p className={`${mode === 'panel' ? 'text-xl' : 'text-2xl'} font-bold text-yellow-600`}>
                {statistics.running}
              </p>
            </div>
            <Calendar className={`${mode === 'panel' ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-500`} />
          </div>
        </Card>

        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSize} text-slate-500`}>Fallidos</p>
              <p className={`${mode === 'panel' ? 'text-xl' : 'text-2xl'} font-bold text-red-600`}>
                {statistics.failed}
              </p>
            </div>
            <Filter className={`${mode === 'panel' ? 'w-6 h-6' : 'w-8 h-8'} text-red-500`} />
          </div>
        </Card>
      </div>

      {/* Tabs - Horizontal in full-page, vertical or hidden in panel */}
      {mode === 'full-page' && (
        <div className="flex space-x-1 border-b border-slate-200">
          {[
            { id: 'calculations' as TabType, label: 'Cálculos', icon: Layers },
            { id: 'timeseries' as TabType, label: 'Series Temporales', icon: LineChart },
            { id: 'comparison' as TabType, label: 'Comparación A/B', icon: GitCompare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 ${textSize} font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      {(mode === 'panel' || activeTab === 'calculations') && (
        <div className="space-y-3">
          {/* Calculation Configuration - Compact in panel */}
          <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
            <h2 className={`${headingSize} font-semibold text-slate-800 mb-3`}>Nuevo Cálculo</h2>
            
            <div className="space-y-3">
              {/* Calculation Mode Toggle */}
              <div>
                <label className={`block ${textSize} font-medium text-slate-700 mb-2`}>
                  Modo de Cálculo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalculationMode('composite')}
                    className={`
                      flex-1 px-3 py-2 rounded-md ${textSize} font-medium transition-all
                      ${calculationMode === 'composite'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span className={mode === 'panel' ? 'text-xs' : ''}>Composite</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCalculationMode('single')}
                    className={`
                      flex-1 px-3 py-2 rounded-md ${textSize} font-medium transition-all
                      ${calculationMode === 'single'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                  >
                    Escena Individual
                  </button>
                </div>
              </div>

              <div>
                <label className={`block ${textSize} font-medium text-slate-700 mb-2`}>
                  Tipo de Índice
                </label>
                <IndexPillSelector
                  selectedIndex={selectedIndex}
                  onIndexChange={setSelectedIndex}
                  showCustom={true}
                />
              </div>

              {calculationMode === 'single' ? (
                <div>
                  <label className={`block ${textSize} font-medium text-slate-700 mb-2`}>
                    Escena
                  </label>
                  <Select
                    value={selectedDate || ''}
                    onChange={(e) => {
                      // Scene selection handled by context
                    }}
                    options={scenes.map(s => ({
                      value: s.sensing_date,
                      label: `${s.sensing_date} (${s.cloud_coverage?.toFixed(1) || 'N/A'}% nubes)`,
                    }))}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className={`block ${textSize} font-medium text-slate-700 mb-1`}>
                      Rango de Fechas
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="date"
                          value={compositeStartDate}
                          onChange={(e) => setCompositeStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-0.5">Desde</p>
                      </div>
                      <div>
                        <input
                          type="date"
                          value={compositeEndDate}
                          onChange={(e) => setCompositeEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-0.5">Hasta</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <CalculationButton
                variant="primary"
                size={mode === 'panel' ? 'md' : 'lg'}
                sceneId={calculationMode === 'single' ? selectedSceneId || undefined : undefined}
                startDate={calculationMode === 'composite' ? compositeStartDate : undefined}
                endDate={calculationMode === 'composite' ? compositeEndDate : undefined}
              />
            </div>
          </Card>

          {/* Histogram - Distribution Analysis */}
          <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${headingSize} font-semibold text-slate-800`}>
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
                  className={`text-xs text-green-600 hover:text-green-700`}
                >
                  Ver detalles
                </button>
              )}
            </div>
            {histogramLoading ? (
              <div className="text-center py-6 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className={textSize}>Cargando histograma...</p>
              </div>
            ) : histogramData.length > 0 ? (
              <DistributionHistogram
                values={histogramData}
                indexType={selectedIndex}
                height={chartHeight}
              />
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className={textSize}>No hay datos de histograma disponibles.</p>
                <p className="text-xs mt-2">Completa un cálculo de índice para ver la distribución.</p>
              </div>
            )}
          </Card>

          {/* Jobs List - Compact in panel */}
          <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${headingSize} font-semibold text-slate-800`}>Trabajos Recientes</h2>
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
                className={`${mode === 'panel' ? 'w-32' : 'w-48'} text-sm`}
              />
            </div>

            {jobsLoading ? (
              <div className="text-center py-6 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className={textSize}>Cargando trabajos...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p className={textSize}>No se encontraron trabajos</p>
              </div>
            ) : (
              <div className={mode === 'panel' ? 'space-y-2' : 'overflow-x-auto'}>
                {mode === 'panel' ? (
                  // Compact list for panel
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setIsModalOpen(true);
                        }}
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
                              className="bg-green-600 h-1.5 rounded-full"
                              style={{ width: `${job.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{job.progress_percentage}%</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {job.job_type} • {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Full table for full-page
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Job ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Estado</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Progreso</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <td className="py-3 px-4 text-sm text-slate-900 font-mono">
                            {job.id.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{job.job_type}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${job.progress_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{job.progress_percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Timeseries Tab */}
      {(mode === 'full-page' && activeTab === 'timeseries') && (
        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <h2 className={`${headingSize} font-semibold text-slate-800 mb-4`}>Series Temporales</h2>
          {timeseries.loading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className={textSize}>Cargando datos...</p>
            </div>
          ) : timeseries.error ? (
            <div className="text-center py-8 text-red-500">
              <p className={textSize}>{timeseries.error}</p>
            </div>
          ) : (
            <TimeseriesChart
              series={timeseriesData}
              indexType={selectedIndex}
              height={chartHeight}
            />
          )}
        </Card>
      )}

      {/* Comparison Tab */}
      {(mode === 'full-page' && activeTab === 'comparison') && (
        <Card padding={cardPadding} className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
          <h2 className={`${headingSize} font-semibold text-slate-800 mb-4`}>Comparación A/B</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={`block ${textSize} font-medium text-slate-700 mb-2`}>
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
              <label className={`block ${textSize} font-medium text-slate-700 mb-2`}>
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
  );
};

