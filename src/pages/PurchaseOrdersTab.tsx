import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Send, CheckCircle, Package, XCircle, ChevronRight } from 'lucide-react';
import { purchaseOrdersApi, type CreatePurchaseOrderInput } from '../api/purchaseOrders.api';
import { suppliersApi } from '../api/suppliers.api';
import { productsApi } from '../api/products.api';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, Product } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth.store';
import { staggerContainer, staggerItem } from '../utils/motion';

type TabType = 'pedidos' | 'compras';

const PO_STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'primary' }> = {
  BORRADOR: { label: 'Borrador', color: 'default' },
  ENVIADA: { label: 'Enviada', color: 'info' },
  CONFIRMADA: { label: 'Confirmada', color: 'warning' },
  RECIBIDA_PARCIAL: { label: 'Recibida Parcial', color: 'warning' },
  RECIBIDA_COMPLETA: { label: 'Recibida Completa', color: 'success' },
  CANCELADA: { label: 'Cancelada', color: 'danger' },
};

const PO_STATUS_FLOW: PurchaseOrderStatus[] = [
  'BORRADOR',
  'ENVIADA',
  'CONFIRMADA',
  'RECIBIDA_PARCIAL',
  'RECIBIDA_COMPLETA',
];

const PO_NEXT_STATUS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
  BORRADOR: 'ENVIADA',
  ENVIADA: 'CONFIRMADA',
  CONFIRMADA: 'RECIBIDA_PARCIAL',
  RECIBIDA_PARCIAL: 'RECIBIDA_COMPLETA',
};

const ALL_PO_STATUSES = Object.entries(PO_STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

interface POFormItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

type PurchaseOrdersTabProps = {
  refreshKey?: number;
};

export default function PurchaseOrdersTab({ refreshKey = 0 }: PurchaseOrdersTabProps) {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create form state
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [formSupplier, setFormSupplier] = useState('');
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<POFormItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receive items state
  const [receiveItems, setReceiveItems] = useState<Record<string, number>>({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await purchaseOrdersApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: 15,
      });
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (refreshKey > 0) {
      loadOrders();
    }
  }, [refreshKey, loadOrders]);

  // Load suppliers for create form
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await suppliersApi.getAll({ limit: 200 });
      setSuppliers(res.data.map((s) => ({ id: s.id, name: s.name })));
    } catch {
      // ignore
    }
  }, []);

  const openCreate = () => {
    loadSuppliers();
    setFormSupplier('');
    setFormExpectedDate('');
    setFormNotes('');
    setFormItems([]);
    setIsCreateOpen(true);
  };

  const addFormItem = () => {
    setFormItems([...formItems, { productId: '', productName: '', productSku: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeFormItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const updateFormItem = (idx: number, field: keyof POFormItem, value: any) => {
    const updated = [...formItems];
    (updated[idx] as any)[field] = value;
    setFormItems(updated);
  };

  const handleProductSearch = async (idx: number, query: string) => {
    if (query.length < 2) return;
    try {
      const res = await productsApi.getAll({ search: query, limit: 10 });
      const product = res.data[0];
      if (product) {
        updateFormItem(idx, 'productId', product.id);
        updateFormItem(idx, 'productName', product.name);
        updateFormItem(idx, 'productSku', product.sku);
      }
    } catch {
      // ignore
    }
  };

  const formTotal = formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCreate = async () => {
    if (!formSupplier) return;
    if (formItems.length === 0 || formItems.some((i) => !i.productId || !i.unitPrice)) return;
    setIsSubmitting(true);
    try {
      const input: CreatePurchaseOrderInput = {
        supplierId: formSupplier,
        expectedDate: formExpectedDate || undefined,
        notes: formNotes || undefined,
        items: formItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };
      await purchaseOrdersApi.create(input);
      setIsCreateOpen(false);
      loadOrders();
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Error al crear orden de compra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (order: PurchaseOrder) => {
    const next = PO_NEXT_STATUS[order.status];
    if (!next) return;
    setIsUpdating(true);
    try {
      if (next === 'RECIBIDA_PARCIAL' || next === 'RECIBIDA_COMPLETA') {
        setSelectedOrder(order);
        const detail = await purchaseOrdersApi.getById(order.id);
        setSelectedOrder(detail);
        const initial: Record<string, number> = {};
        detail.items.forEach((item) => {
          initial[item.id] = 0;
        });
        setReceiveItems(initial);
        setIsReceiveOpen(true);
        setIsUpdating(false);
        return;
      }
      await purchaseOrdersApi.updateStatus(order.id, next);
      loadOrders();
      if (selectedOrder?.id === order.id) {
        const updated = await purchaseOrdersApi.getById(order.id);
        setSelectedOrder(updated);
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (order: PurchaseOrder) => {
    if (!confirm('¿Estás seguro de cancelar esta orden de compra?')) return;
    setIsUpdating(true);
    try {
      await purchaseOrdersApi.updateStatus(order.id, 'CANCELADA');
      loadOrders();
      setIsDetailOpen(false);
    } catch {
      alert('Error al cancelar orden');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitReceive = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const items = Object.entries(receiveItems)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, quantityReceived]) => ({ itemId, quantityReceived }));
      if (items.length === 0) return;
      await purchaseOrdersApi.receiveItems(selectedOrder.id, items);
      setIsReceiveOpen(false);
      setIsDetailOpen(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Error al recibir items');
    } finally {
      setIsUpdating(false);
    }
  };

  const openDetail = async (order: PurchaseOrder) => {
    try {
      const detail = await purchaseOrdersApi.getById(order.id);
      setSelectedOrder(detail);
      setIsDetailOpen(true);
    } catch {
      alert('Error al cargar detalle');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.supplier.name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600 mt-1">
            {totalItems} orden{totalItems !== 1 ? 'es' : ''} de compra registrada{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva OC
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por N° OC o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Todos los estados</option>
              {ALL_PO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            <p className="mt-4 text-gray-600">Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron órdenes de compra</p>
            {canEdit && (
              <Button variant="secondary" className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />
                Crear primera OC
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">N° OC</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Proveedor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                  {filteredOrders.map((order) => {
                    const cfg = PO_STATUS_CONFIG[order.status];
                    return (
                      <motion.tr key={order.id} variants={staggerItem} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-semibold text-primary-600">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-sm">{order.supplier.name}</p>
                          {order.supplier.rif && (
                            <p className="text-xs text-gray-400">{order.supplier.rif}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={cfg.color}>{cfg.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold">
                          ${Number(order.total).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('es-VE')}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-500">
                          {order._count?.items || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => openDetail(order)}
                              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                              Ver
                            </button>
                            {canEdit && order.status !== 'CANCELADA' && order.status !== 'RECIBIDA_COMPLETA' && PO_NEXT_STATUS[order.status] && (
                              <button
                                onClick={() => handleAdvanceStatus(order)}
                                disabled={isUpdating}
                                className="text-xs px-2 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl flex items-center gap-1"
                              >
                                <ChevronRight className="w-3 h-3" />
                                {PO_STATUS_CONFIG[PO_NEXT_STATUS[order.status]!].label}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Nueva OC */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Orden de Compra"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select
              value={formSupplier}
              onChange={(e) => setFormSupplier(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Seleccionar proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha estimada"
              type="date"
              value={formExpectedDate}
              onChange={(e) => setFormExpectedDate(e.target.value)}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Productos</label>
              <button
                onClick={addFormItem}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                + Agregar producto
              </button>
            </div>
            {formItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-xl">
                Agrega al menos un producto
              </p>
            ) : (
              <div className="space-y-2">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar producto (SKU o nombre)"
                        value={item.productName || item.productSku}
                        onChange={(e) => {
                          updateFormItem(idx, 'productName', e.target.value);
                          updateFormItem(idx, 'productId', '');
                          updateFormItem(idx, 'productSku', '');
                          handleProductSearch(idx, e.target.value);
                        }}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity || ''}
                        onChange={(e) => updateFormItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateFormItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      onClick={() => removeFormItem(idx)}
                      className="mt-2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formItems.length > 0 && (
            <div className="text-right text-sm font-semibold text-gray-700">
              Total estimado: ${formTotal.toLocaleString()}
            </div>
          )}

          <Input
            label="Notas"
            placeholder="Notas opcionales..."
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={isSubmitting}
              disabled={!formSupplier || formItems.length === 0 || formItems.some((i) => !i.productId || !i.unitPrice)}
            >
              Crear OC
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalle */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }}
        title={`OC ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Timeline */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Estado</p>
              <div className="flex items-center gap-1 overflow-x-auto">
                {PO_STATUS_FLOW.map((s, idx) => {
                  const cfg = PO_STATUS_CONFIG[s];
                  const isCurrent = selectedOrder.status === s;
                  const statusIdx = PO_STATUS_FLOW.indexOf(selectedOrder.status);
                  const isPast = idx < statusIdx;
                  return (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          isCurrent
                            ? 'bg-primary-600 text-white'
                            : isPast
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {cfg.label}
                      </div>
                      {idx < PO_STATUS_FLOW.length - 1 && (
                        <ChevronRight className={`w-3 h-3 ${isPast ? 'text-green-400' : 'text-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedOrder.status === 'CANCELADA' && (
                <div className="mt-2">
                  <Badge variant="danger">CANCELADA</Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Proveedor</p>
                <p className="font-semibold">{selectedOrder.supplier.name}</p>
                {selectedOrder.supplier.phone && (
                  <p className="text-gray-400">{selectedOrder.supplier.phone}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-lg">${Number(selectedOrder.total).toLocaleString()}</p>
              </div>
              {selectedOrder.expectedDate && (
                <div>
                  <p className="text-gray-500">Fecha estimada</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.expectedDate).toLocaleDateString('es-VE')}
                  </p>
                </div>
              )}
              {selectedOrder.receivedDate && (
                <div>
                  <p className="text-gray-500">Fecha recibida</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.receivedDate).toLocaleDateString('es-VE')}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="text-left py-2 font-medium">Producto</th>
                      <th className="text-center py-2 font-medium">Cant.</th>
                      <th className="text-right py-2 font-medium">Precio</th>
                      <th className="text-right py-2 font-medium">Subtotal</th>
                      <th className="text-center py-2 font-medium">Recibido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-400">SKU: {item.productSku}</p>
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">${Number(item.unitPrice).toLocaleString()}</td>
                        <td className="py-2 text-right">${Number(item.subtotal).toLocaleString()}</td>
                        <td className="py-2 text-center">
                          {item.quantityReceived >= item.quantity ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : item.quantityReceived > 0 ? (
                            <span className="text-sm font-medium text-amber-600">{item.quantityReceived}/{item.quantity}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                <span className="font-medium">Notas:</span> {selectedOrder.notes}
              </p>
            )}

            {selectedOrder.specialOrders && selectedOrder.specialOrders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Pedidos especiales vinculados</p>
                <div className="space-y-1">
                  {selectedOrder.specialOrders.map((so) => (
                    <p key={so.id} className="text-sm text-primary-600 font-mono">{so.orderNumber}</p>
                  ))}
                </div>
              </div>
            )}

            {canEdit && selectedOrder.status !== 'CANCELADA' && selectedOrder.status !== 'RECIBIDA_COMPLETA' && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => handleCancel(selectedOrder)}
                  isLoading={isUpdating}
                >
                  Cancelar OC
                </Button>
                {PO_NEXT_STATUS[selectedOrder.status] && (
                  <Button
                    onClick={() => handleAdvanceStatus(selectedOrder)}
                    isLoading={isUpdating}
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {PO_STATUS_CONFIG[PO_NEXT_STATUS[selectedOrder.status]!].label}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Recibir Items */}
      <Modal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        title="Recibir Items"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Indica la cantidad recibida para cada item de la OC <strong>{selectedOrder.orderNumber}</strong>
            </p>
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    Ordenado: {item.quantity} | Recibido antes: {item.quantityReceived}
                  </p>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity - item.quantityReceived}
                    value={receiveItems[item.id] ?? 0}
                    onChange={(e) => {
                      const val = Math.min(
                        Math.max(0, parseInt(e.target.value) || 0),
                        item.quantity - item.quantityReceived
                      );
                      setReceiveItems((prev) => ({ ...prev, [item.id]: val }));
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsReceiveOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitReceive}
                isLoading={isUpdating}
                disabled={Object.values(receiveItems).every((q) => q === 0)}
              >
                Confirmar Recepción
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
