/**
 * Vegetation Prime - Main App Component
 * High-performance vegetation intelligence suite for Nekazari Platform
 */

import React, { useState } from 'react';
import { Settings, BarChart3, Info } from 'lucide-react';
import { VegetationProvider } from './services/vegetationContext';
import { VegetationConfig } from './components/VegetationConfig';
import { VegetationAnalytics } from './components/VegetationAnalytics';
import './index.css';

// Slot components (exported for host integration)
export { VegetationLayerControl } from './components/slots/VegetationLayerControl';
export { TimelineWidget } from './components/slots/TimelineWidget';
export { VegetationLayer, useVegetationLayer, createVegetationLayer } from './components/slots/VegetationLayer';

// Export viewerSlots for host integration
export { viewerSlots } from './slots/index';

type TabType = 'config' | 'analytics';

const VegetationPrimeApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('config');

  return (
    <VegetationProvider>
      <div className="w-full bg-gray-50 min-h-screen">
        {/* Header with Tabs */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Vegetation Prime</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700">Modo Standalone (Fallback)</span>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'config'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Configuration</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'config' && (
            <VegetationConfig mode="page" />
          )}
          {activeTab === 'analytics' && (
            <VegetationAnalytics />
          )}
        </div>
      </div>
    </VegetationProvider>
  );
};

export default VegetationPrimeApp;
