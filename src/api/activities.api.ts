import { api } from '../lib/axios';
import type { ApiResponse, Activity, ActivityCreate, ActivityUpdate } from '../types';

type BackendActivity = {
  id: string;
  clientId: string;
  assignedToId: string;
  type: Activity['type'];
  subject: string;
  description?: string;
  dueDate?: string;
  status: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
  createdAt: string;
  assignedTo?: { firstName: string; lastName: string; role: string };
  client?: { firstName?: string; lastName?: string; companyName?: string; clientType: 'NATURAL' | 'JURIDICO' };
};

const mapActivity = (item: BackendActivity): Activity => ({
  id: item.id,
  clientId: item.clientId,
  userId: item.assignedToId,
  type: item.type,
  title: item.subject,
  description: item.description,
  scheduledFor: item.dueDate,
  status: item.status,
  createdAt: item.createdAt,
  user: item.assignedTo || { firstName: 'Sistema', lastName: '', role: 'SISTEMA' },
  client: item.client,
});

export const activitiesApi = {
  // Crear actividad
  createActivity: async (data: ActivityCreate) => {
    const payload = {
      clientId: data.clientId,
      type: data.type,
      subject: data.title,
      description: data.description,
      scheduledFor: data.scheduledFor || undefined,
    };
    const { data: response } = await api.post<ApiResponse<BackendActivity>>('/activities', payload);
    return mapActivity(response.data);
  },

  // Obtener actividades de un cliente (Timeline)
  getActivitiesByClient: async (clientId: string) => {
    const { data } = await api.get<ApiResponse<BackendActivity[]>>(`/activities/client/${clientId}`);
    return data.data.map(mapActivity);
  },

  // Obtener mis actividades
  getMyActivities: async (limit = 50) => {
    const { data } = await api.get<ApiResponse<BackendActivity[]>>(`/activities/user?limit=${limit}`);
    return data.data.map(mapActivity);
  },

  // Obtener todas las actividades con filtros
  getAllActivities: async (filters?: {
    type?: string;
    clientId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const { data } = await api.get<ApiResponse<BackendActivity[]>>(`/activities?${params.toString()}`);
    return data.data.map(mapActivity);
  },

  // Obtener una actividad por ID
  getActivityById: async (id: string) => {
    const { data } = await api.get<ApiResponse<BackendActivity>>(`/activities/${id}`);
    return mapActivity(data.data);
  },

  // Actualizar actividad
  updateActivity: async (id: string, data: ActivityUpdate) => {
    const payload = {
      type: data.type,
      subject: data.title,
      description: data.description,
      scheduledFor: data.scheduledFor || undefined,
      status: data.status,
    };
    const { data: response } = await api.put<ApiResponse<BackendActivity>>(`/activities/${id}`, payload);
    return mapActivity(response.data);
  },

  // Eliminar actividad
  deleteActivity: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/activities/${id}`);
    return data.data;
  },

  // Obtener estadísticas
  getStats: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : '';
    const { data } = await api.get<ApiResponse<{
      total: number;
      byType: { type: string; count: number }[];
    }>>(`/activities/stats${params}`);
    return data.data;
  },
};
