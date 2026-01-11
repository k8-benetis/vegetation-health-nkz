/**
 * Wrapped VegetationLayer export for Module Federation
 */
import React from 'react';
import { VegetationLayer as BaseComponent } from '../components/slots/VegetationLayer';
import { VegetationProvider } from '../services/vegetationContext';

export const VegetationLayer: React.FC<any> = (props) => (
  <VegetationProvider>
    <BaseComponent {...props} />
  </VegetationProvider>
);

export default VegetationLayer;
