import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useCurrencyStore } from '../../store/currency.store';
import { formatBs } from '../../utils/currency';
import type { DraftPayment } from '../../store/sales.store';

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'PUNTO_VENTA', label: 'Punto de Venta' },
  { value: 'PAGO_MOVIL', label: 'Pago Móvil' },
  { value: 'ZELLE', label: 'Zelle' },
];

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transf.',
  PUNTO_VENTA: 'P.V.',
  PAGO_MOVIL: 'P.Móvil',
  ZELLE: 'Zelle',
};

const METHOD_COLORS: Record<string, string> = {
  EFECTIVO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRANSFERENCIA: 'bg-blue-100 text-blue-700 border-blue-200',
  PUNTO_VENTA: 'bg-purple-100 text-purple-700 border-purple-200',
  PAGO_MOVIL: 'bg-amber-100 text-amber-700 border-amber-200',
  ZELLE: 'bg-rose-100 text-rose-700 border-rose-200',
};

interface PaymentSplitterProps {
  total: number;
  currency: 'USD' | 'BS';
  payments: DraftPayment[];
  onChange: (payments: DraftPayment[]) => void;
  usdToBsRate?: number | null;
}

export function PaymentSplitter({ total, currency, payments, onChange, usdToBsRate }: PaymentSplitterProps) {
  const storeRate = useCurrencyStore((s) => s.usdToBsRate);
  const rate = usdToBsRate || storeRate || 0;

  const [showModal, setShowModal] = useState(false);
  const [newMethod, setNewMethod] = useState('EFECTIVO');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'BS'>('USD');
  const [newAmount, setNewAmount] = useState(0);
  const [newAmountText, setNewAmountText] = useState('');
  const [newReference, setNewReference] = useState('');

  const formatAmount = (n: number) => {
    const s = n.toFixed(2);
    const [intPart, decPart] = s.split('.');
    return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decPart}`;
  };

  const handleAmountInput = (raw: string) => {
    let cleaned = '';
    let commaSeen = false;
    for (const ch of raw) {
      if (ch === ',' && !commaSeen) {
        cleaned += ',';
        commaSeen = true;
      } else if (ch >= '0' && ch <= '9') {
        cleaned += ch;
      }
    }

    const parts = cleaned.split(',');
    const intRaw = parts[0];
    const decRaw = (parts[1] || '').slice(0, 2);

    const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let display = intFormatted;
    if (commaSeen) {
      display = decRaw ? `${intFormatted},${decRaw}` : `${intFormatted},`;
    }

    setNewAmountText(display);
    const numericValue = decRaw
      ? parseFloat(`${intRaw}.${decRaw}`)
      : parseInt(intRaw || '0', 10);
    setNewAmount(numericValue || 0);
  };

  const totalUsd = currency === 'USD' ? total : (rate > 0 ? total / rate : 0);
  const paidUsd = payments.reduce((sum, p) => {
    return sum + (p.currency === 'USD' ? p.amount : (rate > 0 ? p.amount / rate : 0));
  }, 0);
  const remainingUsd = Math.max(0, totalUsd - paidUsd);
  const remainingBs = remainingUsd * rate;
  const isComplete = remainingUsd < 0.01;

  const removePayment = (index: number) => {
    const updated = payments.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleOpenAdd = () => {
    setNewMethod('EFECTIVO');
    setNewCurrency('USD');
    setNewAmount(0);
    setNewAmountText('');
    setNewReference('');
    setShowModal(true);
  };

  const handleMethodChange = (method: string) => {
    setNewMethod(method);
    if (method === 'PAGO_MOVIL' || method === 'PUNTO_VENTA') {
      setNewCurrency('BS');
    } else if (method === 'ZELLE') {
      setNewCurrency('USD');
    } else {
      setNewCurrency('USD');
    }
  };

  const availableCurrencies = (): ('USD' | 'BS')[] => {
    if (newMethod === 'PAGO_MOVIL' || newMethod === 'PUNTO_VENTA') return ['BS'];
    if (newMethod === 'ZELLE') return ['USD'];
    return ['USD', 'BS'];
  };

  const handleAddPayment = () => {
    if (newAmount <= 0) return;
    const payment: DraftPayment = {
      paymentMethod: newMethod,
      currency: newCurrency,
      amount: newAmount,
      reference: ['TRANSFERENCIA', 'PAGO_MOVIL', 'ZELLE'].includes(newMethod) ? newReference : '',
    };
    onChange([...payments, payment]);
    setShowModal(false);
  };

  const remainingUsdAfter = remainingUsd - (newCurrency === 'USD' ? newAmount : (rate > 0 ? newAmount / rate : 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Pagos</span>
        {!isComplete && (
          <button
            onClick={handleOpenAdd}
            className="text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Agregar
          </button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-xs text-gray-400 mb-2">Sin pagos registrados</p>
          <Button size="sm" onClick={handleOpenAdd}>Agregar Pago</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {payments.map((p, i) => (
            <div
              key={i}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${METHOD_COLORS[p.paymentMethod] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              <span>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
              <span className="font-bold">
                {p.currency === 'USD' ? `$${p.amount.toFixed(2)}` : formatBs(p.amount)}
              </span>
              {p.reference && <span className="opacity-60">· {p.reference}</span>}
              <button
                onClick={() => removePayment(i)}
                className="ml-0.5 hover:text-red-500 transition-colors leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
        <div className="space-y-0.5">
          <div className="text-gray-500">
            Pagado:{' '}
            <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-gray-800'}`}>
              ${paidUsd.toFixed(2)}
            </span>
          </div>
          {rate > 0 && (
            <div className="text-gray-400">Bs. {formatBs(paidUsd * rate)}</div>
          )}
        </div>
        <div className="text-right space-y-0.5">
          {isComplete ? (
            <span className="text-green-600 font-semibold">Cancelado ✓</span>
          ) : (
            <>
              <div className="text-gray-500">
                Saldo:{' '}
                <span className="font-semibold text-red-500">${remainingUsd.toFixed(2)}</span>
              </div>
              {rate > 0 && (
                <div className="text-gray-400">Bs. {formatBs(remainingBs)}</div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Agregar Pago" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Método de Pago</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMethodChange(m.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    newMethod === m.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Moneda</label>
            <div className="flex gap-2">
              {availableCurrencies().map((cur) => (
                <button
                  key={cur}
                  onClick={() => setNewCurrency(cur)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    newCurrency === cur
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {cur === 'USD' ? 'USD $' : 'Bs.'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Monto {newCurrency === 'USD' ? '(USD)' : '(Bs.)'}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={newAmountText}
              onChange={(e) => handleAmountInput(e.target.value)}
              placeholder="0,00"
              className="text-lg font-semibold text-center"
              autoFocus
            />
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {[remainingUsd, remainingUsd / 2, remainingUsd / 4].map((v, idx) => {
                const val = newCurrency === 'USD' ? v : v * rate;
                if (val <= 0) return null;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const n = Math.round(val * 100) / 100;
                      setNewAmount(n);
                      setNewAmountText(formatAmount(n));
                    }}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    {newCurrency === 'USD' ? `$${v.toFixed(2)}` : formatBs(val)}
                  </button>
                );
              })}
            </div>
          </div>

          {['TRANSFERENCIA', 'PAGO_MOVIL', 'ZELLE'].includes(newMethod) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Referencia</label>
              <Input
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="N° de referencia"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Restante</span>
              <span className={remainingUsdAfter < 0.01 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                {remainingUsdAfter < 0.01
                  ? 'Cancelado ✓'
                  : `$${Math.max(0, remainingUsdAfter).toFixed(2)}`}
              </span>
            </div>
            {rate > 0 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span />
                <span>Bs. {formatBs(Math.max(0, remainingUsdAfter * rate))}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={newAmount <= 0} className="flex-1">
              Agregar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
