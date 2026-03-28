import { api } from '../lib/axios';
import type { Settings, UpdateSettingsInput, ApiResponse } from '../types';

export const settingsApi = {
  /**
   * Obtener configuración actual del sistema
   */
  async getSettings(): Promise<Settings> {
    const response = await api.get<ApiResponse<Settings>>('/settings');
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
};

