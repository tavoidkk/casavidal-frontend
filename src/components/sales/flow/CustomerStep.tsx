import { useSalesStore } from '../../../store/sales.store';
import { SaleCustomerSelector } from '../SaleCustomerSelector';

export function CustomerStep() {
  const { currentSale, setSaleCustomer } = useSalesStore();

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Cliente</h2>
      <div className="mt-3">
        <SaleCustomerSelector
          selectedCustomer={currentSale.customer}
          onSelectCustomer={setSaleCustomer}
        />
      </div>
    </div>
  );
}
