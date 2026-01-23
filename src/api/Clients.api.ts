import { api } from '../lib/axios';
import type { Client, ApiResponse, PaginatedResponse } from '../types';

interface ClientFilters {
  search?: string;
  category?: string;
  clientType?: string;
  page?: number;
  limit?: number;
}

interface CreateClientData {
  clientType: 'NATURAL' | 'JURIDICO';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  rif?: string;
  email?: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  category?: string;
  notes?: string;
}

export const clientsApi = {
  // Listar clientes
  getAll: async (filters?: ClientFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.clientType) params.append('clientType', filters.clientType);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    params.append('isActive', 'true');

    const { data } = await api.get<PaginatedResponse<Client>>(`/clients?${params}`);
    
    //console.log("DEBUGGING -----------------------");
    //console.log('API Response:', data);

    return data;
  },

  // Obtener uno por ID
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return data.data;
  },

  // Crear cliente
  create: async (clientData: CreateClientData) => {
    const { data } = await api.post<ApiResponse<Client>>('/clients', clientData);
    return data.data;
  },

  // Actualizar cliente
  update: async (id: string, clientData: Partial<CreateClientData>) => {
    const { data } = await api.put<ApiResponse<Client>>(`/clients/${id}`, clientData);
    return data.data;
  },

  // Eliminar cliente
  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/clients/${id}`);
    return data.data;
  },

  // Estadísticas
  getStats: async () => {
    const { data } = await api.get<ApiResponse<any>>('/clients/stats');
    return data.data;
  },

  // Clientes VIP
  getVIP: async () => {
    const { data } = await api.get<ApiResponse<Client[]>>('/clients/vip');
    return data.data;
  },
};