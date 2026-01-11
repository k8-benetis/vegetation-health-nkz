/**
 * Wrapped VegetationLayerControl export for Module Federation
 */
import React from 'react';
import { VegetationLayerControl as BaseComponent } from '../components/slots/VegetationLayerControl';
import { VegetationProvider } from '../services/vegetationContext';

export const VegetationLayerControl: React.FC<any> = (props) => (
  <VegetationProvider>
    <BaseComponent {...props} />
  </VegetationProvider>
);

export default VegetationLayerControl;
