import { api } from '../lib/axios';
import type { Sale, ApiResponse, PaginatedResponse } from '../types';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  clientId: string;
  items: CreateSaleItemInput[];
  discount?: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'PUNTO_VENTA' | 'PAGO_MOVIL' | 'ZELLE';
  notes?: string;
}

export interface SaleFilters {
  search?: string;
  clientId?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const salesApi = {
  getAll: async (filters?: SaleFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<PaginatedResponse<Sale>>(`/sales?${params}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
    return data.data;
  },

  create: async (saleData: CreateSaleInput) => {
    const { data } = await api.post<ApiResponse<Sale>>('/sales', saleData);
    return data.data;
  },

  getStats: async () => {
    const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/sales/stats');
    return data.data;
  },
};
