import { api } from '../lib/axios';

export interface Suggestion {
  productName: string;
  reason: string;
  salePrice: number;
  productId: string;
  inStock: boolean;
}

export const salesAssistantApi = {
  getSuggestions: async (cartItems: { productId: string; name: string; category: string }[], clientId?: string) => {
    const { data } = await api.post<{ suggestions: Suggestion[] }>('/sales-assistant/suggest', {
      cartItems,
      clientId,
    });
    return data;
  },
};
