/**
 * Timeline Widget - Slot component for bottom panel.
 * Enhanced with Smart Timeline showing index trends over time.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, BarChart3, Eye, EyeOff } from 'lucide-react';
import { useViewer } from '@nekazari/sdk';
import { useUIKit } from '../../hooks/useUIKit';
import { useVegetationContext } from '../../services/vegetationContext';
import { useVegetationApi } from '../../services/api';
import { SceneStats } from '../../types';
import { SmartTimeline } from '../widgets/SmartTimeline';

interface TimelineWidgetProps {
  entityId?: string;
}

export const TimelineWidget: React.FC<TimelineWidgetProps> = ({ entityId }) => {
  // Get UI components safely from Host
  const { Card } = useUIKit();
  const { currentDate, setCurrentDate } = useViewer();
  const {
    selectedIndex,
    selectedDate,
    selectedEntityId,
    setSelectedDate,
    setSelectedSceneId,
  } = useVegetationContext();

  const api = useVegetationApi();
  const [stats, setStats] = useState<SceneStats[]>([]);
  const [previousYearStats, setPreviousYearStats] = useState<SceneStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showChart, setShowChart] = useState(true);

  const effectiveEntityId = entityId || selectedEntityId;

  // Load stats for the timeline chart
  const loadStats = useCallback(async () => {
    if (!effectiveEntityId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load current period stats
      const response = await api.getSceneStats(effectiveEntityId, selectedIndex, 12);
      setStats(response.stats);

      // Auto-select most recent scene if none selected
      if (!selectedDate && response.stats.length > 0) {
        const mostRecent = response.stats[0]; // Already sorted desc
        setSelectedDate(mostRecent.sensing_date);
        setSelectedSceneId(mostRecent.scene_id);
      }
    } catch (err) {
      console.error('[TimelineWidget] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  }, [effectiveEntityId, selectedIndex, api, selectedDate, setSelectedDate, setSelectedSceneId]);

  // Load comparison data when enabled
  const loadComparison = useCallback(async () => {
    if (!effectiveEntityId || !showComparison) return;

    try {
      const response = await api.compareYears(effectiveEntityId, selectedIndex || 'NDVI');
      // Convert previous year stats to SceneStats format
      const prevYearSceneStats: SceneStats[] = response.previous_year.stats.map(s => ({
        scene_id: '',
        sensing_date: s.sensing_date,
        mean_value: s.mean_value,
        min_value: null,
        max_value: null,
        std_dev: null,
        cloud_coverage: null,
      }));
      setPreviousYearStats(prevYearSceneStats);
    } catch (err) {
      console.error('[TimelineWidget] Error fetching comparison:', err);
    }
  }, [effectiveEntityId, showComparison, selectedIndex, api]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load comparison when toggled
  useEffect(() => {
    if (showComparison) {
      loadComparison();
    }
  }, [showComparison, loadComparison]);

  // Handle date selection from chart
  const handleDateSelect = useCallback((date: string, sceneId: string) => {
    setSelectedDate(date);
    setSelectedSceneId(sceneId);
    
    // Update viewer's currentDate
    if (setCurrentDate) {
      setCurrentDate(new Date(date));
    }
  }, [setSelectedDate, setSelectedSceneId, setCurrentDate]);

  // Sync with viewer's currentDate changes
  useEffect(() => {
    if (currentDate && stats.length > 0) {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      // Find closest scene to currentDate
      const closestScene = stats.find(s => s.sensing_date === currentDateStr);
      if (closestScene && closestScene.sensing_date !== selectedDate) {
        setSelectedDate(closestScene.sensing_date);
        setSelectedSceneId(closestScene.scene_id);
      }
    }
  }, [currentDate, stats, selectedDate, setSelectedDate, setSelectedSceneId]);

  if (!effectiveEntityId) {
    return (
      <Card padding="md" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
          <Calendar className="w-5 h-5" />
          <p>Selecciona una parcela para ver el historial</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
        <div className="text-center text-red-600 py-4">
          <p>{error}</p>
          <button 
            onClick={loadStats}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
              showChart 
                ? 'bg-slate-800 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Gráfica
          </button>
          
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
              showComparison 
                ? 'bg-amber-500 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showComparison ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Año anterior
          </button>
        </div>
        
        <div className="text-xs text-slate-500">
          {stats.length} escenas disponibles
        </div>
      </div>

      {/* Smart Timeline with chart */}
      {showChart && (
        <SmartTimeline
          stats={stats}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          indexType={selectedIndex || 'NDVI'}
          previousYearStats={showComparison ? previousYearStats : undefined}
          showComparison={showComparison}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default TimelineWidget;
