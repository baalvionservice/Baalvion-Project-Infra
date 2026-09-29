
import api from './axios';
import { MatchResult } from '@/types/matching';
import { ApiResponse } from '@/types/crm';

export const matchingApi = {
  getMatches: async (dealId: string): Promise<ApiResponse<MatchResult[]>> => {
    const { data } = await api.get(`/matching/${dealId}`);
    return data;
  },

  autoShortlist: async (dealId: string, creatorIds: string[]): Promise<ApiResponse<any>> => {
    const { data } = await api.post('/matching/auto-shortlist', { dealId, creatorIds });
    return data;
  }
};
