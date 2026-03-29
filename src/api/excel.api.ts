import { api } from '../lib/axios';
import type { ApiResponse } from '../types';

export const excelApi = {
  /**
   * Exportar productos a Excel
   */
  async exportProducts(): Promise<Blob> {
    const response = await api.get('/excel/export/products', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exportar clientes a Excel
   */
  async exportClients(): Promise<Blob> {
    const response = await api.get('/excel/export/clients', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exportar proveedores a Excel
   */
  async exportSuppliers(): Promise<Blob> {
    const response = await api.get('/excel/export/suppliers', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importar productos desde Excel
   */
  async importProducts(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>('/excel/import/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Importar clientes desde Excel
   */
  async importClients(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>('/excel/import/clients', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Importar proveedores desde Excel
   */
  async importSuppliers(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>('/excel/import/suppliers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
