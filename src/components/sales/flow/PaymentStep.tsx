import { useCurrencyStore } from '../../../store/currency.store';
import { useSalesStore } from '../../../store/sales.store';
import { PaymentSplitter } from '../PaymentSplitter';
import { SaleSummary } from '../SaleSummary';

export function PaymentStep() {
  const {
    currentSale,
    setSaleFreight,
    setSaleDiscount,
    setSalePayments,
  } = useSalesStore();
  const usdToBsRate = useCurrencyStore((s) => s.usdToBsRate);

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Pago</h2>
      <div className="mt-4 space-y-4">
        <SaleSummary
          sale={currentSale}
          onFreightChange={setSaleFreight}
          onDiscountChange={setSaleDiscount}
        />
        <div className="rounded-xl border border-gray-200 p-4">
          <PaymentSplitter
            total={currentSale.total}
            currency={currentSale.currency}
            payments={currentSale.payments}
            onChange={setSalePayments}
            usdToBsRate={usdToBsRate}
          />
        </div>
      </div>
    </div>
  );
}
