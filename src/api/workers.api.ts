import { api } from '../lib/axios';
import type { ApiResponse, Worker } from '../types';

export const workersApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Worker[]>>('/workers');
    return data.data;
  },

  create: async (payload: { email: string; password: string; firstName: string; lastName: string }) => {
    const { data } = await api.post<ApiResponse<Worker>>('/workers', payload);
    return data.data;
  },

  update: async (id: string, payload: { firstName?: string; lastName?: string; isActive?: boolean }) => {
    const { data } = await api.put<ApiResponse<Worker>>(`/workers/${id}`, payload);
    return data.data;
  },
};
