
import api from './axios';
import { Deal, DealStage } from '@/types/deal';
import { ApiResponse } from '@/types/crm';

export const dealsApi = {
  getDeals: async (): Promise<ApiResponse<Deal[]>> => {
    const { data } = await api.get('/deals');
    return data;
  },

  createDeal: async (payload: Partial<Deal>): Promise<ApiResponse<Deal>> => {
    const { data } = await api.post('/deals/create', payload);
    return data;
  },

  updateDeal: async (id: string, payload: Partial<Deal>): Promise<ApiResponse<Deal>> => {
    const { data } = await api.patch(`/deals/${id}`, payload);
    return data;
  },

  addNote: async (id: string, text: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post(`/deals/${id}/note`, { text });
    return data;
  },

  convertFromReply: async (messageId: string): Promise<ApiResponse<Deal>> => {
    const { data } = await api.post('/deals/convert-from-reply', { messageId });
    return data;
  }
};
