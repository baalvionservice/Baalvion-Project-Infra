
import { create } from 'zustand';
import { MatchResult } from '@/types/matching';
import { matchingApi } from '@/lib/api/matching';
import { useCreatorStore } from './useCreatorStore';

interface MatchingState {
  matches: MatchResult[];
  loading: boolean;
  
  // Actions
  fetchMatches: (dealId: string) => Promise<void>;
  autoShortlistTop: (dealId: string) => Promise<void>;
  clearMatches: () => void;
}

export const useMatchingStore = create<MatchingState>((set, get) => ({
  matches: [],
  loading: false,

  fetchMatches: async (dealId) => {
    set({ loading: true });
    try {
      const res = await matchingApi.getMatches(dealId);
      if (res.success) set({ matches: res.data });
    } finally {
      set({ loading: false });
    }
  },

  autoShortlistTop: async (dealId) => {
    const topCreatorIds = get().matches.slice(0, 5).map(m => m.creator.id);
    if (topCreatorIds.length === 0) return;

    set({ loading: true });
    try {
      const res = await matchingApi.autoShortlist(dealId, topCreatorIds);
      if (res.success) {
        // Refresh shortlist in creator store
        await useCreatorStore.getState().fetchShortlisted(dealId);
      }
    } finally {
      set({ loading: false });
    }
  },

  clearMatches: () => set({ matches: [] })
}));
