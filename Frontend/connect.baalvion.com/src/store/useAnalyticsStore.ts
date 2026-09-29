
import { create } from 'zustand';
import { CampaignAnalytics, CreatorAnalytics, AnalyticsOverview } from '@/types/analytics';
import { analyticsApi } from '@/lib/api/analytics';

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  selectedCampaign: CampaignAnalytics | null;
  creatorPerformance: CreatorAnalytics[];
  loading: boolean;
  
  // Actions
  fetchOverview: () => Promise<void>;
  fetchCampaignAnalytics: (id: string) => Promise<void>;
  fetchCreatorPerformance: (campaignId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  selectedCampaign: null,
  creatorPerformance: [],
  loading: false,

  fetchOverview: async () => {
    set({ loading: true });
    try {
      const res = await analyticsApi.getOverview();
      if (res.success) set({ overview: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchCampaignAnalytics: async (id) => {
    set({ loading: true });
    try {
      const res = await analyticsApi.getCampaignAnalytics(id);
      if (res.success) set({ selectedCampaign: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchCreatorPerformance: async (campaignId) => {
    set({ loading: true });
    try {
      const res = await analyticsApi.getCreatorAnalytics(campaignId);
      if (res.success) set({ creatorPerformance: res.data });
    } finally {
      set({ loading: false });
    }
  }
}));
