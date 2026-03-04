import { api } from '../lib/axios';
import type { SpecialOrder, ApiResponse, PaginatedResponse } from '../types';

export interface CreateSpecialOrderInput {
  clientId: string;
  productId: string;
  quantity: number;
  estimatedDate?: string;
  notes?: string;
}

export interface SpecialOrderFilters {
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export const specialOrdersApi = {
  getAll: async (filters?: SpecialOrderFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<PaginatedResponse<SpecialOrder>>(`/special-orders?${params}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<SpecialOrder>>(`/special-orders/${id}`);
    return data.data;
  },

  create: async (orderData: CreateSpecialOrderInput) => {
    const { data } = await api.post<ApiResponse<SpecialOrder>>('/special-orders', orderData);
    return data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string, estimatedDate?: string) => {
    const { data } = await api.put<ApiResponse<SpecialOrder>>(`/special-orders/${id}/status`, {
      status,
      notes,
      estimatedDate,
    });
    return data.data;
  },
};
