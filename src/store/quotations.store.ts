import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuotationItem } from '../api/quotations.api';

interface ClientInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
  clientType?: 'NATURAL' | 'JURIDICO';
}

export interface SavedQuotation {
  id: string;
  number: string;
  selectedClient: ClientInfo;
  items: QuotationItem[];
  freight: number;
  taxRate: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  notes: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
}

interface QuotationState {
  // Cliente
  selectedClient: ClientInfo | null;
  setSelectedClient: (client: ClientInfo | null) => void;

  // Items
  items: QuotationItem[];
  addItem: (item: QuotationItem) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;

  // Configuración
  freight: number;
  setFreight: (value: number) => void;
  taxRate: number;
  setTaxRate: (value: number) => void;
  discountType: 'PERCENTAGE' | 'FIXED';
  setDiscountType: (type: 'PERCENTAGE' | 'FIXED') => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  expiresAt: string;
  setExpiresAt: (date: string) => void;

  // Cálculos (derivados)
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  recalculate: () => void;

  // Cotizaciones guardadas
  savedQuotations: SavedQuotation[];
  currentQuotationId: string | null;
  saveQuotation: () => SavedQuotation | null;
  loadQuotation: (id: string) => void;
  deleteQuotation: (id: string) => void;
  updateQuotation: (id: string, data: Partial<SavedQuotation>) => void;
  setSavedQuotations: (quotations: SavedQuotation[]) => void;

  // Reset
  reset: () => void;
}

export const useQuotationStore = create<QuotationState>()(
  persist(
    (set, get) => ({
      selectedClient: null,
      setSelectedClient: (client) => set({ selectedClient: client }),

      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unitPrice }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      updateItemQuantity: (itemId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId
              ? { ...i, quantity, subtotal: quantity * i.unitPrice }
              : i
          ),
        })),

      freight: 0,
      setFreight: (value) => set({ freight: value }),

      taxRate: 16,
      setTaxRate: (value) => set({ taxRate: value }),

      discountType: 'PERCENTAGE',
      setDiscountType: (type) => set({ discountType: type }),

      discountValue: 0,
      setDiscountValue: (value) => set({ discountValue: value }),

      notes: '',
      setNotes: (notes) => set({ notes }),

      expiresAt: '',
      setExpiresAt: (date) => set({ expiresAt: date }),

      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,

      recalculate: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);
        const subtotalWithFreight = subtotal + state.freight;
        const taxAmount = (subtotalWithFreight * state.taxRate) / 100;
        const discountAmount =
          state.discountType === 'PERCENTAGE'
            ? ((subtotalWithFreight + taxAmount) * state.discountValue) / 100
            : state.discountValue;
        const total = subtotalWithFreight + taxAmount - discountAmount;

        set({
          subtotal,
          taxAmount,
          discountAmount,
          total: Math.max(0, total),
        });
      },

      // Cotizaciones guardadas
      savedQuotations: [],
      currentQuotationId: null,

      saveQuotation: () => {
        const state = get();
        
        if (!state.selectedClient || state.items.length === 0) {
          return null;
        }

        const now = new Date().toISOString();
        const quotationNumber = `COT-${new Date().getFullYear()}-${String(Math.random() * 10000).split('.')[0]?.padStart(3, '0') || '001'}`;
        
        const quotation: SavedQuotation = {
          id: `${quotationNumber}-${Date.now()}`,
          number: quotationNumber,
          selectedClient: state.selectedClient,
          items: state.items,
          freight: state.freight,
          taxRate: state.taxRate,
          discountType: state.discountType,
          discountValue: state.discountValue,
          notes: state.notes,
          subtotal: state.subtotal,
          taxAmount: state.taxAmount,
          discountAmount: state.discountAmount,
          total: state.total,
          createdAt: now,
          updatedAt: now,
          status: 'DRAFT',
        };

        const updated = state.currentQuotationId
          ? state.savedQuotations.map((q) =>
              q.id === state.currentQuotationId ? { ...quotation, id: state.currentQuotationId, createdAt: q.createdAt } : q
            )
          : [...state.savedQuotations, quotation];

        set({
          savedQuotations: updated,
          currentQuotationId: quotation.id,
        });

        return quotation;
      },

      loadQuotation: (id) => {
        const state = get();
        const quotation = state.savedQuotations.find((q) => q.id === id);

        if (quotation) {
          set({
            selectedClient: quotation.selectedClient,
            items: quotation.items,
            freight: quotation.freight,
            taxRate: quotation.taxRate,
            discountType: quotation.discountType,
            discountValue: quotation.discountValue,
            notes: quotation.notes,
            subtotal: quotation.subtotal,
            taxAmount: quotation.taxAmount,
            discountAmount: quotation.discountAmount,
            total: quotation.total,
            currentQuotationId: id,
          });
        }
      },

      deleteQuotation: (id) => {
        set((state) => ({
          savedQuotations: state.savedQuotations.filter((q) => q.id !== id),
          currentQuotationId: state.currentQuotationId === id ? null : state.currentQuotationId,
        }));
      },

      updateQuotation: (id, data) => {
        set((state) => ({
          savedQuotations: state.savedQuotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : q
          ),
        }));
      },

      setSavedQuotations: (quotations) => set({ savedQuotations: quotations }),

      reset: () =>
        set({
          selectedClient: null,
          items: [],
          freight: 0,
          taxRate: 16,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          notes: '',
          expiresAt: '',
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          total: 0,
          currentQuotationId: null,
        }),
    }),
    {
      name: 'quotation-store',
      version: 1,
    }
  )
);
