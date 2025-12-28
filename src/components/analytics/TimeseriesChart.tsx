/**
 * Timeseries Chart - Multi-line chart for vegetation index timeseries.
 * Supports multiple series for comparison (e.g., current year vs previous year).
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TimeseriesDataPoint } from '../../types';

interface TimeseriesSeries {
  label: string;
  color: string;
  data: TimeseriesDataPoint[];
  dashed?: boolean;
}

interface TimeseriesChartProps {
  series: TimeseriesSeries[];
  indexType: string;
  className?: string;
  height?: number;
}

export const TimeseriesChart: React.FC<TimeseriesChartProps> = ({
  series,
  indexType,
  className = '',
  height = 300,
}) => {
  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center text-gray-500 ${className}`}>
        <p>No data available for timeseries</p>
      </div>
    );
  }

  // Get all unique dates and calculate min/max values
  const allDates = new Set<string>();
  series.forEach((s) => s.data.forEach((d) => allDates.add(d.date)));
  const sortedDates = Array.from(allDates).sort();

  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;

  // Calculate chart dimensions
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Helper to convert value to Y coordinate
  const valueToY = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    return chartPadding.top + plotHeight - normalized * plotHeight;
  };

  // Helper to convert date to X coordinate
  const dateToX = (_date: string, index: number) => {
    return chartPadding.left + (index / (sortedDates.length - 1 || 1)) * plotWidth;
  };

  // Calculate trend
  const calculateTrend = (data: TimeseriesDataPoint[]) => {
    if (data.length < 2) return null;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    const percentChange = (change / first) * 100;
    return { change, percentChange };
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{indexType} Timeseries</h3>
        <p className="text-sm text-gray-500">Evolution over time</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {series.map((s, idx) => {
          const trend = calculateTrend(s.data);
          return (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-4 h-0.5"
                style={{
                  backgroundColor: s.color,
                  borderStyle: s.dashed ? 'dashed' : 'solid',
                }}
              />
              <span className="text-sm text-gray-700">{s.label}</span>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : trend.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      trend.change > 0 ? 'text-green-600' : trend.change < 0 ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    {trend.change > 0 ? '+' : ''}
                    {trend.percentChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border-t border-l border-gray-200">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartPadding.top + plotHeight - ratio * plotHeight;
            const value = minValue + ratio * valueRange;
            return (
              <g key={ratio}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartPadding.left + plotWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                <text
                  x={chartPadding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {value.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Plot Lines */}
          {series.map((s, seriesIdx) => {
            const points = sortedDates
              .map((date, dateIdx) => {
                const dataPoint = s.data.find((d) => d.date === date);
                if (!dataPoint) return null;
                return {
                  x: dateToX(date, dateIdx),
                  y: valueToY(dataPoint.value),
                };
              })
              .filter((p) => p !== null) as Array<{ x: number; y: number }>;

            if (points.length < 2) return null;

            const pathData = points
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            return (
              <g key={seriesIdx}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5,5' : '0'}
                  opacity={0.8}
                />
                {points.map((p, pointIdx) => (
                  <circle
                    key={pointIdx}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={s.color}
                    className="hover:r-6 transition-all"
                  />
                ))}
              </g>
            );
          })}

          {/* X-Axis Labels */}
          {sortedDates.map((date, idx) => {
            if (idx % Math.ceil(sortedDates.length / 6) !== 0 && idx !== sortedDates.length - 1)
              return null;
            const x = dateToX(date, idx);
            const dateObj = new Date(date);
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight - chartPadding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {series.map((s, idx) => {
          if (s.data.length === 0) return null;
          const values = s.data.map((d) => d.value);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          return (
            <div key={idx} className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-900 mb-1">{s.label}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Media: {mean.toFixed(3)}</div>
                <div>
                  Rango: {min.toFixed(3)} - {max.toFixed(3)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


