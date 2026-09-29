
import { create } from 'zustand';
import { OutreachCampaign, OutreachMessage, CreateCampaignPayload } from '@/types/outreach';
import { outreachApi } from '@/lib/api/outreach';

interface OutreachState {
  campaigns: OutreachCampaign[];
  messages: OutreachMessage[];
  selectedCampaign: OutreachCampaign | null;
  loading: boolean;
  sending: boolean;
  
  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchMessages: (campaignId: string) => Promise<void>;
  createCampaign: (payload: CreateCampaignPayload) => Promise<void>;
  startSending: (campaignId: string) => Promise<void>;
  generateReplies: (campaignId: string) => Promise<void>;
  sendFollowUp: (messageId: string) => Promise<void>;
  selectCampaign: (campaign: OutreachCampaign | null) => void;
}

export const useOutreachStore = create<OutreachState>((set, get) => ({
  campaigns: [],
  messages: [],
  selectedCampaign: null,
  loading: false,
  sending: false,

  fetchCampaigns: async () => {
    set({ loading: true });
    try {
      const response = await outreachApi.getCampaigns();
      if (response.success) set({ campaigns: response.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (campaignId) => {
    const response = await outreachApi.getMessages(campaignId);
    if (response.success) set({ messages: response.data });
  },

  createCampaign: async (payload) => {
    set({ loading: true });
    try {
      const response = await outreachApi.createCampaign(payload);
      if (response.success) {
        set(state => ({ campaigns: [response.data, ...state.campaigns] }));
      }
    } finally {
      set({ loading: false });
    }
  },

  startSending: async (campaignId) => {
    set({ sending: true });
    try {
      const response = await outreachApi.sendCampaign(campaignId);
      if (response.success) {
        await get().fetchCampaigns();
        await get().fetchMessages(campaignId);
      }
    } finally {
      set({ sending: false });
    }
  },

  generateReplies: async (campaignId) => {
    set({ loading: true });
    try {
      const response = await outreachApi.simulateReplies(campaignId);
      if (response.success) {
        await get().fetchCampaigns();
        await get().fetchMessages(campaignId);
      }
    } finally {
      set({ loading: false });
    }
  },

  sendFollowUp: async (messageId) => {
    const response = await outreachApi.sendFollowUp(messageId);
    if (response.success && get().selectedCampaign) {
      get().fetchMessages(get().selectedCampaign!.id);
    }
  },

  selectCampaign: (campaign) => set({ selectedCampaign: campaign })
}));
