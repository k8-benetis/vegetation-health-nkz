/**
 * Calculation Button - Quick action button for calculating vegetation indices.
 * Shows loading state and success/error feedback.
 */

import React from 'react';
import { Calculator, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useIndexCalculation } from '../../hooks/useIndexCalculation';
import { useUIKit } from '../../hooks/useUIKit';
import { useVegetationContext } from '../../services/vegetationContext';

interface CalculationButtonProps {
  sceneId?: string;
  entityId?: string;
  indexType?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CalculationButton: React.FC<CalculationButtonProps> = ({
  sceneId,
  entityId,
  indexType,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { Button } = useUIKit();
  const { selectedIndex, selectedSceneId, selectedEntityId } = useVegetationContext();
  const { calculateIndex, isCalculating, error, success, resetState } = useIndexCalculation();

  const effectiveSceneId = sceneId || selectedSceneId;
  const effectiveEntityId = entityId || selectedEntityId;
  const effectiveIndexType = (indexType || selectedIndex) as any;

  const handleClick = async () => {
    resetState();
    await calculateIndex({
      sceneId: effectiveSceneId || undefined,
      entityId: effectiveEntityId || undefined,
      indexType: effectiveIndexType,
    });
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  const isDisabled = !effectiveSceneId || isCalculating;

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          ${sizeClasses[size]} ${variantClasses[variant]}
          rounded-md font-medium transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2 justify-center
          ${className}
        `}
      >
        {isCalculating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculando...</span>
          </>
        ) : (
          <>
            <Calculator className="w-4 h-4" />
            <span>Calcular Índice</span>
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
          <CheckCircle className="w-4 h-4" />
          <span>Índice calculado correctamente</span>
        </div>
      )}
    </div>
  );
};

