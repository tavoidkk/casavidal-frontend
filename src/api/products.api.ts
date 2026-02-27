import { api } from '../lib/axios';
import type { Product, ApiResponse, PaginatedResponse } from '../types';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  currentStock: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  image?: string;
  hasVariants?: boolean;
  variantInfo?: string;
}

export interface AdjustStockData {
  productId: string;
  quantity: number;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DEVOLUCION';
  reference?: string;
  notes?: string;
}

export const productsApi = {
  getAll: async (filters?: ProductFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.lowStock) params.append('lowStock', 'true');
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    params.append('isActive', filters?.isActive === false ? 'false' : 'true');

    const { data } = await api.get<PaginatedResponse<Product>>(`/products?${params}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  create: async (productData: CreateProductData) => {
    const { data } = await api.post<ApiResponse<Product>>('/products', productData);
    return data.data;
  },

  update: async (id: string, productData: Partial<CreateProductData>) => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return data.data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
    return data.data;
  },

  adjustStock: async (adjustData: AdjustStockData) => {
    const { data } = await api.post<ApiResponse<Product>>('/products/adjust-stock', adjustData);
    return data.data;
  },

  getLowStock: async () => {
    const { data } = await api.get<ApiResponse<Product[]>>('/products/low-stock');
    return data.data;
  },

  getStats: async () => {
    const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/products/stats');
    return data.data;
  },

  getCategories: async () => {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories');
    return data.data;
  },
};
