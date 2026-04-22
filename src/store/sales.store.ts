import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
  companyName?: string;
  clientType?: 'NATURAL' | 'JURIDICO';
}

export interface DraftSale {
  id: string;
  customer: SaleCustomer | null;
  items: SaleItem[];
  subtotal: number;
  freight: number;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  notes: string;
  status: 'DRAFT' | 'HOLD';
  createdAt: string;
  updatedAt: string;
}

interface SalesState {
  // Venta activa
  currentSale: DraftSale | null;
  activeSaleId: string | null;
  initNewSale: () => void;
  setSaleCustomer: (customer: SaleCustomer | null) => void;
  addSaleItem: (item: SaleItem) => void;
  removeSaleItem: (productId: string) => void;
  updateSaleItemQuantity: (productId: string, quantity: number) => void;
  setSaleFreight: (value: number) => void;
  setSaleDiscount: (value: number, type: 'PERCENTAGE' | 'FIXED') => void;
  setSaleTaxRate: (value: number) => void;
  setSalePaymentMethod: (method: string) => void;
  setSaleNotes: (notes: string) => void;
  calculateSaleTotal: () => void;

  // Gestión de borradores
  draftSales: DraftSale[];
  saveDraftSale: () => void;
  loadDraftSale: (id: string) => void;
  deleteDraftSale: (id: string) => void;
  clearCurrentSale: () => void;

  // Utilidades
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
}

const generateId = () => `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createEmptySale = (): DraftSale => ({
  id: generateId(),
  customer: null,
  items: [],
  subtotal: 0,
  freight: 0,
  discount: 0,
  discountType: 'PERCENTAGE',
  taxRate: 0.16,
  taxAmount: 0,
  total: 0,
  paymentMethod: 'EFECTIVO',
  notes: '',
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      currentSale: null,
      activeSaleId: null,
      draftSales: [],
      isDirty: false,

      initNewSale: () => {
        set({
          currentSale: createEmptySale(),
          activeSaleId: null,
          isDirty: false,
        });
      },

      setSaleCustomer: (customer) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, customer },
            isDirty: true,
          };
        });
      },

      addSaleItem: (item) => {
        set((state) => {
          if (!state.currentSale) return state;
          const existingItem = state.currentSale.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            const updatedItems = state.currentSale.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unitPrice }
                : i
            );
            return {
              currentSale: { ...state.currentSale, items: updatedItems },
              isDirty: true,
            };
          }
          return {
            currentSale: { ...state.currentSale, items: [...state.currentSale.items, item] },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      removeSaleItem: (productId) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: {
              ...state.currentSale,
              items: state.currentSale.items.filter((i) => i.productId !== productId),
            },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      updateSaleItemQuantity: (productId, quantity) => {
        set((state) => {
          if (!state.currentSale) return state;
          const updatedItems = state.currentSale.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, quantity), subtotal: Math.max(1, quantity) * i.unitPrice }
              : i
          );
          return {
            currentSale: { ...state.currentSale, items: updatedItems },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      setSaleFreight: (value) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, freight: value },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      setSaleDiscount: (value, type) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, discount: value, discountType: type },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      setSaleTaxRate: (value) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, taxRate: value },
            isDirty: true,
          };
        });
        get().calculateSaleTotal();
      },

      setSalePaymentMethod: (method) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, paymentMethod: method },
            isDirty: true,
          };
        });
      },

      setSaleNotes: (notes) => {
        set((state) => {
          if (!state.currentSale) return state;
          return {
            currentSale: { ...state.currentSale, notes },
            isDirty: true,
          };
        });
      },

      calculateSaleTotal: () => {
        set((state) => {
          if (!state.currentSale) return state;

          const { items, freight, discount, discountType, taxRate } = state.currentSale;
          const itemsSubtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
          const subtotalWithFreight = itemsSubtotal + freight;

          let discountAmount = 0;
          if (discountType === 'PERCENTAGE') {
            discountAmount = (subtotalWithFreight * discount) / 100;
          } else {
            discountAmount = discount;
          }

          const subtotalAfterDiscount = subtotalWithFreight - discountAmount;
          const taxAmount = subtotalAfterDiscount * taxRate;
          const total = subtotalAfterDiscount + taxAmount;

          return {
            currentSale: {
              ...state.currentSale,
              subtotal: itemsSubtotal,
              taxAmount,
              total,
            },
          };
        });
      },

      saveDraftSale: () => {
        set((state) => {
          if (!state.currentSale) return state;
          const updated = {
            ...state.currentSale,
            updatedAt: new Date().toISOString(),
          };
          const existingIndex = state.draftSales.findIndex((d) => d.id === state.currentSale!.id);
          let updatedDrafts = state.draftSales;
          if (existingIndex >= 0) {
            updatedDrafts = [
              ...state.draftSales.slice(0, existingIndex),
              updated,
              ...state.draftSales.slice(existingIndex + 1),
            ];
          } else {
            updatedDrafts = [...state.draftSales, updated];
          }
          return {
            draftSales: updatedDrafts,
            activeSaleId: updated.id,
            isDirty: false,
          };
        });
      },

      loadDraftSale: (id) => {
        set((state) => {
          const sale = state.draftSales.find((d) => d.id === id);
          return {
            currentSale: sale || null,
            activeSaleId: id,
            isDirty: false,
          };
        });
      },

      deleteDraftSale: (id) => {
        set((state) => {
          const filtered = state.draftSales.filter((d) => d.id !== id);
          const newActive = state.activeSaleId === id ? null : state.activeSaleId;
          return {
            draftSales: filtered,
            activeSaleId: newActive,
            currentSale: newActive && filtered.find((d) => d.id === newActive) ? state.currentSale : null,
          };
        });
      },

      clearCurrentSale: () => {
        set({
          currentSale: null,
          activeSaleId: null,
          isDirty: false,
        });
      },

      setIsDirty: (value) => {
        set({ isDirty: value });
      },
    }),
    {
      name: 'sales-store',
      version: 1,
    }
  )
);
