import { create } from 'zustand';
import { settingsApi } from '../api/settings.api';

interface CurrencyState {
  usdToBsRate: number | null;
  usdToBsUpdatedAt: string | null;
  loading: boolean;
  error: string | null;
  loadRate: () => Promise<void>;
  setRate: (rate: number | null) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  usdToBsRate: null,
  usdToBsUpdatedAt: null,
  loading: false,
  error: null,

  loadRate: async () => {
    set({ loading: true, error: null });
    try {
      const { usdToBsRate, usdToBsUpdatedAt } = await settingsApi.getRate();
      set({
        usdToBsRate,
        usdToBsUpdatedAt,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'Error al cargar tasa de cambio', loading: false });
    }
  },

  setRate: (rate: number | null) => {
    set({ usdToBsRate: rate, usdToBsUpdatedAt: new Date().toISOString() });
  },
}));
