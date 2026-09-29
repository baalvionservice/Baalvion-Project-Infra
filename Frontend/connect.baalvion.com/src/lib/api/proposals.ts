
import api from './axios';
import { Proposal } from '@/types/proposal';
import { ApiResponse } from '@/types/crm';

export const proposalsApi = {
  getProposals: async (): Promise<ApiResponse<Proposal[]>> => {
    const { data } = await api.get('/proposals');
    return data;
  },

  getProposal: async (id: string): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.get(`/proposals?id=${id}`);
    return data;
  },

  createProposal: async (dealId: string): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.post('/proposals/create', { dealId });
    return data;
  },

  updateProposal: async (id: string, payload: Partial<Proposal>): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.patch(`/proposals/${id}`, payload);
    return data;
  },

  sendProposal: async (id: string): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.post(`/proposals/${id}/send`);
    return data;
  },

  approveProposal: async (id: string): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.post(`/proposals/${id}/approve`);
    return data;
  },

  rejectProposal: async (id: string): Promise<ApiResponse<Proposal>> => {
    const { data } = await api.post(`/proposals/${id}/reject`);
    return data;
  }
};
