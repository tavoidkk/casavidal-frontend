import { api } from '../lib/axios';
import type { ApiResponse } from '../types';

export interface RecommendationItem {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
  currentStock: number;
  category?: {
    name: string;
  };
  reason: 'frequently_bought_together' | 'similar' | 'category_based' | 'trending';
  score: number;
}

export const recommendationsApi = {
  /**
   * Obtener recomendaciones para un producto
   */
  async getProductRecommendations(productId: string, limit = 6): Promise<RecommendationItem[]> {
    const response = await api.get<ApiResponse<RecommendationItem[]>>(
      `/recommendations/product/${productId}`,
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Obtener recomendaciones para un carrito
   */
  async getCartRecommendations(productIds: string[], limit = 6): Promise<RecommendationItem[]> {
    const response = await api.post<ApiResponse<RecommendationItem[]>>(
      '/recommendations/cart',
      { productIds },
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Obtener productos trending
   */
  async getTrendingProducts(limit = 10, days = 30): Promise<RecommendationItem[]> {
    const response = await api.get<ApiResponse<RecommendationItem[]>>(
      '/recommendations/trending',
      { params: { limit, days } }
    );
    return response.data.data;
  },

  /**
   * Limpiar cache de recomendaciones (solo ADMIN)
   */
  async clearCache(): Promise<void> {
    await api.post('/recommendations/clear-cache');
  },
};
