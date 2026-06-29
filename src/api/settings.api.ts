import { api } from '../lib/axios';
import type { Settings, UpdateSettingsInput, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = API_URL.replace(/\/?api\/?$/, '');

const resolveLogoUrl = (url?: string | null) => {
  if (!url) return url || null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
};

export const settingsApi = {
  /**
   * Obtener configuración actual del sistema
   */
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    const settings = response.data.data;
    return {
      ...settings,
      companyLogo: resolveLogoUrl(settings.companyLogo),
    };
  },

  /**
   * GET /api/settings/rate
   * Obtener la tasa de cambio USD -> Bs (sin autenticación)
   */
  async getRate(): Promise<{ usdToBsRate: number | null; usdToBsUpdatedAt: string | null }> {
    const response = await api.get<ApiResponse<{ usdToBsRate: number | null; usdToBsUpdatedAt: string | null }>>('/settings/rate');
    return response.data.data;
  },

  /**
   * POST /api/settings/rate/refresh
   * Consultar el API del Banco de Venezuela, obtener la tasa USD -> Bs
   * y persistirla en la configuración del sistema.
   * Solo accesible por ADMIN.
   */
  async refreshRate(): Promise<{ usdToBsRate: number; usdToBsUpdatedAt: string | null; source: string }> {
    const response = await api.post<ApiResponse<{ usdToBsRate: number; usdToBsUpdatedAt: string | null; source: string }>>('/settings/rate/refresh');
    return response.data.data;
  },

  /**
   * Actualizar configuración del sistema
   * Solo accesible por ADMIN
   */
  async updateSettings(data: UpdateSettingsInput): Promise<Settings> {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    return response.data.data;
  },

  /**
   * Restaurar configuración a valores por defecto
   * Solo accesible por ADMIN
   */
  async resetToDefaults(): Promise<Settings> {
    const response = await api.post<ApiResponse<Settings>>('/settings/reset');
    return response.data.data;
  },

  /**
   * Exportar todos los datos del sistema
   * Solo accesible por ADMIN
   * Retorna un archivo JSON para descargar
   */
  async exportData(): Promise<Blob> {
    const response = await api.get('/settings/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importar datos al sistema desde un backup
   * Solo accesible por ADMIN
   */
  async importData(data: any): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/settings/import', data);
    return response.data.data;
  },

  /**
   * Subir logo de la compañía
   * Solo accesible por ADMIN
   */
  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<ApiResponse<{ url: string }>>('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resolveLogoUrl(response.data.data.url) || '';
  },
};

