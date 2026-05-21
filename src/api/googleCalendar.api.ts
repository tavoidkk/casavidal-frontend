import { api } from '../lib/axios';
import type { ApiResponse } from '../types';

export const googleCalendarApi = {
  status: async () => {
    const { data } = await api.get<ApiResponse<{ connected: boolean }>>('/google-calendar/status');
    return data.data;
  },

  connect: async () => {
    const { data } = await api.post<ApiResponse<{ url: string }>>('/google-calendar/connect');
    return data.data;
  },

  importEvents: async (params?: { calendarId?: string; timeMin?: string; timeMax?: string }) => {
    const { data } = await api.get<ApiResponse<{ imported: number }>>('/google-calendar/import', { params });
    return data.data;
  },

  disconnect: async () => {
    const { data } = await api.delete<ApiResponse<null>>('/google-calendar/disconnect');
    return data.data;
  },
};
