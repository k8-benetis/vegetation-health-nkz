/**
 * Type declarations for @nekazari/sdk
 * This file ensures TypeScript can resolve the SDK types correctly
 */

declare module '@nekazari/sdk' {
  export interface ViewerContextValue {
    selectedEntityId: string | null;
    selectedEntityType: string | null;
    currentDate: Date;
    isTimelinePlaying: boolean;
    activeLayers: Set<string>;
    isLayerActive: (layer: string) => boolean;
    setLayerActive: (layer: string, active: boolean) => void;
    toggleLayer: (layer: string) => void;
    isLeftPanelOpen: boolean;
    isRightPanelOpen: boolean;
    isBottomPanelOpen: boolean;
    activeContextModule: string | null;
    cesiumViewer: any;
    selectEntity: (id: string | null, type?: string | null) => void;
    clearSelection: () => void;
    setCurrentDate: (date: Date) => void;
    toggleTimelinePlayback: () => void;
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;
    toggleBottomPanel: () => void;
    setLeftPanelOpen: (open: boolean) => void;
    setRightPanelOpen: (open: boolean) => void;
    setActiveContextModule: (module: string | null) => void;
    setCesiumViewer: (viewer: any) => void;
  }

  export function useViewer(): ViewerContextValue;
  export function useViewerOptional(): ViewerContextValue | null;

  // Re-export other SDK exports
  export * from '@nekazari/sdk/dist/index';
}
