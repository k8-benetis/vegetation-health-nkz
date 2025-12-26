/**
 * Timeline Widget - Slot component for bottom panel.
 * Displays available scenes in a horizontal timeline with cloud coverage indicators.
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { getUIKit } from '../../utils/ui-kit-loader';
import { useVegetationContext } from '../../services/vegetationContext';
import { useVegetationApi } from '../../services/api';
import type { VegetationScene } from '../../types';

// Get ui-kit components from host
const { Card } = getUIKit();

interface TimelineWidgetProps {
  entityId?: string;
}

export const TimelineWidget: React.FC<TimelineWidgetProps> = ({ entityId }) => {
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

  const effectiveEntityId = entityId || selectedEntityId;

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

  const handleSceneClick = (scene: VegetationScene) => {
    setSelectedDate(scene.sensing_date);
    setSelectedSceneId(scene.id);
  };

  const getCloudCoverageColor = (coverage?: number): string => {
    if (!coverage) return 'text-gray-400';
    if (coverage < 10) return 'text-green-500';
    if (coverage < 30) return 'text-yellow-500';
    if (coverage < 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCloudCoverageIcon = (coverage?: number) => {
    if (!coverage) return <CloudOff className="w-4 h-4" />;
    if (coverage < 10) return <Cloud className="w-4 h-4 text-green-500" />;
    if (coverage < 30) return <Cloud className="w-4 h-4 text-yellow-500" />;
    return <Cloud className="w-4 h-4 text-red-500" />;
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
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Available Scenes
        </h3>
        <span className="text-sm text-gray-500">({scenes.length} scenes)</span>
      </div>

      {/* Horizontal Timeline */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {scenes.map((scene) => {
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
                <div className="mt-1 flex items-center gap-1">
                  {getCloudCoverageIcon(scene.cloud_coverage)}
                  {scene.cloud_coverage !== undefined && (
                    <span className={`text-xs ${getCloudCoverageColor(scene.cloud_coverage)}`}>
                      {scene.cloud_coverage.toFixed(0)}%
                    </span>
                  )}
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
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Selected: </span>
              <span className="font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Index:</span>
              <span className="font-semibold text-green-600">{selectedIndex}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TimelineWidget;
