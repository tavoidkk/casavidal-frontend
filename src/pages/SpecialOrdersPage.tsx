import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight, Loader2, Download } from 'lucide-react';
import { specialOrdersApi } from '../api/specialOrders.api';
import { clientsApi } from '../api/Clients.api';
import { productsApi } from '../api/products.api';
import { suppliersApi } from '../api/suppliers.api';
import { activitiesApi } from '../api/activities.api';
import { calendarEventsApi } from '../api/calendarEvents.api';
import { purchaseOrdersApi } from '../api/purchaseOrders.api';
import { salesApi } from '../api/sales.api';
import type { SpecialOrder, OrderStatus, Product, Client, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../store/auth.store';
import { staggerContainer, staggerItem } from '../utils/motion';
import { generateInvoicePDF } from '../utils/generateInvoice';
import { generatePurchaseOrderPDF } from '../utils/generatePurchaseOrderPDF';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  ORDEN_GENERADA: { label: 'OC Generada', color: 'info' },
  EN_TRANSITO: { label: 'En Tránsito', color: 'info' },
  RECIBIDO: { label: 'Recibido', color: 'success' },
  LISTO_CLIENTE: { label: 'Listo p/ Cliente', color: 'success' },
  ENTREGADO: { label: 'Entregado', color: 'default' },
  CANCELADO: { label: 'Cancelado', color: 'danger' },
};

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'PUNTO_VENTA', label: 'Punto de venta' },
  { value: 'PAGO_MOVIL', label: 'Pago móvil' },
  { value: 'ZELLE', label: 'Zelle' },
];

const formatPaymentMethodLabel = (method?: PaymentMethod) =>
  method
    ? method
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
    : '—';

const STATUS_FLOW: OrderStatus[] = [
  'PENDIENTE',
  'ORDEN_GENERADA',
  'EN_TRANSITO',
  'RECIBIDO',
  'LISTO_CLIENTE',
  'ENTREGADO',
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDIENTE: 'ORDEN_GENERADA',
  ORDEN_GENERADA: 'EN_TRANSITO',
  EN_TRANSITO: 'RECIBIDO',
  RECIBIDO: 'LISTO_CLIENTE',
  LISTO_CLIENTE: 'ENTREGADO',
};

const ALL_STATUSES = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

export default function SpecialOrdersPage() {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';

  const [orders, setOrders] = useState<SpecialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<SpecialOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    clientId: '',
    supplierId: '',
    productId: '',
    quantity: 1,
    purchasePrice: 0,
    salePrice: 0,
    shippingCost: 0,
    paymentMethod: 'TRANSFERENCIA' as PaymentMethod,
    supplierPaymentMethod: '',
    estimatedDate: '',
    notes: '',
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await specialOrdersApi.getAll({
        status: statusFilter || undefined,
        page: currentPage,
        limit: 15,
      });
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const fetchPickers = async () => {
      try {
        const [clientRes, supplierRes, productRes] = await Promise.all([
          clientsApi.getAll({ page: 1, limit: 200 }),
          suppliersApi.getAll({ page: 1, limit: 200 }),
          productsApi.getAll({ page: 1, limit: 200, isActive: true }),
        ]);
        setClients(clientRes.data);
        setSuppliers(supplierRes.data.map((s) => ({ id: s.id, name: s.name })));
        setProducts(productRes.data);
      } catch (error) {
        console.error('Error loading pickers:', error);
      }
    };
    fetchPickers();
  }, []);

  useEffect(() => {
    if (!isSchedulingOpen) return;
    setScheduleError(null);
    setScheduleForm((prev) => ({
      ...prev,
      clientId: prev.clientId || clients[0]?.id || '',
      supplierId: prev.supplierId || suppliers[0]?.id || '',
      productId: prev.productId || products[0]?.id || '',
    }));
  }, [isSchedulingOpen, clients, suppliers, products]);

  useEffect(() => {
    const selectedProduct = products.find((p) => p.id === scheduleForm.productId);
    if (!selectedProduct) return;
    setScheduleForm((prev) => ({
      ...prev,
      purchasePrice: prev.purchasePrice || selectedProduct.costPrice,
      salePrice: prev.salePrice || selectedProduct.salePrice,
    }));
  }, [scheduleForm.productId, products]);

  const getClientName = (order: SpecialOrder) => {
    const c = order.client;
    if (c.clientType === 'JURIDICO') return c.companyName || 'Sin nombre';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Sin nombre';
  };

  const handleAdvanceStatus = async (order: SpecialOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setIsUpdating(true);
    try {
      await specialOrdersApi.updateStatus(order.id, next);
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        const updated = await specialOrdersApi.getById(order.id);
        setSelectedOrder(updated);
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (order: SpecialOrder) => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return;
    setIsUpdating(true);
    try {
      await specialOrdersApi.updateStatus(order.id, 'CANCELADO');
      await loadOrders();
      setIsDetailOpen(false);
    } catch {
      alert('Error al cancelar pedido');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPO = async (poId: string) => {
    try {
      const po = await purchaseOrdersApi.getById(poId);
      generatePurchaseOrderPDF(po);
    } catch {
      alert('Error al descargar la orden de compra');
    }
  };

  const handleDownloadInvoice = async (saleId: string) => {
    try {
      const sale = await salesApi.getById(saleId);
      generateInvoicePDF(sale);
    } catch {
      alert('Error al descargar la factura');
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      clientId: clients[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      productId: products[0]?.id || '',
      quantity: 1,
      purchasePrice: products[0]?.costPrice || 0,
      salePrice: products[0]?.salePrice || 0,
      shippingCost: 0,
      paymentMethod: 'TRANSFERENCIA',
      supplierPaymentMethod: '',
      estimatedDate: '',
      notes: '',
    });
  };

  const handleScheduleChange = (field: keyof typeof scheduleForm, value: string | number) => {
    setScheduleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateScheduledOrder = async () => {
    setScheduleError(null);
    const {
      clientId,
      productId,
      supplierId,
      quantity,
      purchasePrice,
      salePrice,
      shippingCost,
      paymentMethod,
      supplierPaymentMethod,
      estimatedDate,
      notes,
    } = scheduleForm;

    if (!clientId || !productId || !supplierId || !quantity) {
      setScheduleError('Selecciona cliente, producto, proveedor y cantidad válida.');
      return;
    }

    setIsScheduling(true);
    try {
      const supplier = suppliers.find((s) => s.id === supplierId);
      const product = products.find((p) => p.id === productId);
      const client = clients.find((c) => c.id === clientId);

      const estimatedDateTime = estimatedDate ? new Date(`${estimatedDate}T09:00:00`).toISOString() : undefined;

      const createdOrder = await specialOrdersApi.create({
        clientId,
        productId,
        supplierId,
        quantity,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        shippingCost: Number(shippingCost || 0),
        paymentMethod,
        supplierPaymentMethod: supplierPaymentMethod || undefined,
        estimatedDate: estimatedDateTime,
        notes,
      });

      const followUp = estimatedDate ? new Date(estimatedDate) : new Date();
      const beforeArrival = new Date(followUp);
      beforeArrival.setDate(beforeArrival.getDate() - 2);
      const clientLabel = client
        ? client.clientType === 'JURIDICO'
          ? client.companyName || 'Sin nombre'
          : `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre'
        : 'Cliente sin identificar';

      await activitiesApi.createActivity({
        clientId,
        type: 'SEGUIMIENTO',
        title: `Seguimiento pedido especial ${createdOrder.orderNumber}`,
        description: `Revisar llegada de ${product?.name || 'producto'} desde ${supplier?.name || 'proveedor'} y coordinar notificación a ${clientLabel}.`,
        scheduledFor: beforeArrival.toISOString(),
      });

      await activitiesApi.createActivity({
        clientId,
        type: 'TAREA',
        title: `Entregar pedido ${createdOrder.orderNumber}`,
        description: `Confirmar recepción y entrega de ${product?.name || 'producto'} a ${clientLabel}.`,
        scheduledFor: followUp.toISOString(),
      });

      await calendarEventsApi.create({
        title: `Entrega pedido ${createdOrder.orderNumber}`,
        category: 'TAREA',
        startDate: followUp.toISOString(),
        allDay: true,
        clientId,
      });

      await loadOrders();
      setIsSchedulingOpen(false);
      resetScheduleForm();
    } catch (error) {
      console.error('Error creando pedido especial programado:', error);
      const axiosError = error as { response?: { data?: { message?: string; errors?: { message?: string }[] }; status?: number } };
      let message = 'No se pudo crear el pedido especial, revisa los campos e intenta nuevamente.';
      if (axiosError.response?.data) {
        const validationErrors = axiosError.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          message = validationErrors.map((e) => e.message).filter(Boolean).join(' · ') || message;
        } else {
          message = axiosError.response.data.message || message;
        }
      }
      setScheduleError(message);
    } finally {
      setIsScheduling(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      getClientName(o).toLowerCase().includes(q) ||
      o.product.name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Pedidos Especiales</h1>
          <p className="text-gray-600 mt-1">
            {totalItems} pedido{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsSchedulingOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Programar pedido especial
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
              placeholder="Buscar por N° pedido, cliente o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
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
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron pedidos especiales</p>
            <p className="text-sm text-gray-500 mt-1">
              Registra un pedido especial para iniciar la gestión con el proveedor
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">N° Pedido</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Cant.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">OC</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                  {filteredOrders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status];
                    const next = NEXT_STATUS[order.status];
                    return (
                      <motion.tr key={order.id} variants={staggerItem} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-semibold text-primary-600">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">{getClientName(order)}</p>
                            <p className="text-xs text-gray-500">{order.client.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">{order.product.name}</p>
                            <p className="text-xs text-gray-400">SKU: {order.product.sku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-semibold">
                          {order.quantity} {order.product.unit}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={cfg.color}>{cfg.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('es-VE')}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {order.purchaseOrder ? (
                            <span className="font-mono">{order.purchaseOrder.orderNumber}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!px-3 !py-1.5 !text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                              onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                            >
                              Ver detalle
                            </Button>
                            {canEdit && next && order.status !== 'CANCELADO' && (
                              <Button
                                size="sm"
                                className="!px-3 !py-1.5 !text-xs bg-primary-500 hover:bg-primary-600 text-white"
                                onClick={() => handleAdvanceStatus(order)}
                                disabled={isUpdating}
                              >
                                <ChevronRight className="w-3 h-3" />
                                {STATUS_CONFIG[next].label}
                              </Button>
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

      <Modal
        isOpen={isSchedulingOpen}
        onClose={() => setIsSchedulingOpen(false)}
        title="Programar pedido especial"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Cliente"
              value={scheduleForm.clientId}
              onChange={(e) => handleScheduleChange('clientId', e.target.value)}
              options={[{ value: '', label: 'Selecciona un cliente' }, ...clients.map((c) => ({
                value: c.id,
                label: c.clientType === 'JURIDICO'
                  ? c.companyName || 'Sin nombre'
                  : `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Sin nombre',
              }))]}
            />
            <Select
              label="Proveedor"
              value={scheduleForm.supplierId}
              onChange={(e) => handleScheduleChange('supplierId', e.target.value)}
              options={[{ value: '', label: 'Selecciona proveedor' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Producto"
              value={scheduleForm.productId}
              onChange={(e) => handleScheduleChange('productId', e.target.value)}
              options={[{ value: '', label: 'Selecciona producto' }, ...products.map((p) => ({ value: p.id, label: `${p.name} · SKU: ${p.sku}` }))]}
            />
            <Input
              label="Cantidad"
              type="number"
              min={1}
              value={scheduleForm.quantity}
              onChange={(e) => handleScheduleChange('quantity', Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input
              label="Precio compra"
              type="number"
              min={0}
              step={0.01}
              value={scheduleForm.purchasePrice}
              onChange={(e) => handleScheduleChange('purchasePrice', Number(e.target.value))}
            />
            <Input
              label="Precio venta"
              type="number"
              min={0}
              step={0.01}
              value={scheduleForm.salePrice}
              onChange={(e) => handleScheduleChange('salePrice', Number(e.target.value))}
            />
            <Input
              label="Costo envío"
              type="number"
              min={0}
              step={0.01}
              value={scheduleForm.shippingCost}
              onChange={(e) => handleScheduleChange('shippingCost', Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Método de pago del cliente"
              value={scheduleForm.paymentMethod}
              onChange={(e) => handleScheduleChange('paymentMethod', e.target.value as PaymentMethod)}
              options={PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <Input
              label="Condiciones de pago al proveedor"
              value={scheduleForm.supplierPaymentMethod}
              onChange={(e) => handleScheduleChange('supplierPaymentMethod', e.target.value)}
              placeholder="Ej: 50% adelantado, 50% contra entrega"
            />
          </div>
          <Input
            label="Fecha estimada de llegada"
            type="date"
            value={scheduleForm.estimatedDate}
            onChange={(e) => handleScheduleChange('estimatedDate', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={scheduleForm.notes}
              onChange={(e) => handleScheduleChange('notes', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              rows={3}
            />
          </div>
          {scheduleError && <p className="text-sm text-red-600">{scheduleError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSchedulingOpen(false)}>
              Cancelar
            </Button>
            <Button isLoading={isScheduling} onClick={handleCreateScheduledOrder}>
              {isScheduling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </span>
              ) : (
                'Programar pedido'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalle */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }}
        title={`Pedido ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Timeline de estados */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Estado del pedido</p>
              <div className="flex items-center gap-1 overflow-x-auto">
                {STATUS_FLOW.map((s, idx) => {
                  const cfg = STATUS_CONFIG[s];
                  const isCurrent = selectedOrder.status === s;
                  const statusIdx = STATUS_FLOW.indexOf(selectedOrder.status);
                  const isPast = idx < statusIdx;
                  return (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isCurrent
                            ? 'bg-primary-600 text-white'
                            : isPast
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {cfg.label}
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <ChevronRight className={`w-3 h-3 ${isPast ? 'text-green-400' : 'text-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedOrder.status === 'CANCELADO' && (
                <div className="mt-2">
                  <Badge variant="danger">CANCELADO</Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold">{getClientName(selectedOrder)}</p>
                <p className="text-gray-400">{selectedOrder.client.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Producto</p>
                <p className="font-semibold">{selectedOrder.product.name}</p>
                <p className="text-gray-400">
                  {selectedOrder.quantity} {selectedOrder.product.unit} · SKU: {selectedOrder.product.sku}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Proveedor</p>
                <p className="font-semibold">{selectedOrder.supplier?.name ?? '—'}</p>
                {selectedOrder.supplier?.phone && (
                  <p className="text-gray-400">{selectedOrder.supplier.phone}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Importes</p>
                <p className="font-semibold">
                  Compra: ${selectedOrder.purchasePrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">
                  Venta: ${selectedOrder.salePrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </p>
                {selectedOrder.shippingCost > 0 && (
                  <p className="text-xs text-gray-400">Envío: ${selectedOrder.shippingCost.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                )}
              </div>
              {selectedOrder.estimatedDate && (
                <div>
                  <p className="text-gray-500">Fecha estimada</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.estimatedDate).toLocaleDateString('es-VE')}
                  </p>
                </div>
              )}
              {selectedOrder.purchaseOrder && (
                <div className="col-span-2">
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-amber-700">Orden de Compra</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!px-2 !py-1 !text-xs"
                        onClick={() => handleDownloadPO(selectedOrder.purchaseOrder!.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar OC
                      </Button>
                    </div>
                    <p className="font-mono font-semibold text-sm">{selectedOrder.purchaseOrder.orderNumber}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>Estado: {selectedOrder.purchaseOrder.status}</span>
                      <span>Total: ${selectedOrder.purchaseOrder.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
              {selectedOrder.notifiedAt && (
                <div>
                  <p className="text-gray-500">Cliente notificado</p>
                  <p className="font-semibold text-green-600">
                    {new Date(selectedOrder.notifiedAt).toLocaleDateString('es-VE')}
                  </p>
                </div>
              )}
              {selectedOrder.paymentMethod && (
                <div>
                  <p className="text-gray-500">Método de pago cliente</p>
                  <p className="font-semibold">{formatPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                  {selectedOrder.supplierPaymentMethod && (
                    <p className="text-xs text-gray-400">Proveedor: {selectedOrder.supplierPaymentMethod}</p>
                  )}
                </div>
              )}
              {selectedOrder.sale && (
                <div className="col-span-2 bg-primary-50/60 border border-primary-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-primary-700">Factura generada</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!px-2 !py-1 !text-xs"
                      onClick={() => handleDownloadInvoice(selectedOrder.sale!.id)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar Factura
                    </Button>
                  </div>
                  <p className="text-xs text-primary-700/80">
                    {selectedOrder.sale.saleNumber} · ${selectedOrder.sale.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-primary-600/80">
                    Registrada el {new Date(selectedOrder.sale.createdAt).toLocaleDateString('es-VE')} ·{' '}
                    {formatPaymentMethodLabel(selectedOrder.sale.paymentMethod)}
                  </p>
                </div>
              )}
            </div>

            {selectedOrder.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                <span className="font-medium">Notas:</span> {selectedOrder.notes}
              </p>
            )}

            {canEdit && selectedOrder.status !== 'ENTREGADO' && selectedOrder.status !== 'CANCELADO' && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <Button
                  variant="secondary"
                  onClick={() => handleCancel(selectedOrder)}
                  isLoading={isUpdating}
                >
                  Cancelar Pedido
                </Button>
                {NEXT_STATUS[selectedOrder.status] && (
                  <Button
                    onClick={() => handleAdvanceStatus(selectedOrder)}
                    isLoading={isUpdating}
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Avanzar a: {STATUS_CONFIG[NEXT_STATUS[selectedOrder.status]!].label}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
