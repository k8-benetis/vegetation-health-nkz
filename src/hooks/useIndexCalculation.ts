/**
 * Hook for managing vegetation index calculations with Polling.
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

      if (!calculationOptions.sceneId && (!calculationOptions.startDate || !calculationOptions.endDate)) {
        setState({
          isCalculating: false,
          jobId: null,
          error: 'Please select a scene OR provide a date range used.',
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

        // POLL FOR COMPLETION
        const jobId = result.job_id;
        let attempts = 0;
        const maxAttempts = 30; // 30s timeout

        while (attempts < maxAttempts) {
           await new Promise(r => setTimeout(r, 1000));
           try {
             const jobDetails = await api.getJobDetails(jobId);
             const status = jobDetails.job.status;
             
             if (status === 'completed') {
                 // Success!
                 break;
             } else if (status === 'failed') {
                 throw new Error(jobDetails.job.error_message || 'Job failed on backend');
             }
             // If pending/processing, continue
           } catch (pollError: any) {
             console.warn('Poll error:', pollError);
             // Verify if it's 404 (maybe job not ready yet) or real error
           }
           attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Calculation timed out (Backend slow)');
        }

        setState({
          isCalculating: false,
          jobId: jobId,
          error: null,
          success: true,
        });

        return jobId;
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
