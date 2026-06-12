import { api } from '../lib/axios';
import type { ApiResponse, DashboardStats, SalesTrendItem, TopProduct, TopClient, ActivityType } from '../types';

export interface PendingActivity {
  id: string;
  subject: string;
  type: ActivityType;
  dueDate?: string;
  status: string;
  client?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    clientType: 'NATURAL' | 'JURIDICO';
  } | null;
}

export interface PendingActivities {
  pendingTasks: number;
  todayAppointments: PendingActivity[];
  allAppointments: PendingActivity[];
}

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

  getPendingActivities: async () => {
    const { data } = await api.get<ApiResponse<PendingActivities>>('/dashboard/pending-activities');
    return data.data;
  },
};
