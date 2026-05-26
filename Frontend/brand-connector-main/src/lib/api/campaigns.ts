
import api from './axios';
import { CampaignExecution } from '@/types/campaign';
import { ApiResponse } from '@/types/crm';

export const campaignsApi = {
  getCampaigns: async (): Promise<ApiResponse<CampaignExecution[]>> => {
    const { data } = await api.get('/campaigns');
    return data;
  },

  getCampaign: async (id: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.get(`/campaigns/${id}`);
    return data;
  },

  createCampaign: async (proposalId: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.post('/campaigns/create', { proposalId });
    return data;
  },

  startCampaign: async (id: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.post(`/campaigns/${id}/start`);
    return data;
  },

  submitDeliverable: async (id: string, deliverableId: string, submissionUrl: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.post(`/campaigns/${id}/submit-deliverable`, { deliverableId, submissionUrl });
    return data;
  },

  approveDeliverable: async (id: string, deliverableId: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.post(`/campaigns/${id}/approve-deliverable`, { deliverableId });
    return data;
  },

  completeCampaign: async (id: string): Promise<ApiResponse<CampaignExecution>> => {
    const { data } = await api.post(`/campaigns/${id}/complete`);
    return data;
  }
};
