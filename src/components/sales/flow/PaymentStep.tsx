import { useSalesStore } from '../../../store/sales.store';
import { SaleSummary } from '../SaleSummary';

export function PaymentStep() {
  const {
    currentSale,
    setSaleFreight,
    setSaleDiscount,
    setSalePaymentMethod,
    setSaleNotes,
  } = useSalesStore();

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Pago</h2>
      <div className="mt-4">
        <SaleSummary
          sale={currentSale}
          onFreightChange={setSaleFreight}
          onDiscountChange={setSaleDiscount}
          onPaymentMethodChange={setSalePaymentMethod}
          onNotesChange={setSaleNotes}
        />
      </div>
    </div>
  );
}
