import { Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import type { SaleItem } from '../../store/sales.store';

interface SaleItemsTableProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function SaleItemsTable({ items, onUpdateQuantity, onRemoveItem }: SaleItemsTableProps) {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No hay productos agregados</p>
      </Card>
    );
  }

  return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Cantidad</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">P. Unit.</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-lg">{item.category}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  ${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  ${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
