import { api } from '../lib/axios';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return data.data;
  },

  register: async (registerData: RegisterData) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', registerData);
    return data.data;
  },

  getProfile: async () => {
    const { data } = await api.get<ApiResponse<any>>('/auth/profile');
    return data.data;
  },
};