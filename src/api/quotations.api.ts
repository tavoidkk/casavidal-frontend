import { api } from '../lib/axios';
import type { ApiResponse } from '../types';

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface QuotationData {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  items: QuotationItem[];
  subtotal: number;
  freight: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  total: number;
  notes: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  expiresAt: string;
  createdAt: string;
}

export interface CreateQuotationInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  items: QuotationItem[];
  freight: number;
  taxRate: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  notes: string;
  expiresAt: string;
}

export const quotationsApi = {
  getAll: async (filters?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<ApiResponse<any>>(`/quotations?${params}`);
    return data.data || [];
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<QuotationData>>(`/quotations/${id}`);
    return data.data;
  },

  create: async (quotationData: CreateQuotationInput) => {
    const { data } = await api.post<ApiResponse<QuotationData>>('/quotations', quotationData);
    return data.data;
  },

  update: async (id: string, quotationData: Partial<CreateQuotationInput>) => {
    const { data } = await api.put<ApiResponse<QuotationData>>(`/quotations/${id}`, quotationData);
    return data.data;
  },

  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch<ApiResponse<QuotationData>>(`/quotations/${id}/status`, {
      status,
    });
    return data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/quotations/${id}`);
  },
};
