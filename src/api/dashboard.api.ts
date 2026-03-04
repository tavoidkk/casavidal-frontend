import { api } from '../lib/axios';
import type { ApiResponse, DashboardStats, SalesTrendItem, TopProduct, TopClient } from '../types';

export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return data.data;
  },

  getSalesTrend: async (days = 30) => {
    const { data } = await api.get<ApiResponse<SalesTrendItem[]>>(`/dashboard/sales-trend?days=${days}`);
    return data.data;
  },

  getTopProducts: async (limit = 5) => {
    const { data } = await api.get<ApiResponse<TopProduct[]>>(`/dashboard/top-products?limit=${limit}`);
    return data.data;
  },

  getTopClients: async (limit = 5) => {
    const { data } = await api.get<ApiResponse<TopClient[]>>(`/dashboard/top-clients?limit=${limit}`);
    return data.data;
  },
};
