import { useMemo, useCallback, useState } from 'react';
import { useSalesStore } from '../../store/sales.store';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleProductSearch } from './SaleProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SaleSummary } from './SaleSummary';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import SalesSuggestions from './SalesSuggestions';

interface POSPanelProps {
  customerInputRef: React.RefObject<HTMLInputElement | null>;
  productInputRef: React.RefObject<HTMLInputElement | null>;
  onSaveComplete?: () => void;
  onHold?: () => void;
}

const BS_PAYMENT_METHODS = ['PAGO_MOVIL', 'TRANSFERENCIA', 'ZELLE'];

export function POSPanel({
  customerInputRef,
  productInputRef,
  onSaveComplete,
  onHold,
}: POSPanelProps) {
  const [showPaymentRef, setShowPaymentRef] = useState(false);

  const {
    currentSale,
    setSaleCustomer,
    addSaleItem,
    removeSaleItem,
    updateSaleItemQuantity,
    setSaleFreight,
    setSaleDiscount,
    setSalePaymentMethod,
    setSaleCurrency,
    setPaymentReference,
    setSaleNotes,
  } = useSalesStore();

  const canHoldOrSave = useMemo(() => {
    if (!currentSale) return false;
    return currentSale.customer !== null && currentSale.items.length > 0;
  }, [currentSale]);

  const paymentMethod = currentSale?.paymentMethod;

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

  const handleAddSuggestion = useCallback((productId: string, productName: string, unitPrice: number) => {
    addSaleItem({
      productId,
      productName,
      category: '',
      quantity: 1,
      unitPrice,
      subtotal: unitPrice,
    });
  }, [addSaleItem]);

  const handleCobrarClick = () => {
    if (!currentSale) return;
    if (BS_PAYMENT_METHODS.includes(currentSale.paymentMethod)) {
      setSaleCurrency('BS');
      setShowPaymentRef(true);
    } else if (currentSale.paymentMethod === 'PUNTO_VENTA') {
      setSaleCurrency('BS');
      onSaveComplete?.();
    } else {
      setSaleCurrency('USD');
      onSaveComplete?.();
    }
  };

  const handleConfirmPayment = () => {
    setShowPaymentRef(false);
    onSaveComplete?.();
  };

  const handlePaymentRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentReference(e.target.value);
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
            onPaymentMethodChange={(method) => {
              setSalePaymentMethod(method);
              if (!BS_PAYMENT_METHODS.includes(method) && method !== 'PUNTO_VENTA') {
                setSaleCurrency('USD');
              }
            }}
            onNotesChange={setSaleNotes}
          />
        </div>

        <SalesSuggestions
          cartItems={currentSale.items}
          clientId={currentSale.customer?.id}
          onAddToCart={handleAddSuggestion}
        />

        <div className="flex flex-col gap-2">
          {onHold && (
            <Button variant="secondary" onClick={onHold} disabled={!canHoldOrSave}>
              Dejar en Espera
            </Button>
          )}
          <Button onClick={handleCobrarClick} disabled={!canHoldOrSave}>
            Cobrar
          </Button>
        </div>

        {/* Moneda actual */}
        <div className="text-center text-sm text-gray-500">
          {currentSale.currency === 'BS' ? (
            <span className="text-primary-700 font-medium">Venta en Bolívares</span>
          ) : (
            <span>Venta en USD</span>
          )}
        </div>
      </div>

      {/* Modal de Referencia de Pago */}
      <Modal
        isOpen={showPaymentRef}
        onClose={() => setShowPaymentRef(false)}
        title="Referencia del Pago"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ingresa el número de referencia o comprobante del pago por{' '}
            <span className="font-semibold">
              {paymentMethod === 'PAGO_MOVIL' && 'Pago Móvil'}
              {paymentMethod === 'TRANSFERENCIA' && 'Transferencia'}
              {paymentMethod === 'ZELLE' && 'Zelle'}
            </span>
            .
          </p>
          <input
            type="text"
            value={currentSale.paymentReference}
            onChange={handlePaymentRefChange}
            placeholder="N° de referencia"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            autoFocus
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPaymentRef(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="flex-1">
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
