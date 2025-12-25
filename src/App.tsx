/**
 * Vegetation Prime - Main App Component
 * High-performance vegetation intelligence suite for Nekazari Platform
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VegetationProvider } from './services/vegetationContext';
import ConfigPage from './components/pages/ConfigPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import './index.css';

// Slot components (exported for host integration)
export { VegetationLayerControl } from './components/slots/VegetationLayerControl';
export { TimelineWidget } from './components/slots/TimelineWidget';
export { VegetationLayer, useVegetationLayer, createVegetationLayer } from './components/slots/VegetationLayer';

const VegetationPrimeApp: React.FC = () => {
  return (
    <VegetationProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/config" replace />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </VegetationProvider>
  );
};

// CRITICAL: Export as default - required for Module Federation
export default VegetationPrimeApp;
