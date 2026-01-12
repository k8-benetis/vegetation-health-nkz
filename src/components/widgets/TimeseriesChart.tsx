import React from 'react';

interface TimeseriesChartProps {
  entityId: string;
  indexType: string;
}

const TimeseriesChart: React.FC<TimeseriesChartProps> = ({ entityId, indexType }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <div className="text-center">
        <p className="text-slate-500 font-medium">Gráfico Temporal: {indexType}</p>
        <p className="text-xs text-slate-400">Parcela: {entityId}</p>
        <p className="text-xs text-amber-500 mt-2">(Visualización en desarrollo)</p>
      </div>
    </div>
  );
};

export default TimeseriesChart;
