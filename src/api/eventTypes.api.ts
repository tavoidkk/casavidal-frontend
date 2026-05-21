import { api } from '../lib/axios';
import type { ApiResponse, EventType } from '../types';

export const eventTypesApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<EventType[]>>('/event-types');
    return data.data;
  },

  create: async (payload: { name: string; color?: string; defaultDurationMinutes?: number }) => {
    const { data } = await api.post<ApiResponse<EventType>>('/event-types', payload);
    return data.data;
  },

  update: async (id: string, payload: { name?: string; color?: string; defaultDurationMinutes?: number; isActive?: boolean }) => {
    const { data } = await api.put<ApiResponse<EventType>>(`/event-types/${id}`, payload);
    return data.data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/event-types/${id}`);
    return data.data;
  },
};
