
import { create } from 'zustand';
import { Creator, CreatorFilters } from '@/types/creator';
import { creatorsApi } from '@/lib/api/creators';

interface CreatorState {
  creators: Creator[];
  shortlisted: Record<string, Creator[]>;
  loading: boolean;
  filters: CreatorFilters;
  
  // Actions
  fetchCreators: () => Promise<void>;
  setFilters: (filters: Partial<CreatorFilters>) => void;
  shortlistCreator: (creatorId: string, dealId: string) => Promise<void>;
  fetchShortlisted: (dealId: string) => Promise<void>;
}

export const useCreatorStore = create<CreatorState>((set, get) => ({
  creators: [],
  shortlisted: {},
  loading: false,
  filters: { niche: 'all', platform: 'all', tier: 'all', search: '' },

  fetchCreators: async () => {
    set({ loading: true });
    try {
      const res = await creatorsApi.getCreators(get().filters);
      if (res.success) set({ creators: res.data });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchCreators();
  },

  shortlistCreator: async (creatorId, dealId) => {
    const res = await creatorsApi.shortlistCreator(creatorId, dealId);
    if (res.success) {
      await get().fetchShortlisted(dealId);
    }
  },

  fetchShortlisted: async (dealId) => {
    const res = await creatorsApi.getShortlistedCreators(dealId);
    if (res.success) {
      set(state => ({
        shortlisted: { ...state.shortlisted, [dealId]: res.data }
      }));
    }
  }
}));
