/**
 * Distribution Histogram - Shows distribution of vegetation index values.
 * Critical for AgTech: tells how much area is in each vigor category.
 * 
 * Example: "20% of your parcel has Low vigor, 50% Medium, 30% High"
 */

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface HistogramData {
  category: string;
  count: number;
  percentage: number;
  color: string;
  range: string;
}

interface DistributionHistogramProps {
  values: number[];
  indexType: string;
  bins?: number;
  className?: string;
  height?: number;
}

const VIGOR_CATEGORIES = [
  { label: 'Muy Bajo', min: -1, max: 0, color: '#8B0000' },
  { label: 'Bajo', min: 0, max: 0.3, color: '#FF6B6B' },
  { label: 'Moderado', min: 0.3, max: 0.5, color: '#FFD93D' },
  { label: 'Bueno', min: 0.5, max: 0.7, color: '#6BCF7F' },
  { label: 'Alto', min: 0.7, max: 0.9, color: '#4ECDC4' },
  { label: 'Muy Alto', min: 0.9, max: 1, color: '#006400' },
];

export const DistributionHistogram: React.FC<DistributionHistogramProps> = ({
  values,
  indexType,
  bins = 6,
  className = '',
  height = 200,
}) => {
  const histogramData = useMemo(() => {
    if (values.length === 0) {
      return [];
    }

    // Filter out invalid values
    const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return [];

    // Categorize by vigor levels
    const categoryCounts: Record<string, number> = {};
    VIGOR_CATEGORIES.forEach((cat) => {
      categoryCounts[cat.label] = 0;
    });

    validValues.forEach((value) => {
      const category = VIGOR_CATEGORIES.find(
        (cat) => value >= cat.min && value < cat.max
      ) || VIGOR_CATEGORIES[VIGOR_CATEGORIES.length - 1]; // Last category for max value
      if (category) {
        categoryCounts[category.label]++;
      }
    });

    // Convert to percentage and create data array
    const total = validValues.length;
    return VIGOR_CATEGORIES.map((cat) => ({
      category: cat.label,
      count: categoryCounts[cat.label],
      percentage: (categoryCounts[cat.label] / total) * 100,
      color: cat.color,
      range: `${cat.min.toFixed(1)} - ${cat.max.toFixed(1)}`,
    })).filter((item) => item.count > 0); // Only show categories with data
  }, [values]);

  if (values.length === 0 || histogramData.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center text-gray-500 ${className}`}>
        <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No hay datos para mostrar el histograma</p>
      </div>
    );
  }

  const maxPercentage = Math.max(...histogramData.map((d) => d.percentage));

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Distribución de {indexType}</h3>
        <p className="text-sm text-gray-500">Distribución de valores por categoría de vigor</p>
      </div>

      {/* Histogram Bars */}
      <div className="space-y-2 mb-4" style={{ height: `${height}px` }}>
        {histogramData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {/* Category Label */}
            <div className="w-24 text-xs font-medium text-gray-700 text-right">
              {item.category}
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div
                className="h-8 rounded transition-all hover:opacity-80"
                style={{
                  width: `${(item.percentage / maxPercentage) * 100}%`,
                  backgroundColor: item.color,
                  minWidth: '4px',
                }}
                title={`${item.percentage.toFixed(1)}% (${item.count.toLocaleString()} píxeles)`}
              >
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-semibold text-white drop-shadow">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Count */}
            <div className="w-20 text-xs text-gray-600 text-right">
              {item.count.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Píxeles</p>
          <p className="text-lg font-semibold text-gray-900">
            {values.filter((v) => !isNaN(v) && isFinite(v)).length.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Categorías</p>
          <p className="text-lg font-semibold text-gray-900">{histogramData.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Mayor Categoría</p>
          <p className="text-lg font-semibold text-gray-900">
            {histogramData.reduce((max, item) =>
              item.percentage > max.percentage ? item : max
            ).category}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Rangos de valores:</p>
        <div className="flex flex-wrap gap-2">
          {VIGOR_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-gray-600">
                {cat.label}: {cat.min.toFixed(1)}-{cat.max.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

