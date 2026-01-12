import React from 'react';
import { SceneStats } from '../../types';

interface DistributionHistogramProps {
  stats: SceneStats[];
  indexType: string;
}

const DistributionHistogram: React.FC<DistributionHistogramProps> = ({ stats, indexType }) => {
  return (
     <div className="w-full h-40 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <div className="text-center">
        <p className="text-slate-500 font-medium">Histograma: {indexType}</p>
        <p className="text-xs text-slate-400">Datos: {stats.length} escenas</p>
        <p className="text-xs text-amber-500 mt-2">(Visualización en desarrollo)</p>
      </div>
    </div>
  );
};

export default DistributionHistogram;
