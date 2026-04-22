import { Card } from '../ui/Card';
import type { DraftSale } from '../../store/sales.store';

interface SaleSummaryProps {
  sale: DraftSale;
  onFreightChange: (value: number) => void;
  onDiscountChange: (value: number, type: 'PERCENTAGE' | 'FIXED') => void;
  onPaymentMethodChange: (method: string) => void;
  onNotesChange: (notes: string) => void;
}

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: '💵 Efectivo' },
  { value: 'TRANSFERENCIA', label: '🏦 Transferencia' },
  { value: 'PUNTO_VENTA', label: '💳 P.V.' },
  { value: 'PAGO_MOVIL', label: '📱 P. Móvil' },
  { value: 'ZELLE', label: '💸 Zelle' },
];

export function SaleSummary({
  sale,
  onFreightChange,
  onDiscountChange,
  onPaymentMethodChange,
  onNotesChange,
}: SaleSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Método de pago */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
        <select
          value={sale.paymentMethod}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Card>

      {/* Flete */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Flete (Envío)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={sale.freight}
          onChange={(e) => onFreightChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </Card>

      {/* Descuento */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Descuento</label>
        <div className="flex gap-2 mb-2">
          {(['PERCENTAGE', 'FIXED'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onDiscountChange(sale.discount, type)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sale.discountType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'PERCENTAGE' ? '%' : '$'}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={sale.discount}
          onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0), sale.discountType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </Card>

      {/* Notas */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
        <textarea
          value={sale.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={3}
          placeholder="Observaciones o notas adicionales..."
        />
      </Card>

      {/* Resumen de totales */}
      <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal (Productos)</span>
            <span>${Number(sale.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>

          {sale.freight > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Flete</span>
              <span>+${Number(sale.freight).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {sale.discount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Descuento ({sale.discountType === 'PERCENTAGE' ? `${sale.discount}%` : '$'})</span>
              <span>-${Number(Math.abs(
                sale.discountType === 'PERCENTAGE'
                  ? ((sale.subtotal + sale.freight) * sale.discount) / 100
                  : sale.discount
              )).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="border-t border-gray-300 pt-2 flex justify-between text-gray-700">
            <span>Subtotal (después descuento)</span>
            <span>
              ${Number(
                sale.subtotal + sale.freight - (
                  sale.discountType === 'PERCENTAGE'
                    ? ((sale.subtotal + sale.freight) * sale.discount) / 100
                    : sale.discount
                )
              ).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>IVA (16%)</span>
            <span>+${Number(sale.taxAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-base text-gray-900">
            <span>TOTAL</span>
            <span>${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
