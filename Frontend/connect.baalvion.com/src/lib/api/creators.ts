
import api from './axios';
import { Creator, CreatorFilters } from '@/types/creator';
import { ApiResponse } from '@/types/crm';

export const creatorsApi = {
  getCreators: async (filters: CreatorFilters): Promise<ApiResponse<Creator[]>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.niche) params.append('niche', filters.niche);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.tier) params.append('tier', filters.tier);
    if (filters.minFollowers) params.append('minFollowers', String(filters.minFollowers));
    if (filters.maxFollowers) params.append('maxFollowers', String(filters.maxFollowers));

    const { data } = await api.get(`/creators?${params.toString()}`);
    return data;
  },

  getCreator: async (id: string): Promise<ApiResponse<Creator>> => {
    const { data } = await api.get(`/creators/${id}`);
    return data;
  },

  shortlistCreator: async (creatorId: string, dealId: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post('/creators/shortlist', { creatorId, dealId });
    return data;
  },

  getShortlistedCreators: async (dealId: string): Promise<ApiResponse<Creator[]>> => {
    const { data } = await api.get(`/creators/shortlisted/${dealId}`);
    return data;
  }
};
