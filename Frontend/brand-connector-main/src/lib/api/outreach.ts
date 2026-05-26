
import api from './axios';
import { 
  OutreachCampaign, 
  OutreachMessage, 
  CreateCampaignPayload 
} from '@/types/outreach';
import { ApiResponse } from '@/types/crm';

export const outreachApi = {
  getCampaigns: async (): Promise<ApiResponse<OutreachCampaign[]>> => {
    const { data } = await api.get('/outreach/campaigns');
    return data;
  },

  getCampaignDetails: async (id: string): Promise<ApiResponse<OutreachCampaign>> => {
    const { data } = await api.get(`/outreach/campaigns?id=${id}`);
    return data;
  },

  createCampaign: async (payload: CreateCampaignPayload): Promise<ApiResponse<OutreachCampaign>> => {
    const { data } = await api.post('/outreach/campaign', payload);
    return data;
  },

  getMessages: async (campaignId: string): Promise<ApiResponse<OutreachMessage[]>> => {
    const { data } = await api.get(`/outreach/messages?campaignId=${campaignId}`);
    return data;
  },

  sendCampaign: async (campaignId: string): Promise<ApiResponse<{ sent: number }>> => {
    const { data } = await api.post('/outreach/send', { campaignId });
    return data;
  },

  simulateReplies: async (campaignId: string): Promise<ApiResponse<{ replies: number }>> => {
    const { data } = await api.post('/outreach/simulate-replies', { campaignId });
    return data;
  },

  sendFollowUp: async (messageId: string): Promise<ApiResponse<OutreachMessage>> => {
    const { data } = await api.post('/outreach/follow-up', { messageId });
    return data;
  }
};
