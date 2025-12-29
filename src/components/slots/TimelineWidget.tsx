/**
 * Timeline Widget - Slot component for bottom panel.
 * Displays available scenes in a horizontal timeline with cloud coverage indicators.
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Loader2, Filter } from 'lucide-react';
import { useViewer } from '@nekazari/sdk';
import { useUIKit } from '../../hooks/useUIKit';
import { useVegetationContext } from '../../services/vegetationContext';
import { useVegetationApi } from '../../services/api';
import { CloudCoverIndicator } from '../widgets/CloudCoverIndicator';
import type { VegetationScene } from '../../types';

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
  const [scenes, setScenes] = useState<VegetationScene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterClouds, setFilterClouds] = useState(true);
  const [cloudThreshold, setCloudThreshold] = useState(20); // Default, will be loaded from config

  const effectiveEntityId = entityId || selectedEntityId;

  // Load config to get cloud threshold
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await api.getConfig();
        if (config.cloud_coverage_threshold) {
          setCloudThreshold(config.cloud_coverage_threshold);
        }
      } catch (err) {
        console.error('Error loading config for cloud threshold:', err);
        // Keep default 20%
      }
    };
    loadConfig();
  }, [api]);

  // Filter scenes by cloud coverage
  const filteredScenes = filterClouds
    ? scenes.filter((scene) => (scene.cloud_coverage ?? 100) <= cloudThreshold)
    : scenes;

  useEffect(() => {
    // Fetch available scenes
    const fetchScenes = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.listScenes(effectiveEntityId || undefined);
        setScenes(data.scenes || []);
        
        // Auto-select most recent scene if none selected
        if (!selectedDate && data.scenes && data.scenes.length > 0) {
          const mostRecent = data.scenes[0];
          setSelectedDate(mostRecent.sensing_date);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scenes');
        console.error('Error fetching scenes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScenes();
  }, [effectiveEntityId, api]);

  // Sync with viewer's currentDate
  useEffect(() => {
    if (currentDate && currentDate !== selectedDate) {
      // If viewer has a different date, try to find matching scene
      const matchingScene = scenes.find(s => s.sensing_date === currentDate);
      if (matchingScene) {
        setSelectedDate(currentDate);
        setSelectedSceneId(matchingScene.id);
      }
    }
  }, [currentDate, scenes]);

  // Sync viewer's currentDate when selectedDate changes
  useEffect(() => {
    if (selectedDate && setCurrentDate && selectedDate !== currentDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate, currentDate, setCurrentDate]);

  const handleSceneClick = (scene: VegetationScene) => {
    setSelectedDate(scene.sensing_date);
    setSelectedSceneId(scene.id);
    // Update viewer's currentDate
    if (setCurrentDate) {
      setCurrentDate(scene.sensing_date);
    }
  };

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          <p className="text-gray-500">Loading available scenes...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md">
        <div className="text-center text-red-600 py-4">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (scenes.length === 0) {
    return (
      <Card padding="md">
        <div className="text-center text-gray-500 py-4">
          <p>No scenes available. Create a download job to fetch Sentinel-2 data.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            Escenas Disponibles
          </h3>
          <span className="text-sm text-slate-500">
            ({filteredScenes.length} de {scenes.length} escenas)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filterClouds}
              onChange={(e) => setFilterClouds(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Filter className="w-3 h-3" />
            <span>Filtrar nubes (&lt;{cloudThreshold}%)</span>
          </label>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {filteredScenes.map((scene) => {
            const isSelected = selectedDate === scene.sensing_date;
            const date = new Date(scene.sensing_date);
            const day = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const year = date.getFullYear();

            return (
              <button
                key={scene.id}
                onClick={() => handleSceneClick(scene)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                  min-w-[80px] hover:shadow-md
                  ${
                    isSelected
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
                title={`${scene.sensing_date} - Cloud: ${scene.cloud_coverage?.toFixed(1) || 'N/A'}%`}
              >
                {/* Date Display */}
                <div className={`text-xs font-semibold ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                  {day}
                </div>
                <div className={`text-xs ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                  {month}
                </div>
                <div className={`text-xs ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                  {year}
                </div>

                {/* Cloud Coverage Indicator */}
                <div className="mt-1">
                  <CloudCoverIndicator
                    cloudCoverage={scene.cloud_coverage}
                    threshold={cloudThreshold}
                    size="sm"
                    showWarning={true}
                  />
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Scene Info */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-slate-500">Seleccionada: </span>
              <span className="font-semibold text-slate-800">
                {new Date(selectedDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Índice:</span>
              <span className="font-semibold text-green-600">{selectedIndex}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TimelineWidget;
