import React, { useState } from 'react';
import { VegetationConfig } from './components/VegetationConfig';
import { VegetationProvider } from './services/vegetationContext';
import { ModeSelector } from './components/widgets/ModeSelector';
import { TimelineWidget } from './components/slots/TimelineWidget';

/**
 * Development Harness for Vegetation Prime Module
 * This is used for local development only and is NOT the entry point for the module in production.
 */
function App() {
  const [showConfig, setShowConfig] = useState(true);

  return (
    <VegetationProvider>
      <div className="flex h-screen bg-slate-900 text-slate-200">
        
        {/* Sidebar Mock */}
        <div className="w-96 flex flex-col border-r border-slate-700 bg-slate-800">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-xl font-bold text-white">Vegetation Prime (Dev)</h1>
            <p className="text-xs text-slate-400">Environment: Standalone</p>
          </div>
          
          <div className="p-4">
             <ModeSelector mode="panel" />
          </div>

          <div className="flex-1 overflow-y-auto">
             <VegetationConfig mode="panel" />
          </div>
        </div>

        {/* Main Content Area (Map Placeholder) */}
        <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center">
          <div className="text-center p-8 max-w-lg">
             <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Map Visualization</h2>
             <p className="text-slate-400 mb-6">
               The Vegetation Layer requires a Cesium Viewer instance which is injected by the host application.
               In this standalone dev mode, the map layer is not rendered.
             </p>
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-left">
               <p className="text-xs text-slate-500 font-mono mb-2">DEBUG INFO:</p>
               <TimelineWidget />
             </div>
          </div>
        </div>
      </div>
    </VegetationProvider>
  );
}

export default App;
