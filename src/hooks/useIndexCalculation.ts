/**
 * Hook for managing vegetation index calculations.
 * Shared between Quick Mode (Viewer) and Advanced Mode (Analytics).
 */

import { useState, useCallback } from 'react';
import { useVegetationApi } from '../services/api';
import { useVegetationContext } from '../services/vegetationContext';
import type { VegetationIndexType } from '../types';

interface CalculationOptions {
  sceneId: string;
  indexType: VegetationIndexType;
  entityId?: string;
  formula?: string;
}

interface CalculationState {
  isCalculating: boolean;
  jobId: string | null;
  error: string | null;
  success: boolean;
}

export function useIndexCalculation() {
  const api = useVegetationApi();
  const { selectedSceneId, selectedEntityId } = useVegetationContext();
  const [state, setState] = useState<CalculationState>({
    isCalculating: false,
    jobId: null,
    error: null,
    success: false,
  });

  const calculateIndex = useCallback(
    async (options?: Partial<CalculationOptions>) => {
      const calculationOptions: CalculationOptions = {
        sceneId: options?.sceneId || selectedSceneId || '',
        indexType: options?.indexType || 'NDVI',
        entityId: options?.entityId || selectedEntityId || undefined,
        formula: options?.formula,
      };

      // Validate required fields
      if (!calculationOptions.sceneId) {
        setState({
          isCalculating: false,
          jobId: null,
          error: 'No scene selected. Please select a scene from the timeline.',
          success: false,
        });
        return null;
      }

      setState({
        isCalculating: true,
        jobId: null,
        error: null,
        success: false,
      });

      try {
        const result = await api.calculateIndex({
          scene_id: calculationOptions.sceneId,
          index_type: calculationOptions.indexType,
          entity_id: calculationOptions.entityId,
          formula: calculationOptions.formula,
        });

        setState({
          isCalculating: false,
          jobId: result.job_id,
          error: null,
          success: true,
        });

        return result.job_id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate index';
        setState({
          isCalculating: false,
          jobId: null,
          error: errorMessage,
          success: false,
        });
        return null;
      }
    },
    [api, selectedSceneId, selectedEntityId]
  );

  const resetState = useCallback(() => {
    setState({
      isCalculating: false,
      jobId: null,
      error: null,
      success: false,
    });
  }, []);

  return {
    calculateIndex,
    resetState,
    ...state,
  };
}


