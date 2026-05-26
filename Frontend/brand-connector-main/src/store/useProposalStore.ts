
import { create } from 'zustand';
import { Proposal, Deliverable } from '@/types/proposal';
import { proposalsApi } from '@/lib/api/proposals';
import { useNotificationStore } from './useNotificationStore';

interface ProposalState {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  loading: boolean;
  
  // Actions
  fetchProposals: () => Promise<void>;
  fetchProposal: (id: string) => Promise<void>;
  createProposal: (dealId: string) => Promise<string | null>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  sendProposal: (id: string) => Promise<void>;
  approveProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string) => Promise<void>;
  selectProposal: (proposal: Proposal | null) => void;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  selectedProposal: null,
  loading: false,

  fetchProposals: async () => {
    set({ loading: true });
    try {
      const res = await proposalsApi.getProposals();
      if (res.success) set({ proposals: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchProposal: async (id) => {
    set({ loading: true });
    try {
      const res = await proposalsApi.getProposal(id);
      if (res.success) set({ selectedProposal: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createProposal: async (dealId) => {
    set({ loading: true });
    try {
      const res = await proposalsApi.createProposal(dealId);
      if (res.success) {
        set(state => ({ proposals: [res.data, ...state.proposals] }));
        useNotificationStore.getState().triggerEvent('proposal.created', res.data);
        return res.data.id;
      }
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProposal: async (id, updates) => {
    const res = await proposalsApi.updateProposal(id, updates);
    if (res.success) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? res.data : p),
        selectedProposal: state.selectedProposal?.id === id ? res.data : state.selectedProposal
      }));
    }
  },

  sendProposal: async (id) => {
    const res = await proposalsApi.sendProposal(id);
    if (res.success) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? res.data : p),
        selectedProposal: state.selectedProposal?.id === id ? res.data : state.selectedProposal
      }));
      useNotificationStore.getState().triggerEvent('proposal.sent', res.data);
    }
  },

  approveProposal: async (id) => {
    const res = await proposalsApi.approveProposal(id);
    if (res.success) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? res.data : p),
        selectedProposal: state.selectedProposal?.id === id ? res.data : state.selectedProposal
      }));
      useNotificationStore.getState().triggerEvent('proposal.approved', res.data);
    }
  },

  rejectProposal: async (id) => {
    const res = await proposalsApi.rejectProposal(id);
    if (res.success) {
      set(state => ({
        proposals: state.proposals.map(p => p.id === id ? res.data : p),
        selectedProposal: state.selectedProposal?.id === id ? res.data : state.selectedProposal
      }));
    }
  },

  selectProposal: (proposal) => set({ selectedProposal: proposal })
}));
