
import api from './axios';
import { Lead, LeadFilters, LeadNote, ApiResponse, ScoringInsights } from '@/types/crm';

export const crmApi = {
  getLeads: async (filters: LeadFilters): Promise<ApiResponse<Lead[]>> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.niche) params.append('niche', filters.niche);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));

    const { data } = await api.get(`/leads?${params.toString()}`);
    return data;
  },

  getLeadDetails: async (id: string): Promise<ApiResponse<{ lead: Lead; notes: LeadNote[] }>> => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  createLead: async (payload: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    const { data } = await api.post('/leads', payload);
    return data;
  },

  updateLead: async (id: string, payload: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    const { data } = await api.patch(`/leads/${id}`, payload);
    return data;
  },

  addNote: async (id: string, text: string): Promise<ApiResponse<LeadNote>> => {
    const { data } = await api.post(`/leads/${id}/notes`, { text });
    return data;
  },

  convertLead: async (id: string): Promise<ApiResponse<{ brandId: string }>> => {
    const { data } = await api.post(`/leads/${id}/convert`);
    return data;
  },

  // Scoring APIs
  runScoring: async (leadIds?: string[]): Promise<ApiResponse<{ updated: number }>> => {
    const { data } = await api.post('/scoring/run', { leadIds });
    return data;
  },

  getTopLeads: async (limitCount: number = 5): Promise<ApiResponse<Lead[]>> => {
    const { data } = await api.get(`/scoring/top-leads?limit=${limitCount}`);
    return data;
  },

  getScoringInsights: async (): Promise<ApiResponse<ScoringInsights>> => {
    const { data } = await api.get('/scoring/insights');
    return data;
  }
};
