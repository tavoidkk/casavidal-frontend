import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useCurrencyStore } from '../../store/currency.store';
import { formatBs } from '../../utils/currency';
import type { DraftSale } from '../../store/sales.store';

interface SaleSummaryProps {
  sale: DraftSale;
  onFreightChange: (value: number) => void;
  onDiscountChange: (value: number, type: 'PERCENTAGE' | 'FIXED') => void;
  onPaymentMethodChange: (method: string) => void;
  onNotesChange: (notes: string) => void;
  onPointsRedeemedChange?: (points: number) => void;
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
  onPointsRedeemedChange,
}: SaleSummaryProps) {
  const usdToBsRate = useCurrencyStore((s) => s.usdToBsRate);
  const isBs = sale.currency === 'BS';
  const availablePoints = sale.customer?.loyaltyPoints || 0;
  const maxPointsForSale = Math.floor((sale.subtotal + sale.freight) * 0.15 / 0.10);
  const maxRedeemable = Math.min(availablePoints, maxPointsForSale);

  const formatTotal = (amount: number) =>
    amount.toLocaleString('es-VE', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {/* Método de pago */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
        <select
          value={sale.paymentMethod}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
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
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
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
                  ? 'bg-secondary-600 text-white'
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
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          placeholder="0.00"
        />
      </Card>

      {/* Puntos de Lealtad */}
      {sale.customer && availablePoints > 0 && (
        <Card className="p-4 border-amber-200">
          <label className="block text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <span>🎖️</span> Puntos de Lealtad
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Disponibles: <strong>{availablePoints} pts</strong> (máx. {maxRedeemable} pts = ${formatTotal(maxRedeemable * 0.10)})
          </p>
          {maxRedeemable > 0 ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={maxRedeemable}
                step="1"
                value={sale.pointsRedeemed}
                onChange={(e) => {
                  const p = Math.min(maxRedeemable, Math.max(0, parseInt(e.target.value) || 0));
                  onPointsRedeemedChange?.(p);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 text-sm"
                placeholder="0 pts"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPointsRedeemedChange?.(0)}
                disabled={sale.pointsRedeemed === 0}
              >
                ✕
              </Button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">El subtotal debe ser mayor para canjear puntos (mín. 15% del subtotal como descuento)</p>
          )}
          {sale.pointsRedeemed > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Descuento por puntos: -${formatTotal(sale.pointsDiscount)}
            </p>
          )}
        </Card>
      )}

      {/* Notas */}
      <Card className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
        <textarea
          value={sale.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
          rows={3}
          placeholder="Observaciones o notas adicionales..."
        />
      </Card>

      {/* Resumen de totales */}
      <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal (Productos)</span>
            <span>${formatTotal(sale.subtotal)}</span>
          </div>

          {sale.freight > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Flete</span>
              <span>+${formatTotal(sale.freight)}</span>
            </div>
          )}

          {sale.discount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Descuento ({sale.discountType === 'PERCENTAGE' ? `${sale.discount}%` : '$'})</span>
              <span>-${formatTotal(Math.abs(
                sale.discountType === 'PERCENTAGE'
                  ? ((sale.subtotal + sale.freight) * sale.discount) / 100
                  : sale.discount
              ))}</span>
            </div>
          )}

          {sale.pointsRedeemed > 0 && (
            <div className="flex justify-between text-amber-700 font-medium">
              <span>🎖️ Descuento puntos ({sale.pointsRedeemed} pts)</span>
              <span>-${formatTotal(sale.pointsDiscount)}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 flex justify-between text-gray-700">
            <span>Subtotal (después descuento)</span>
            <span>
              ${formatTotal(
                sale.subtotal + sale.freight - (
                  sale.discountType === 'PERCENTAGE'
                    ? ((sale.subtotal + sale.freight) * sale.discount) / 100
                    : sale.discount
                ) - sale.pointsDiscount
              )}
            </span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>IVA (16%)</span>
            <span>+${formatTotal(sale.taxAmount)}</span>
          </div>

          {/* Total PRINCIPAL según moneda */}
          {isBs && usdToBsRate ? (
            <>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-primary-700">
                <span>TOTAL Bs.</span>
                <span>{formatBs(sale.total * usdToBsRate)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 border-t border-dashed border-gray-300 pt-1">
                <span>Total USD (referencia)</span>
                <span>${formatTotal(sale.total)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
                <span>TOTAL</span>
                <span>${formatTotal(sale.total)}</span>
              </div>
              {usdToBsRate && (
                <div className="flex justify-between font-semibold text-sm text-primary-700 border-t border-dashed border-gray-300 pt-2">
                  <span>TOTAL Bs.</span>
                  <span>{formatBs(sale.total * usdToBsRate)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
