/**
 * Vegetation Layer Control - Enhanced Quick Mode for Unified Viewer.
 * Integrates with TimelineWidget and provides quick calculation actions.
 * 
 * Features:
 * - Pill-based index selector grouped by use case
 * - Quick calculation button
 * - Color scale legend
 * - Integration with existing TimelineWidget
 */

import React, { useState, useEffect } from 'react';
import { Leaf, Calendar, Settings } from 'lucide-react';
import { useUIKit } from '../../hooks/useUIKit';
import { useVegetationContext } from '../../services/vegetationContext';
import { useVegetationApi } from '../../services/api';
import { IndexPillSelector } from '../widgets/IndexPillSelector';
import { CalculationButton } from '../widgets/CalculationButton';
import { ColorScaleLegend } from '../widgets/ColorScaleLegend';
import { CloudCoverIndicator } from '../widgets/CloudCoverIndicator';
import type { VegetationIndexType, VegetationScene } from '../../types';

interface VegetationLayerControlProps {
  // Slot integration props (provided by host)
  onLayerUpdate?: (layerConfig: any) => void;
  // Optional: Link to advanced analytics page
  onNavigateToAnalytics?: () => void;
}

export const VegetationLayerControl: React.FC<VegetationLayerControlProps> = ({
  onLayerUpdate,
  onNavigateToAnalytics,
}) => {
  // Get UI components safely from Host
  const { Card } = useUIKit();
  const {
    selectedIndex,
    selectedDate,
    selectedSceneId,
    selectedEntityId,
    setSelectedIndex,
    setSelectedDate,
  } = useVegetationContext();
  const api = useVegetationApi();

  const [showLegend, setShowLegend] = useState(true);
  const [legendDynamic, setLegendDynamic] = useState(false);
  const [selectedScene, setSelectedScene] = useState<VegetationScene | null>(null);
  const [rasterStats, setRasterStats] = useState<{ min?: number; max?: number } | null>(null);

  // Load scene details when date changes
  useEffect(() => {
    const loadScene = async () => {
      if (!selectedDate) {
        setSelectedScene(null);
        setRasterStats(null);
        return;
      }

      try {
        const data = await api.listScenes();
        const scene = data.scenes.find((s) => s.sensing_date === selectedDate);
        setSelectedScene(scene || null);
        
        // Try to get raster statistics for dynamic legend from VegetationIndexCache
        if (scene && selectedSceneId) {
          try {
            // Get indices for this scene to find min/max
            const indicesResponse = await api.getIndices(
              selectedEntityId || undefined,
              scene.id,
              selectedIndex,
              'geojson'
            );
            
            // Handle both array and object response formats
            let indices = [];
            if (Array.isArray(indicesResponse)) {
              indices = indicesResponse;
            } else if (indicesResponse && indicesResponse.indices) {
              indices = indicesResponse.indices;
            } else if (indicesResponse && indicesResponse.features) {
              // GeoJSON format
              indices = indicesResponse.features.map((f: any) => f.properties);
            }
            
            if (indices && indices.length > 0) {
              const index = indices[0];
              if (index && index.min_value !== undefined && index.max_value !== undefined) {
                setRasterStats({
                  min: typeof index.min_value === 'number' ? index.min_value : parseFloat(index.min_value),
                  max: typeof index.max_value === 'number' ? index.max_value : parseFloat(index.max_value),
                });
              }
            }
          } catch (err) {
            // Silently fail - dynamic legend will use defaults
            console.debug('Could not load raster stats for dynamic legend:', err);
          }
        }
      } catch (err) {
        console.error('Error loading scene:', err);
        setSelectedScene(null);
        setRasterStats(null);
      }
    };

    loadScene();
  }, [selectedDate, selectedSceneId, selectedIndex, selectedEntityId, api]);

  const handleIndexChange = (index: VegetationIndexType) => {
    setSelectedIndex(index);
    
    // Notify host about layer update
    if (onLayerUpdate) {
      onLayerUpdate({
        indexType: index,
        date: selectedDate,
        sceneId: selectedSceneId,
      });
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setSelectedDate(date || null);
    
    if (onLayerUpdate) {
      onLayerUpdate({
        indexType: selectedIndex,
        date: date || null,
        sceneId: selectedSceneId,
      });
    }
  };

  return (
    <>
      <Card padding="md" className="mb-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Vegetation Prime</h3>
          </div>
          {onNavigateToAnalytics && (
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              title="Abrir análisis avanzado"
            >
              <Settings className="w-3 h-3" />
              <span>Avanzado</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Index Type Selector - Pills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Índice
            </label>
            <IndexPillSelector
              selectedIndex={selectedIndex}
              onIndexChange={handleIndexChange}
              showCustom={false}
            />
          </div>

          {/* Date Selector - Linked to Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Adquisición
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={selectedDate || ''}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Selecciona desde el timeline"
              />
              {selectedScene && (
                <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                  <span className="text-gray-600">Cobertura de nubes:</span>
                  <CloudCoverIndicator
                    cloudCoverage={selectedScene.cloud_coverage}
                    threshold={20}
                    size="sm"
                    showWarning={true}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 Usa el timeline inferior para seleccionar escenas disponibles
            </p>
          </div>

          {/* Quick Calculation Button */}
          <div className="pt-2 border-t border-gray-200">
            <CalculationButton
              sceneId={selectedSceneId || undefined}
              variant="primary"
              size="md"
            />
          </div>

          {/* Legend Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-600">Leyenda de colores</span>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-xs text-green-600 hover:text-green-700"
            >
              {showLegend ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
      </Card>

      {/* Color Scale Legend - Floating */}
      {showLegend && (
        <ColorScaleLegend
          indexType={selectedIndex}
          position="top-right"
          onClose={() => setShowLegend(false)}
          dynamic={legendDynamic}
          onDynamicToggle={setLegendDynamic}
          dataMin={rasterStats?.min}
          dataMax={rasterStats?.max}
        />
      )}
    </>
  );
};

export default VegetationLayerControl;

