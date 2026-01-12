import React from 'react';
import { Calendar } from 'lucide-react';
import { VegetationScene } from '../../types';

interface DateSelectorProps {
  selectedDate: string;
  scenes: VegetationScene[];
  onSelect: (date: string, sceneId: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, scenes, onSelect }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Calendar className="h-4 w-4 text-slate-400" />
      </div>
      <select
        value={selectedDate}
        onChange={(e) => {
          const date = e.target.value;
          const scene = scenes.find(s => s.sensing_date === date);
          if (scene) {
            onSelect(date, scene.id);
          }
        }}
        className="block w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-green-500 focus:border-green-500 bg-slate-50 text-slate-700 appearance-none"
      >
        {scenes.length === 0 ? (
          <option value="">Sin imágenes</option>
        ) : (
          scenes.map((scene) => (
            <option key={scene.id} value={scene.sensing_date}>
              {scene.sensing_date} ({scene.cloud_coverage?.toFixed(0)}% nubes)
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default DateSelector;
