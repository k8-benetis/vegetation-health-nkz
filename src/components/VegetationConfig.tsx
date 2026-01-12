import React, { useState } from 'react';
import { useVegetationContext } from '../services/vegetationContext';
import { useVegetationConfig } from '../hooks/useVegetationConfig';
import { ModeSelector } from './widgets/ModeSelector';
import { CalculationButton } from './widgets/CalculationButton';
import { CarbonInputsWidget } from './widgets/CarbonInputsWidget';

interface VegetationConfigProps {
  mode?: 'panel' | 'page';
}

export const VegetationConfig: React.FC<VegetationConfigProps> = ({ mode = 'panel' }) => {
  const { 
    selectedEntityId, 
    selectedIndex, 
    setSelectedIndex
  } = useVegetationContext();
  
  // Hook returns { config, loading, error, saveConfig, ... }
  // NOT updateConfig
  const { config, saveConfig } = useVegetationConfig();
  const [showCarbonConfig, setShowCarbonConfig] = useState(false);

  const handleModeChange = (indexType: string) => {
    // Ensure casting if strict types are enforced, though string usually works due to union
    setSelectedIndex(indexType as any); 
  };

  if (mode === 'panel') {
    return (
      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Modo de Análisis</h3>
          <ModeSelector 
            currentIndex={selectedIndex || 'NDVI'} 
            onChange={handleModeChange} 
          />
        </section>

        <section>
          <CalculationButton />
        </section>

        <div className="border-t border-slate-200 my-2" />

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Opciones Avanzadas</h3>
            <button 
              onClick={() => setShowCarbonConfig(!showCarbonConfig)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showCarbonConfig ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          
          {showCarbonConfig && (
            <CarbonInputsWidget 
              entityId={selectedEntityId || undefined} 
              compact={true}
              onSave={(cfg) => saveConfig({ ...config, ...cfg } as any)}
            />
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Configuración Avanzada</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Análisis de Vegetación</h2>
          <ModeSelector 
            currentIndex={selectedIndex || 'NDVI'} 
            onChange={handleModeChange} 
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Cálculo de Carbono (LUE)</h2>
          <CarbonInputsWidget 
            entityId={selectedEntityId || undefined}
            onSave={(cfg) => saveConfig({ ...config, ...cfg } as any)}
          />
        </div>
      </div>
    </div>
  );
};

export default VegetationConfig;
