import { api } from '../lib/axios';

export const reportsApi = {
  getReport: async (type: string, params?: Record<string, string>) => {
    const { data } = await api.get(`/reports/${type}`, { params });
    return data;
  },
};
