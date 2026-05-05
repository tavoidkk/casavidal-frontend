import { useMemo } from 'react';
import { useSalesStore } from '../../store/sales.store';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleProductSearch } from './SaleProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SaleSummary } from './SaleSummary';
import { Button } from '../ui/Button';

interface POSPanelProps {
  customerInputRef: React.RefObject<HTMLInputElement>;
  productInputRef: React.RefObject<HTMLInputElement>;
  onSaveComplete?: () => void;
  onHold?: () => void;
}

export function POSPanel({
  customerInputRef,
  productInputRef,
  onSaveComplete,
  onHold,
}: POSPanelProps) {
  const {
    currentSale,
    setSaleCustomer,
    addSaleItem,
    removeSaleItem,
    updateSaleItemQuantity,
    setSaleFreight,
    setSaleDiscount,
    setSalePaymentMethod,
    setSaleNotes,
  } = useSalesStore();

  const canHoldOrSave = useMemo(() => {
    if (!currentSale) return false;
    return currentSale.customer !== null && currentSale.items.length > 0;
  }, [currentSale]);

  const handleAddProduct = (product: any, quantity: number) => {
    const item = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity,
      unitPrice: Number(product.unitPrice || 0),
      subtotal: quantity * Number(product.unitPrice || 0),
    };
    addSaleItem(item);
  };

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-3 space-y-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cliente</h3>
          <SaleCustomerSelector
            selectedCustomer={currentSale.customer}
            onSelectCustomer={setSaleCustomer}
            searchInputRef={customerInputRef}
          />
        </div>
      </div>

      <div className="xl:col-span-6 space-y-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <SaleProductSearch onSelectProduct={handleAddProduct} searchInputRef={productInputRef} />
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Carrito</h3>
          <SaleItemsTable
            items={currentSale.items}
            onUpdateQuantity={updateSaleItemQuantity}
            onRemoveItem={removeSaleItem}
          />
        </div>
      </div>

      <div className="xl:col-span-3 space-y-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <SaleSummary
            sale={currentSale}
            onFreightChange={setSaleFreight}
            onDiscountChange={setSaleDiscount}
            onPaymentMethodChange={setSalePaymentMethod}
            onNotesChange={setSaleNotes}
          />
        </div>
        <div className="flex flex-col gap-2">
          {onHold && (
            <Button variant="secondary" onClick={onHold} disabled={!canHoldOrSave}>
              Dejar en Espera
            </Button>
          )}
          <Button onClick={onSaveComplete} disabled={!canHoldOrSave}>
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
}
