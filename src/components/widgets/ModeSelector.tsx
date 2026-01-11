/**
 * ModeSelector Component
 * Intuitive selection for vegetation indices using farmer-friendly terminology.
 * Replaces the technical dropdown with visual "cards" for Health, Water, Nutrition.
 */

import React from 'react';
import { Leaf, Droplets, Sprout, Activity } from 'lucide-react';

interface ModeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  indexType: string;
  color: string;
  bgColor: string;
}

const MODES: ModeOption[] = [
  {
    id: 'health',
    label: 'Salud del Cultivo',
    description: 'Vigor general (NDVI)',
    icon: Activity,
    indexType: 'NDVI',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'water',
    label: 'Estrés Hídrico',
    description: 'Humedad (NDMI)',
    icon: Droplets,
    indexType: 'NDMI',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'nutrition',
    label: 'Nutrición',
    description: 'Clorofila (NDRE)',
    icon: Leaf,
    indexType: 'NDRE',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'woody',
    label: 'Leñosos',
    description: 'Suelo visible (SAVI)',
    icon: Sprout,
    indexType: 'SAVI',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  }
];

interface ModeSelectorProps {
  currentIndex: string;
  onChange: (indexType: string) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  currentIndex, 
  onChange,
  disabled = false 
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map((mode) => {
        const isSelected = currentIndex === mode.indexType;
        const Icon = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.indexType)}
            disabled={disabled}
            className={`
              relative p-3 rounded-xl border text-left transition-all duration-200
              ${isSelected 
                ? `border-${mode.color.split('-')[1]}-500 ring-1 ring-${mode.color.split('-')[1]}-500 ${mode.bgColor}` 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center mb-2
              ${isSelected ? 'bg-white shadow-sm' : 'bg-white border border-slate-100'}
            `}>
              <Icon className={`w-5 h-5 ${mode.color}`} />
            </div>
            
            <div className="space-y-0.5">
              <h4 className={`font-semibold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                {mode.label}
              </h4>
              <p className="text-xs text-slate-500">
                {mode.description}
              </p>
            </div>
            
            {isSelected && (
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${mode.color.split('-')[1]}-500`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
