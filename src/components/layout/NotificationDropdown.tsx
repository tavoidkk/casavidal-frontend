import { useNavigate } from 'react-router-dom';
import { X, Check, CheckCheck, Trash2, ShoppingCart, Package, AlertCircle, Bell } from 'lucide-react';
import type { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAllRead: () => void;
}

export function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAllRead,
}: NotificationDropdownProps) {
  const navigate = useNavigate();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'VENTA':
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case 'PEDIDO':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'INVENTARIO':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'SISTEMA':
        return <Bell className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          <p className="text-xs text-gray-500">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1 text-primary-600 hover:bg-primary-50 rounded"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              onClick={onDeleteAllRead}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              title="Eliminar leídas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                !notification.isRead ? 'bg-primary-50/30' : ''
              } ${notification.link ? 'cursor-pointer' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Badge de no leída */}
              {!notification.isRead && (
                <div className="absolute top-4 left-2 w-2 h-2 bg-primary-500 rounded-full" />
              )}

              <div className="flex items-start gap-3 ml-2">
                {/* Icono */}
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer (opcional) */}
      {notifications.length > 0 && (
        <div className="p-2 text-center border-t border-gray-200">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}
