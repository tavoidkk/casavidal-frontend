import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { specialOrdersApi } from '../api/specialOrders.api';
import { clientsApi } from '../api/Clients.api';
import { productsApi } from '../api/products.api';
import { suppliersApi } from '../api/suppliers.api';
import { purchaseOrdersApi } from '../api/purchaseOrders.api';
import { activitiesApi } from '../api/activities.api';
import { calendarEventsApi } from '../api/calendarEvents.api';
import type { SpecialOrder, OrderStatus, Product, Client } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../store/auth.store';
import { staggerContainer, staggerItem } from '../utils/motion';
import PurchaseOrdersTab from './PurchaseOrdersTab';

type TabType = 'pedidos' | 'compras';

const TABS: { key: TabType; label: string; icon: typeof ShoppingCart }[] = [
  { key: 'pedidos', label: 'Pedidos Especiales', icon: ShoppingCart },
  { key: 'compras', label: 'Órdenes de Compra', icon: Package },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  ORDEN_GENERADA: { label: 'OC Generada', color: 'info' },
  EN_TRANSITO: { label: 'En Tránsito', color: 'info' },
  RECIBIDO: { label: 'Recibido', color: 'success' },
  LISTO_CLIENTE: { label: 'Listo p/ Cliente', color: 'success' },
  ENTREGADO: { label: 'Entregado', color: 'default' },
  CANCELADO: { label: 'Cancelado', color: 'danger' },
};

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
  const [activeTab, setActiveTab] = useState<TabType>('pedidos');

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
      loadOrders();
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
      loadOrders();
      setIsDetailOpen(false);
    } catch {
      alert('Error al cancelar pedido');
    } finally {
      setIsUpdating(false);
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
      estimatedDate: '',
      notes: '',
    });
  };

  const handleScheduleChange = (field: keyof typeof scheduleForm, value: string | number) => {
    setScheduleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateScheduledOrder = async () => {
    setScheduleError(null);
    const { clientId, productId, supplierId, quantity, purchasePrice, salePrice, shippingCost, estimatedDate, notes } = scheduleForm;
    if (!clientId || !productId || !supplierId || !quantity) {
      setScheduleError('Selecciona cliente, producto, proveedor y cantidad válida.');
      return;
    }
    setIsScheduling(true);
    try {
      const supplier = suppliers.find((s) => s.id === supplierId);
      const product = products.find((p) => p.id === productId);
      const client = clients.find((c) => c.id === clientId);
      const extraNotes = [
        `Venta prevista: $${salePrice}`,
        shippingCost ? `Costo de envío: $${shippingCost}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      const specialOrder = await specialOrdersApi.create({
        clientId,
        productId,
        quantity,
        estimatedDate: estimatedDate || undefined,
        notes: [
          notes,
          `Compra planificada con ${supplier?.name || 'proveedor'}`,
          extraNotes,
        ]
          .filter(Boolean)
          .join(' · '),
      });
      await purchaseOrdersApi.create({
        supplierId,
        expectedDate: estimatedDate || undefined,
        notes: `Pedido especial ${specialOrder.orderNumber} · Producto: ${product?.name || '—'} · Cliente: ${client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.companyName || 'Sin nombre' : 'Sin cliente'}`,
        items: [
          {
            productId,
            quantity,
            unitPrice: purchasePrice || product?.costPrice || 0,
          },
        ],
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
        title: `Seguimiento pedido especial ${specialOrder.orderNumber}`,
        description: `Revisar llegada de ${product?.name || 'producto'} desde ${supplier?.name || 'proveedor'} y coordinar notificación a ${clientLabel}.`,
        scheduledFor: beforeArrival.toISOString(),
      });
      await activitiesApi.createActivity({
        clientId,
        type: 'TAREA',
        title: `Entregar pedido ${specialOrder.orderNumber}`,
        description: `Confirmar recepción y entrega de ${product?.name || 'producto'} a ${clientLabel}.`,
        scheduledFor: followUp.toISOString(),
      });
      await calendarEventsApi.create({
        title: `Entrega pedido ${specialOrder.orderNumber}`,
        category: 'TAREA',
        startDate: followUp.toISOString(),
        allDay: true,
        clientId,
      });
      loadOrders();
      setIsSchedulingOpen(false);
      resetScheduleForm();
    } catch (error) {
      console.error('Error creando pedido especial programado:', error);
      const axiosError = error as { response?: { data?: { message?: string; errors?: { message?: string }[] }; status?: number } };
      let message = 'No se pudo programar el pedido especial, revisa los campos e intenta de nuevo.';
      if (axiosError.response?.data) {
        console.error('Detalle del error:', axiosError.response.data);
        message = axiosError.response.data.errors?.[0]?.message || axiosError.response.data.message || message;
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
          <h1 className="text-3xl font-semibold text-gray-900 font-display">
            {activeTab === 'pedidos' ? 'Pedidos Especiales' : 'Órdenes de Compra'}
          </h1>
          {activeTab === 'pedidos' && (
            <p className="text-gray-600 mt-1">
              {totalItems} pedido{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {activeTab === 'pedidos' && canEdit && (
          <Button onClick={() => setIsSchedulingOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Programar pedido especial
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'compras' ? (
        <PurchaseOrdersTab />
      ) : (
        <>
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
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
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
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron pedidos especiales</p>
            <p className="text-sm text-gray-500 mt-1">
              Los pedidos especiales se crean desde la página de Productos cuando el stock es 0
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
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                              Ver
                            </button>
                            {canEdit && next && order.status !== 'CANCELADO' && (
                              <button
                                onClick={() => handleAdvanceStatus(order)}
                                disabled={isUpdating}
                                className="text-xs px-2 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl flex items-center gap-1"
                              >
                                <ChevronRight className="w-3 h-3" />
                                {STATUS_CONFIG[next].label}
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
              {selectedOrder.estimatedDate && (
                <div>
                  <p className="text-gray-500">Fecha estimada</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.estimatedDate).toLocaleDateString('es-VE')}
                  </p>
                </div>
              )}
              {selectedOrder.purchaseOrder && (
                <div>
                  <p className="text-gray-500">Orden de Compra</p>
                  <p className="font-mono font-semibold">{selectedOrder.purchaseOrder.orderNumber}</p>
                  <p className="text-gray-400 text-xs">{selectedOrder.purchaseOrder.status}</p>
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
        </>
      )}
    </div>
  );
}
