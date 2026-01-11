/**
 * Vegetation Prime - Main App Component
 * High-performance vegetation intelligence suite for Nekazari Platform
 */

import React, { useState } from 'react';
import { Settings, Globe, Info } from 'lucide-react';
import { VegetationProvider } from './services/vegetationContext';
import { VegetationConfig } from './components/VegetationConfig';
import VegetationMap3D from './components/viewer/VegetationMap3D';
import './index.css';

// Slot components (exported for host integration)
export { VegetationLayerControl } from './components/slots/VegetationLayerControl';
export { TimelineWidget } from './components/slots/TimelineWidget';
export { VegetationLayer, useVegetationLayer, createVegetationLayer } from './components/slots/VegetationLayer';

// Export viewerSlots for host integration
export { viewerSlots } from './slots/index';

type TabType = 'config' | 'digital-twin';

const VegetationPrimeApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('digital-twin');
  const [selectedParcelId, setSelectedParcelId] = useState<string | undefined>(undefined);

  return (
    <VegetationProvider>
      <div className="w-full bg-gray-900 min-h-screen flex flex-col">
        {/* Header with Tabs */}
        <div className="bg-gray-800 border-b border-gray-700 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">Vegetation <span className="text-emerald-400">Prime</span></h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-full">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-300">Digital Twin Active</span>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('digital-twin')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 ${
                    activeTab === 'digital-twin'
                      ? 'border-emerald-500 text-emerald-400 bg-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>3D TWIN</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 ${
                    activeTab === 'config'
                      ? 'border-emerald-500 text-emerald-400 bg-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>CONFIG</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Full Height for Map */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'digital-twin' && (
            <div className="absolute inset-0 bg-black">
               <VegetationMap3D 
                  parcelId={selectedParcelId}
                  activeLens="optical" 
               />
            </div>
          )}
          
          {activeTab === 'config' && (
             <div className="max-w-7xl mx-auto px-4 py-8 h-full overflow-auto">
               <div className="bg-white rounded-xl shadow-xl p-6">
                 <VegetationConfig mode="page" />
               </div>
             </div>
          )}
        </div>
      </div>
    </VegetationProvider>
  );
};

export default VegetationPrimeApp;
