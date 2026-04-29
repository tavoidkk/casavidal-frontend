import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { specialOrdersApi } from '../api/specialOrders.api';
import type { SpecialOrder, OrderStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/auth.store';
import { staggerContainer, staggerItem } from '../utils/motion';

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
    </div>
  );
}
