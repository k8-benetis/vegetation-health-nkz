/**
 * Wrapped VegetationConfig export for Module Federation
 */
import React from 'react';
import { VegetationConfig as BaseComponent } from '../components/VegetationConfig';
import { VegetationProvider } from '../services/vegetationContext';

export const VegetationConfig: React.FC<any> = (props) => (
  <VegetationProvider>
    <BaseComponent {...props} />
  </VegetationProvider>
);

export default VegetationConfig;
