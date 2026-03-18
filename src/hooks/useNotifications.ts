import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications.api';
import type { Notification } from '../types';

export function useNotifications(pollingInterval = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationsApi.getNotifications(20),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar solo el contador (para polling ligero)
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  // Marcar como leída
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Recargar contador por si acaso
      await loadUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [loadUnreadCount]);

  // Eliminar todas las leídas
  const deleteAllRead = useCallback(async () => {
    try {
      await notificationsApi.deleteAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error('Error deleting read notifications:', err);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Polling para actualizar contador
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  };
}
