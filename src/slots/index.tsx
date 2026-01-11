/**
 * Slot Registration for Vegetation Prime Module
 * Defines all slots that integrate with the Unified Viewer
 */

import React from 'react';
import { VegetationLayerControl } from '../components/slots/VegetationLayerControl';
import { TimelineWidget } from '../components/slots/TimelineWidget';
import { VegetationConfig } from '../components/VegetationConfig';
import { VegetationAnalytics } from '../components/VegetationAnalytics';
import { VegetationProvider } from '../services/vegetationContext';

// Type definitions for slot widgets (matching SDK types)
export interface SlotWidgetDefinition {
  id: string;
  component: string;
  priority: number;
  localComponent: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  showWhen?: {
    entityType?: string[];
    layerActive?: string[];
  };
}

export type SlotType = 'layer-toggle' | 'context-panel' | 'bottom-panel' | 'entity-tree';

export type ModuleViewerSlots = Record<SlotType, SlotWidgetDefinition[]>;

/**
 * Wrapped components with VegetationProvider for standalone slot usage
 */
const TimelineWidgetWithProvider: React.FC<any> = (props) => (
  <VegetationProvider>
    <TimelineWidget {...props} />
  </VegetationProvider>
);

const VegetationConfigWithProvider: React.FC<any> = (props) => (
  <VegetationProvider>
    <VegetationConfig {...props} />
  </VegetationProvider>
);

const VegetationAnalyticsWithProvider: React.FC<any> = (props) => (
  <VegetationProvider>
    <VegetationAnalytics {...props} />
  </VegetationProvider>
);

/**
 * Vegetation Prime Slots Configuration
 * These slots integrate the module into the Unified Viewer
 */
export const vegetationPrimeSlots: ModuleViewerSlots = {
  'layer-toggle': [
    {
      id: 'vegetation-layer-control',
      component: 'VegetationLayerControl',
      priority: 10,
      localComponent: VegetationLayerControl,
    }
  ],
  'context-panel': [
    {
      id: 'vegetation-config',
      component: 'VegetationConfig',
      priority: 20,
      localComponent: VegetationConfigWithProvider,
      defaultProps: { mode: 'panel' },
      showWhen: {
        entityType: ['AgriParcel']
      }
    },
    {
      id: 'vegetation-analytics',
      component: 'VegetationAnalytics',
      priority: 30,
      localComponent: VegetationAnalyticsWithProvider,
      defaultProps: { mode: 'panel' },
      showWhen: {
        entityType: ['AgriParcel']
      }
    }
  ],
  'bottom-panel': [
    {
      id: 'vegetation-timeline',
      component: 'TimelineWidget',
      priority: 10,
      localComponent: TimelineWidgetWithProvider
    }
  ],
  'entity-tree': []
};

/**
 * Export as viewerSlots for host integration
 */
export const viewerSlots = vegetationPrimeSlots;
