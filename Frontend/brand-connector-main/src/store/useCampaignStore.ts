
import { create } from 'zustand';
import { CampaignExecution } from '@/types/campaign';
import { campaignsApi } from '@/lib/api/campaigns';
import { useNotificationStore } from './useNotificationStore';

interface CampaignState {
  campaigns: CampaignExecution[];
  selectedCampaign: CampaignExecution | null;
  loading: boolean;
  
  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  createCampaign: (proposalId: string) => Promise<string | null>;
  startCampaign: (id: string) => Promise<void>;
  submitDeliverable: (id: string, delId: string, url: string) => Promise<void>;
  approveDeliverable: (id: string, delId: string) => Promise<void>;
  completeCampaign: (id: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  selectedCampaign: null,
  loading: false,

  fetchCampaigns: async () => {
    set({ loading: true });
    try {
      const res = await campaignsApi.getCampaigns();
      if (res.success) set({ campaigns: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchCampaign: async (id) => {
    set({ loading: true });
    try {
      const res = await campaignsApi.getCampaign(id);
      if (res.success) set({ selectedCampaign: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createCampaign: async (proposalId) => {
    const res = await campaignsApi.createCampaign(proposalId);
    if (res.success) {
      set(state => ({ campaigns: [res.data, ...state.campaigns] }));
      useNotificationStore.getState().triggerEvent('campaign.started', res.data);
      return res.data.id;
    }
    return null;
  },

  startCampaign: async (id) => {
    const res = await campaignsApi.startCampaign(id);
    if (res.success) {
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? res.data : c),
        selectedCampaign: state.selectedCampaign?.id === id ? res.data : state.selectedCampaign
      }));
    }
  },

  submitDeliverable: async (id, delId, url) => {
    const res = await campaignsApi.submitDeliverable(id, delId, url);
    if (res.success) {
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? res.data : c),
        selectedCampaign: state.selectedCampaign?.id === id ? res.data : state.selectedCampaign
      }));
      useNotificationStore.getState().triggerEvent('deliverable.submitted', res.data);
    }
  },

  approveDeliverable: async (id, delId) => {
    const res = await campaignsApi.approveDeliverable(id, delId);
    if (res.success) {
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? res.data : c),
        selectedCampaign: state.selectedCampaign?.id === id ? res.data : state.selectedCampaign
      }));
      useNotificationStore.getState().triggerEvent('deliverable.approved', res.data);
    }
  },

  completeCampaign: async (id) => {
    const res = await campaignsApi.completeCampaign(id);
    if (res.success) {
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? res.data : c),
        selectedCampaign: state.selectedCampaign?.id === id ? res.data : state.selectedCampaign
      }));
      useNotificationStore.getState().triggerEvent('campaign.completed', res.data);
    }
  }
}));
