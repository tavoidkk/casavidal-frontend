import { api } from '../lib/axios';
import type { ApiResponse, Notification, NotificationType } from '../types';

export interface NotificationFilters {
  page?: number;
  type?: NotificationType | '';
  isRead?: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export const notificationsApi = {
  getNotifications: async (filters: NotificationFilters | number = {}) => {
    if (typeof filters === 'number') {
      const { data } = await api.get<ApiResponse<Notification[]>>(`/notifications?limit=${filters}`);
      return data.data;
    }
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (filters.page) params.set('page', String(filters.page));
    if (filters.type) params.set('type', filters.type);
    if (filters.isRead !== undefined) params.set('isRead', String(filters.isRead));
    const { data } = await api.get<ApiResponse<PaginatedNotifications>>(`/notifications?${params}`);
    return data.data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.put<ApiResponse<{ message: string }>>(`/notifications/${id}/read`);
    return data.data;
  },

  markAllAsRead: async () => {
    const { data } = await api.put<ApiResponse<{ message: string }>>('/notifications/read-all');
    return data.data;
  },

  deleteNotification: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`);
    return data.data;
  },

  deleteAllRead: async () => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>('/notifications/read');
    return data.data;
  },
};
