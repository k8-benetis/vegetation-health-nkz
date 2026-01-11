/**
 * Wrapped TimelineWidget export for Module Federation
 */
import React from 'react';
import { TimelineWidget as BaseTimelineWidget } from '../components/slots/TimelineWidget';
import { VegetationProvider } from '../services/vegetationContext';

export const TimelineWidget: React.FC<any> = (props) => (
  <VegetationProvider>
    <BaseTimelineWidget {...props} />
  </VegetationProvider>
);

export default TimelineWidget;
