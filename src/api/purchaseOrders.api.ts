import { api } from '../lib/axios';
import type { PurchaseOrder, ApiResponse, PaginatedResponse } from '../types';

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PurchaseOrderFilters {
  status?: string;
  supplierId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const purchaseOrdersApi = {
  getAll: async (filters?: PurchaseOrderFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<PaginatedResponse<PurchaseOrder>>(`/purchase-orders?${params}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return data.data;
  },

  create: async (input: CreatePurchaseOrderInput) => {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreatePurchaseOrderInput>) => {
    const { data } = await api.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, input);
    return data.data;
  },

  updateStatus: async (id: string, status: string) => {
    const { data } = await api.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status });
    return data.data;
  },

  receiveItems: async (id: string, items: Array<{ itemId: string; quantityReceived: number }>) => {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, { items });
    return data.data;
  },
};
