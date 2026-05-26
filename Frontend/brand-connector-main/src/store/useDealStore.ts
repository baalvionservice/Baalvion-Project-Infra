
import { create } from 'zustand';
import { Deal, DealStage } from '@/types/deal';
import { dealsApi } from '@/lib/api/deals';

interface DealState {
  deals: Deal[];
  loading: boolean;
  selectedDeal: Deal | null;
  
  // Actions
  fetchDeals: () => Promise<void>;
  createDeal: (data: Partial<Deal>) => Promise<void>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  addNote: (id: string, text: string) => Promise<void>;
  convertFromReply: (messageId: string) => Promise<void>;
  selectDeal: (deal: Deal | null) => void;
  
  // Derived
  getDealsByStage: (stage: DealStage) => Deal[];
  getInsights: () => { totalValue: number; wonValue: number; count: number; winRate: number };
}

export const useDealStore = create<DealState>((set, get) => ({
  deals: [],
  loading: false,
  selectedDeal: null,

  fetchDeals: async () => {
    set({ loading: true });
    try {
      const response = await dealsApi.getDeals();
      if (response.success) set({ deals: response.data });
    } finally {
      set({ loading: false });
    }
  },

  createDeal: async (data) => {
    const response = await dealsApi.createDeal(data);
    if (response.success) set(state => ({ deals: [response.data, ...state.deals] }));
  },

  updateDeal: async (id, updates) => {
    const response = await dealsApi.updateDeal(id, updates);
    if (response.success) {
      set(state => ({
        deals: state.deals.map(d => d.id === id ? response.data : d),
        selectedDeal: state.selectedDeal?.id === id ? response.data : state.selectedDeal
      }));
    }
  },

  addNote: async (id, text) => {
    const response = await dealsApi.addNote(id, text);
    if (response.success) {
      const updatedDeals = get().deals.map(d => {
        if (d.id === id) {
          return { ...d, notes: [response.data, ...d.notes] };
        }
        return d;
      });
      set({ deals: updatedDeals });
      if (get().selectedDeal?.id === id) {
        set({ selectedDeal: updatedDeals.find(d => d.id === id) || null });
      }
    }
  },

  convertFromReply: async (messageId) => {
    const response = await dealsApi.convertFromReply(messageId);
    if (response.success) {
      set(state => ({ deals: [response.data, ...state.deals] }));
    }
  },

  selectDeal: (deal) => set({ selectedDeal: deal }),

  getDealsByStage: (stage) => {
    return get().deals.filter(d => d.stage === stage);
  },

  getInsights: () => {
    const deals = get().deals;
    const totalValue = deals.reduce((acc, d) => acc + d.value, 0);
    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const wonValue = wonDeals.reduce((acc, d) => acc + d.value, 0);
    const closedCount = deals.filter(d => d.stage.startsWith('closed')).length;
    const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;

    return { totalValue, wonValue, count: deals.length, winRate };
  }
}));
