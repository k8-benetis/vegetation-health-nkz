/**
 * Vegetation Prime - Main App Component
 * High-performance vegetation intelligence suite for Nekazari Platform
 * 
 * IMPORTANT: This module uses internal tabs instead of React Router routes
 * to avoid conflicts with the host's router. The host already provides
 * the BrowserRouter context, so we use state-based navigation.
 */

import React, { useState } from 'react';
import { Settings, BarChart3 } from 'lucide-react';
import { VegetationProvider } from './services/vegetationContext';
import ConfigPage from './components/pages/ConfigPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import './index.css';

// Slot components (exported for host integration)
export { VegetationLayerControl } from './components/slots/VegetationLayerControl';
export { TimelineWidget } from './components/slots/TimelineWidget';
export { VegetationLayer, useVegetationLayer, createVegetationLayer } from './components/slots/VegetationLayer';

type TabType = 'config' | 'analytics';

const VegetationPrimeApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('config');

  return (
    <VegetationProvider>
      <div className="w-full bg-gray-50">
        {/* Header with Tabs */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Vegetation Prime</h1>
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
          {activeTab === 'config' && <ConfigPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
        </div>
      </div>
    </VegetationProvider>
  );
};

// CRITICAL: Export as default - required for Module Federation
export default VegetationPrimeApp;
