import { useState, useEffect, useCallback } from 'react';
import { Bell, ShoppingCart, Package, AlertCircle, Users, Activity, Check, Trash2, CheckCheck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { notificationsApi } from '../api/notifications.api';
import type { Notification, NotificationType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const typeIcons: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  VENTA_COMPLETADA: { icon: ShoppingCart, color: 'text-primary-500' },
  PEDIDO_LISTO: { icon: Package, color: 'text-amber-500' },
  STOCK_BAJO: { icon: AlertCircle, color: 'text-red-500' },
  NUEVO_CLIENTE: { icon: Users, color: 'text-green-500' },
  NUEVA_ACTIVIDAD: { icon: Activity, color: 'text-purple-500' },
  SISTEMA: { icon: Bell, color: 'text-gray-500' },
};

const typeLabels: Record<string, string> = {
  '': 'Todos',
  VENTA_COMPLETADA: 'Ventas',
  PEDIDO_LISTO: 'Pedidos',
  STOCK_BAJO: 'Stock Bajo',
  NUEVO_CLIENTE: 'Nuevos Clientes',
  NUEVA_ACTIVIDAD: 'Nuevas Actividades',
  SISTEMA: 'Sistema',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsApi.getNotifications({
        page,
        type: filterType || undefined,
        isRead: filterRead === 'all' ? undefined : filterRead === 'unread' ? false : true,
      });
      setNotifications(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterRead]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationsApi.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setTotal(prev => prev - 1);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await notificationsApi.deleteNotification(id);
    }
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    setTotal(prev => prev - selectedIds.size);
    setSelectedIds(new Set());
  };

  const handleBulkMarkRead = async () => {
    for (const id of selectedIds) {
      await notificationsApi.markAsRead(id);
    }
    setNotifications(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, isRead: true } : n));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500 mt-1">{total} en total</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button onClick={handleBulkMarkRead} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Check className="w-4 h-4" /> Marcar leídas ({selectedIds.size})
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" /> Eliminar ({selectedIds.size})
              </button>
            </>
          )}
          <button onClick={handleMarkAllAsRead} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <CheckCheck className="w-4 h-4" /> Marcar todas leídas
          </button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as NotificationType | ''); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterRead}
            onChange={(e) => { setFilterRead(e.target.value as 'all' | 'unread' | 'read'); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="unread">No leídas</option>
            <option value="read">Leídas</option>
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay notificaciones</p>
            <p className="text-sm">Con los filtros seleccionados no se encontraron resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const typeInfo = typeIcons[notification.type] || typeIcons.SISTEMA;
              const Icon = typeInfo.icon;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${!notification.isRead ? 'bg-primary-50/30' : ''} hover:bg-gray-50`}
                >
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <button onClick={() => handleMarkAsRead(notification.id)} className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg" title="Marcar como leída">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(notification.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
