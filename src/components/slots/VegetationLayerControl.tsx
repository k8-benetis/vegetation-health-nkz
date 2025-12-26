/**
 * Vegetation Layer Control - Slot component for layer controls.
 * Integrates with UnifiedViewer to control vegetation layer visibility and settings.
 */

import React from 'react';
import { Leaf, Calendar } from 'lucide-react';
import { getUIKit } from '../../utils/ui-kit-loader';
import { useVegetationContext } from '../../services/vegetationContext';
import type { VegetationIndexType } from '../../types';

// Get ui-kit components from host
const { Card, Select } = getUIKit();

interface VegetationLayerControlProps {
  // Slot integration props (provided by host)
  onLayerUpdate?: (layerConfig: any) => void;
}

export const VegetationLayerControl: React.FC<VegetationLayerControlProps> = ({
  onLayerUpdate,
}) => {
  const {
    selectedIndex,
    selectedDate,
    setSelectedIndex,
    setSelectedDate,
  } = useVegetationContext();

  const indexOptions: { value: VegetationIndexType; label: string }[] = [
    { value: 'NDVI', label: 'NDVI - Normalized Difference Vegetation Index' },
    { value: 'EVI', label: 'EVI - Enhanced Vegetation Index' },
    { value: 'SAVI', label: 'SAVI - Soil-Adjusted Vegetation Index' },
    { value: 'GNDVI', label: 'GNDVI - Green Normalized Difference Vegetation Index' },
    { value: 'NDRE', label: 'NDRE - Normalized Difference Red Edge' },
  ];

  const handleIndexChange = (value: string) => {
    const index = value as VegetationIndexType;
    setSelectedIndex(index);
    
    // Notify host about layer update
    if (onLayerUpdate) {
      onLayerUpdate({
        indexType: index,
        date: selectedDate,
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
      });
    }
  };

  return (
    <Card padding="md" className="mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Vegetation Layer</h3>
      </div>

      <div className="space-y-4">
        {/* Index Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Index Type
          </label>
          <Select
            value={selectedIndex}
            onChange={(e) => handleIndexChange(e.target.value)}
            options={indexOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            className="w-full"
          />
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sensing Date
          </label>
          <input
            type="date"
            value={selectedDate || ''}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p>
            <strong>{selectedIndex}:</strong> {
              selectedIndex === 'NDVI' && 'Measures vegetation health and density'
            }
            {selectedIndex === 'EVI' && 'Enhanced index that reduces atmospheric and soil effects'}
            {selectedIndex === 'SAVI' && 'Soil-adjusted index for areas with exposed soil'}
            {selectedIndex === 'GNDVI' && 'Uses green band, sensitive to chlorophyll content'}
            {selectedIndex === 'NDRE' && 'Uses red edge band, sensitive to crop stress'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default VegetationLayerControl;

