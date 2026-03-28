import { api } from '../lib/axios';
import type { ApiResponse, PaginatedResponse } from '../types';

export interface Supplier {
  id: string;
  name: string;
  rif?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  rif?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const suppliersApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const { data } = await api.get<PaginatedResponse<Supplier>>(`/suppliers?${query}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return data.data;
  },

  create: async (input: CreateSupplierInput) => {
    const { data } = await api.post<ApiResponse<Supplier>>('/suppliers', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateSupplierInput>) => {
    const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, input);
    return data.data;
  },

  remove: async (id: string) => {
    await api.delete(`/suppliers/${id}`);
  },
};
