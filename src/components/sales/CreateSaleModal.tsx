import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Minus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { clientsApi } from '../../api/Clients.api';
import { productsApi } from '../../api/products.api';
import type { Client, Product } from '../../types';
import type { CreateSaleInput } from '../../api/sales.api';

interface SaleLineItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSaleInput) => Promise<void>;
  isLoading?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: '💵 Efectivo' },
  { value: 'TRANSFERENCIA', label: '🏦 Transferencia' },
  { value: 'PUNTO_VENTA', label: '💳 Punto de Venta' },
  { value: 'PAGO_MOVIL', label: '📱 Pago Móvil' },
  { value: 'ZELLE', label: '💸 Zelle' },
];

export const CreateSaleModal: React.FC<CreateSaleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [items, setItems] = useState<SaleLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<CreateSaleInput['paymentMethod']>('EFECTIVO');
  const [notes, setNotes] = useState('');

  const clientRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  // Buscar clientes
  useEffect(() => {
    if (!clientSearch.trim() || clientSearch.length < 2) {
      setClientResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await clientsApi.getAll({ search: clientSearch, limit: 5 });
        setClientResults(res.data);
      } catch {
        setClientResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Buscar productos
  useEffect(() => {
    if (!productSearch.trim() || productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await productsApi.getAll({ search: productSearch, limit: 8 });
        setProductResults(res.data.filter((p) => p.currentStock > 0));
      } catch {
        setProductResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReset = () => {
    setSelectedClient(null);
    setClientSearch('');
    setItems([]);
    setDiscount(0);
    setPaymentMethod('EFECTIVO');
    setNotes('');
    setProductSearch('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(getClientName(client));
    setShowClientDropdown(false);
    setClientResults([]);
  };

  const addProduct = (product: Product) => {
    setProductSearch('');
    setShowProductDropdown(false);
    setProductResults([]);

    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
      return;
    }

    const unitPrice = Number(product.salePrice);
    setItems((prev) => [
      ...prev,
      { product, quantity: 1, unitPrice, subtotal: unitPrice },
    ]);
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const maxQty = item.product.currentStock;
        const qty = Math.min(newQty, maxQty);
        return { ...item, quantity: qty, subtotal: item.unitPrice * qty };
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = async () => {
    if (!selectedClient) {
      alert('Selecciona un cliente');
      return;
    }
    if (items.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    await onSubmit({
      clientId: selectedClient.id,
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      discount: discount || undefined,
      paymentMethod,
      notes: notes || undefined,
    });

    handleReset();
  };

  const getClientName = (client: Client) => {
    if (client.clientType === 'JURIDICO') return client.companyName || 'Sin nombre';
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Venta" size="xl">
      <div className="space-y-4">
        {/* Buscar cliente */}
        <div ref={clientRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setShowClientDropdown(true);
                if (!e.target.value) setSelectedClient(null);
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Buscar cliente por nombre, teléfono..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {showClientDropdown && clientResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {clientResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                >
                  <span className="font-medium text-sm">{getClientName(c)}</span>
                  <span className="text-xs text-gray-500 ml-2">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
          {selectedClient && (
            <div className="mt-1 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
              <span>✅ {getClientName(selectedClient)} — {selectedClient.category}</span>
              {(selectedClient.category === 'VIP' || selectedClient.category === 'MAYORISTA') && (
                <span className="ml-auto text-amber-600 font-semibold">Precio especial activo</span>
              )}
            </div>
          )}
        </div>

        {/* Buscar producto */}
        <div ref={productRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agregar Producto
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {showProductDropdown && productResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">SKU: {p.sku} · Stock: {p.currentStock} {p.unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-700">${Number(p.salePrice).toLocaleString()}</p>
                    {p.wholesalePrice && (
                      <p className="text-xs text-amber-600">Mayor: ${Number(p.wholesalePrice).toLocaleString()}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items de la venta */}
        {items.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">Cant.</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-600">P. Unit</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-600">Subtotal</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product.id} className="border-t border-gray-100">
                    <td className="py-2 px-3">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-400">Stock: {item.product.currentStock} {item.product.unit}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.currentStock}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">${item.unitPrice.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-semibold">${item.subtotal.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales y pago */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Método de Pago *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as CreateSaleInput['paymentMethod'])}
              options={PAYMENT_METHODS}
            />
          </div>
          <div>
            <Input
              label="Descuento ($)"
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Resumen de totales */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-${discount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-gray-900">
            <span>TOTAL</span>
            <span>${total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selectedClient || items.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Procesar Venta (${total.toLocaleString()})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
