import { useCallback, useMemo } from 'react';
import { useSalesStore, type SaleItem } from '../../store/sales.store';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleProductSearch } from './SaleProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SaleSummary } from './SaleSummary';
import { Button } from '../ui/Button';
import { Pause, SaveIcon } from 'lucide-react';

interface SaleFormProps {
  onSaveComplete?: () => void;
  onHold?: () => void;
}

export function SaleForm({ onSaveComplete, onHold }: SaleFormProps) {
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

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  const handleAddProduct = useCallback(
    (product: any, quantity: number) => {
      const item: SaleItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity,
        unitPrice: Number(product.unitPrice || 0),
        subtotal: quantity * Number(product.unitPrice || 0),
      };
      addSaleItem(item);
    },
    [addSaleItem]
  );

  const canSave = useMemo(() => {
    return currentSale.items.length > 0 && currentSale.customer !== null;
  }, [currentSale.items.length, currentSale.customer]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva Venta</h2>
          <p className="text-sm text-gray-600 mt-1">Completa los datos para registrar una venta</p>
        </div>
        <div className="flex gap-2">
          {onHold && (
            <Button
              variant="secondary"
              onClick={onHold}
              disabled={!canSave}
            >
              <Pause className="w-4 h-4 mr-2" />
              Dejar en Espera
            </Button>
          )}
          <Button
            onClick={onSaveComplete}
            disabled={!canSave}
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            Guardar Venta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Cliente y Productos */}
        <div className="lg:col-span-2 space-y-6">
          <SaleCustomerSelector
            selectedCustomer={currentSale.customer}
            onSelectCustomer={setSaleCustomer}
          />

          <SaleProductSearch onSelectProduct={handleAddProduct} />

          <SaleItemsTable
            items={currentSale.items}
            onUpdateQuantity={updateSaleItemQuantity}
            onRemoveItem={removeSaleItem}
          />
        </div>

        {/* Columna derecha: Resumen */}
        <div>
          <SaleSummary
            sale={currentSale}
            onFreightChange={setSaleFreight}
            onDiscountChange={setSaleDiscount}
            onPaymentMethodChange={setSalePaymentMethod}
            onNotesChange={setSaleNotes}
          />
        </div>
      </div>
    </div>
  );
}
