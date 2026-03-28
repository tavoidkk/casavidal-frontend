import { api } from '../lib/axios';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
  empty: number;
}

export const categoriesApi = {
  /**
   * Obtener todas las categorías activas
   */
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data;
  },

  /**
   * Obtener todas las categorías (incluye inactivas) - Solo admin
   */
  getAllWithInactive: async (): Promise<Category[]> => {
    const response = await api.get('/categories/admin/all');
    return response.data.data;
  },

  /**
   * Obtener categoría por ID
   */
  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  /**
   * Obtener estadísticas de categorías - Solo admin
   */
  getStats: async (): Promise<CategoryStats> => {
    const response = await api.get('/categories/admin/stats');
    return response.data.data;
  },

  /**
   * Crear nueva categoría - Solo admin
   */
  create: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data.data;
  },

  /**
   * Actualizar categoría - Solo admin
   */
  update: async (id: string, data: UpdateCategoryInput): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar categoría (soft delete) - Solo admin
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};