
import api from './axios';
import { CampaignAnalytics, CreatorAnalytics, AnalyticsOverview } from '@/types/analytics';
import { ApiResponse } from '@/types/crm';

export const analyticsApi = {
  getCampaignAnalytics: async (id: string): Promise<ApiResponse<CampaignAnalytics>> => {
    const { data } = await api.get(`/analytics/campaign/${id}`);
    return data;
  },

  getCreatorAnalytics: async (campaignId: string): Promise<ApiResponse<CreatorAnalytics[]>> => {
    const { data } = await api.get(`/analytics/creators/${campaignId}`);
    return data;
  },

  getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
    const { data } = await api.get('/analytics/overview');
    return data;
  }
};
