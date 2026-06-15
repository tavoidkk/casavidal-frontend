import { useMemo, useCallback, useState } from 'react';
import { useCurrencyStore } from '../../store/currency.store';
import { useSalesStore } from '../../store/sales.store';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleProductSearch } from './SaleProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SaleSummary } from './SaleSummary';
import { PaymentSplitter } from './PaymentSplitter';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import SalesSuggestions from './SalesSuggestions';

interface POSPanelProps {
  customerInputRef: React.RefObject<HTMLInputElement | null>;
  productInputRef: React.RefObject<HTMLInputElement | null>;
  onSaveComplete?: () => void;
  onHold?: () => void;
}

export function POSPanel({
  customerInputRef,
  productInputRef,
  onSaveComplete,
  onHold,
}: POSPanelProps) {
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const usdToBsRate = useCurrencyStore((s) => s.usdToBsRate);

  const {
    currentSale,
    setSaleCustomer,
    addSaleItem,
    removeSaleItem,
    updateSaleItemQuantity,
    setSaleFreight,
    setSaleDiscount,
    setSalePayments,
    setPointsRedeemed,
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
    if (currentSale.payments.length === 0) {
      setSalePayments([{
        paymentMethod: currentSale.paymentMethod,
        currency: currentSale.currency,
        amount: currentSale.total,
        reference: currentSale.paymentReference,
      }]);
    }
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = () => {
    setShowPaymentConfirm(false);
    onSaveComplete?.();
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
            onPointsRedeemedChange={setPointsRedeemed}
          />
        </div>

        <SalesSuggestions
          cartItems={currentSale.items}
          clientId={currentSale.customer?.id}
          onAddToCart={handleAddSuggestion}
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
      </div>

      {/* Modal de Confirmación de Pago */}
      <Modal
        isOpen={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        title="Confirmar Venta"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se registrarán los siguientes pagos:
          </p>
          <div className="space-y-2">
            {currentSale.payments.map((p, i) => (
              <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                <span>{p.paymentMethod} ({p.currency})</span>
                <span className="font-medium">
                  {p.currency === 'USD' ? `$${p.amount.toFixed(2)}` : `Bs. ${p.amount.toFixed(2)}`}
                  {p.reference && <span className="text-xs text-gray-500 ml-1">- Ref: {p.reference}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPaymentConfirm(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="flex-1">
              Confirmar y Cobrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
