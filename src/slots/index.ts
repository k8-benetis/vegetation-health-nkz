/**
 * Slot Registration for Vegetation Prime Module
 * Defines all slots that integrate with the Unified Viewer
 */

import React from 'react';
import { VegetationLayerControl } from '../components/slots/VegetationLayerControl';
import { TimelineWidget } from '../components/slots/TimelineWidget';
import { VegetationConfig } from '../components/VegetationConfig';
import { VegetationAnalytics } from '../components/VegetationAnalytics';

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
      localComponent: VegetationConfig,
      defaultProps: { mode: 'panel' }, // Always in panel mode
      showWhen: {
        entityType: ['AgriParcel'] // Only show when a parcel is selected
      }
    },
    {
      id: 'vegetation-analytics',
      component: 'VegetationAnalytics',
      priority: 30,
      localComponent: VegetationAnalytics,
      defaultProps: { mode: 'panel' }, // Always in panel mode
      showWhen: {
        entityType: ['AgriParcel'] // Only show when a parcel is selected
      }
    }
  ],
  'bottom-panel': [
    {
      id: 'vegetation-timeline',
      component: 'TimelineWidget',
      priority: 10,
      localComponent: TimelineWidget
    }
  ],
  'entity-tree': [] // No widgets for entity tree
};

/**
 * Export as viewerSlots for host integration
 * The host will look for this export to register slots
 */
export const viewerSlots = vegetationPrimeSlots;

