import { api } from '../lib/axios';
import type { ApiResponse, CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../types';

export const calendarEventsApi = {
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    assignedToId?: string;
    clientId?: string;
    eventTypeId?: string;
  }) => {
    const { data } = await api.get<ApiResponse<CalendarEvent[]>>('/calendar-events', { params });
    return data.data;
  },

  create: async (payload: CalendarEventCreate) => {
    const { data } = await api.post<ApiResponse<CalendarEvent>>('/calendar-events', payload);
    return data.data;
  },

  update: async (id: string, payload: CalendarEventUpdate) => {
    const { data } = await api.put<ApiResponse<CalendarEvent>>(`/calendar-events/${id}`, payload);
    return data.data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/calendar-events/${id}`);
    return data.data;
  },
};
