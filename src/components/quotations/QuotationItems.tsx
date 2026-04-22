import { Trash2 } from 'lucide-react';
import { useQuotationStore } from '../../store/quotations.store';
import { Card } from '../ui/Card';

export const QuotationItems: React.FC = () => {
  const { items, removeItem, updateItemQuantity, recalculate } = useQuotationStore();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateItemQuantity(itemId, newQuantity);
      recalculate();
    }
  };

  const handleRemove = (itemId: string) => {
    removeItem(itemId);
    recalculate();
  };

  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-3">📦</div>
        <p className="text-gray-500">No hay productos agregados</p>
        <p className="text-gray-400 text-sm mt-1">Agrega productos usando el buscador de arriba</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Productos ({items.length})</h3>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Cant.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">P. Unit.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.productCode}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, Math.max(1, Number(e.target.value)))
                      }
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ${item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>
    </Card>
  );
};
