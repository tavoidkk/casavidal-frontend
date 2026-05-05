import { Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { SaleItem } from '../../store/sales.store';

interface SaleItemsTableProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function SaleItemsTable({ items, onUpdateQuantity, onRemoveItem }: SaleItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-500">No hay productos agregados</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
        <div className="col-span-5 py-2.5 px-3 font-semibold text-gray-700">Producto</div>
        <div className="col-span-3 py-2.5 px-3 font-semibold text-gray-700">Cantidad</div>
        <div className="col-span-2 py-2.5 px-3 font-semibold text-gray-700 text-right">P. Unit.</div>
        <div className="col-span-2 py-2.5 px-3 font-semibold text-gray-700 text-right">Subtotal</div>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.productId} className="grid grid-cols-12 items-center hover:bg-gray-50">
            <div className="col-span-5 py-3 px-3">
              <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
            <div className="col-span-3 py-3 px-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="col-span-2 py-3 px-3 text-right text-sm">
              ${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </div>
            <div className="col-span-2 py-3 px-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="font-semibold text-sm">
                  ${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
