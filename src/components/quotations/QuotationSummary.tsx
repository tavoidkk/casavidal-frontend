import { useEffect } from 'react';
import { useQuotationStore } from '../../store/quotations.store';
import { Card } from '../ui/Card';

export const QuotationSummary: React.FC = () => {
  const {
    items,
    freight,
    setFreight,
    taxRate,
    setTaxRate,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    notes,
    setNotes,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    recalculate,
  } = useQuotationStore();

  useEffect(() => {
    recalculate();
  }, [freight, taxRate, discountValue, discountType, items, recalculate]);

  return (
    <Card className="sticky top-6 space-y-6">
      {/* Configuración */}
      <div className="space-y-4 pb-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>

        {/* Flete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flete</label>
          <div className="flex items-center">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={freight}
              onChange={(e) => setFreight(Math.max(0, Number(e.target.value)))}
              className="flex-1 ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* IVA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Descuento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descuento</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => setDiscountType('PERCENTAGE')}
              className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                discountType === 'PERCENTAGE'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              %
            </button>
            <button
              onClick={() => setDiscountType('FIXED')}
              className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                discountType === 'FIXED'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              $
            </button>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500">{discountType === 'PERCENTAGE' ? '%' : '$'}</span>
            <input
              type="number"
              min="0"
              step={discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
              className="flex-1 ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas o para el cliente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">
              ${subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {freight > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Flete</span>
              <span className="font-medium">
                ${freight.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-600">Subtotal + Flete</span>
            <span className="font-medium">
              ${(subtotal + freight).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA ({taxRate.toFixed(1)}%)</span>
              <span className="font-medium text-orange-600">
                +${taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Descuento {discountType === 'PERCENTAGE' ? `(${discountValue}%)` : ''}
              </span>
              <span className="font-medium text-green-600">
                -${discountAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold border-t pt-3 text-gray-900">
            <span>TOTAL</span>
            <span className="text-primary-600 text-lg">
              ${total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Info Items */}
      {items.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>Agrega productos para ver el cálculo</p>
        </div>
      )}
    </Card>
  );
};
