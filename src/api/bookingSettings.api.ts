import { api } from '../lib/axios';
import type { ApiResponse, BookingSettings } from '../types';

export const bookingSettingsApi = {
  get: async () => {
    const { data } = await api.get<ApiResponse<BookingSettings>>('/booking-settings');
    return data.data;
  },

  update: async (payload: Partial<BookingSettings>) => {
    const { data } = await api.put<ApiResponse<BookingSettings>>('/booking-settings', payload);
    return data.data;
  },
};
