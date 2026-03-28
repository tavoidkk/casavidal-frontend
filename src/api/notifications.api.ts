import { api } from '../lib/axios';
import type { ApiResponse, Notification } from '../types';

export const notificationsApi = {
  // Obtener todas las notificaciones del usuario
  getNotifications: async (limit = 20) => {
    const { data } = await api.get<ApiResponse<Notification[]>>(`/notifications?limit=${limit}`);
    return data.data;
  },

  // Obtener contador de no leídas
  getUnreadCount: async () => {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },

  // Marcar una como leída
  markAsRead: async (id: string) => {
    const { data } = await api.put<ApiResponse<{ message: string }>>(`/notifications/${id}/read`);
    return data.data;
  },

  // Marcar todas como leídas
  markAllAsRead: async () => {
    const { data} = await api.put<ApiResponse<{ message: string }>>('/notifications/read-all');
    return data.data;
  },

  // Eliminar una notificación
  deleteNotification: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`);
    return data.data;
  },

  // Eliminar todas las leídas
  deleteAllRead: async () => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>('/notifications/read');
    return data.data;
  },
};
