/**
 * Hook for managing vegetation index calculations.
 * Shared between Quick Mode (Viewer) and Advanced Mode (Analytics).
 */

import { useState, useCallback } from 'react';
import { useVegetationApi } from '../services/api';
import { useVegetationContext } from '../services/vegetationContext';
import type { VegetationIndexType } from '../types';

interface CalculationOptions {
  sceneId?: string;
  indexType: VegetationIndexType;
  entityId?: string;
  formula?: string;
  startDate?: string;
  endDate?: string;
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
        sceneId: options?.sceneId || selectedSceneId || undefined,
        indexType: options?.indexType || 'NDVI',
        entityId: options?.entityId || selectedEntityId || undefined,
        formula: options?.formula,
        startDate: options?.startDate,
        endDate: options?.endDate,
      };

      // Validate required fields: must have either sceneId OR (startDate AND endDate)
      if (!calculationOptions.sceneId && (!calculationOptions.startDate || !calculationOptions.endDate)) {
        setState({
          isCalculating: false,
          jobId: null,
          error: 'Please select a scene OR provide a date range for composite calculation.',
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
          start_date: calculationOptions.startDate,
          end_date: calculationOptions.endDate,
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


