import { useMemo } from 'react';
import { useSalesStore } from '../../../store/sales.store';
import { Button } from '../../ui/Button';
import { Stepper } from './Stepper';
import { CustomerStep } from './CustomerStep';
import { ProductStep } from './ProductStep';
import { PaymentStep } from './PaymentStep';

const STEPS = [
  { id: 'customer', name: 'Cliente' },
  { id: 'products', name: 'Productos' },
  { id: 'payment', name: 'Pago' },
];

interface SaleFlowProps {
  onSaveComplete?: () => void;
  onHold?: () => void;
}

export function SaleFlow({ onSaveComplete, onHold }: SaleFlowProps) {
  const {
    currentSale,
    currentStep,
    nextStep,
    prevStep,
  } = useSalesStore();

  const canHoldOrSave = useMemo(() => {
    if (!currentSale) return false;
    return currentSale.customer !== null && currentSale.items.length > 0;
  }, [currentSale]);

  const canContinue = useMemo(() => {
    if (!currentSale) return false;
    if (currentStep === 0) return currentSale.customer !== null;
    if (currentStep === 1) return currentSale.items.length > 0;
    return true;
  }, [currentSale, currentStep]);

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 font-display">Nueva Venta</h2>
          <p className="text-sm text-gray-500 mt-1">Completa los datos para registrar una venta</p>
        </div>
        <div className="flex gap-2">
          {onHold && (
            <Button variant="secondary" onClick={onHold} disabled={!canHoldOrSave}>
              Dejar en Espera
            </Button>
          )}
          {currentStep === STEPS.length - 1 && (
            <Button onClick={onSaveComplete} disabled={!canHoldOrSave}>
              Guardar Venta
            </Button>
          )}
        </div>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <div className="mt-6">
        {currentStep === 0 && <CustomerStep />}
        {currentStep === 1 && <ProductStep />}
        {currentStep === 2 && <PaymentStep />}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canContinue || currentStep === STEPS.length - 1}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
