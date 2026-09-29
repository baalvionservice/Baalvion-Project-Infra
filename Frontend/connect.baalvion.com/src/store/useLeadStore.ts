
import { create } from 'zustand';
import { Lead, LeadFilters, LeadNote, ScoringInsights } from '@/types/crm';
import { crmApi } from '@/lib/api/leads';

interface LeadState {
  leads: Lead[];
  totalLeads: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  filters: LeadFilters;
  selectedLead: Lead | null;
  selectedLeadNotes: LeadNote[];
  detailsLoading: boolean;
  
  // Scoring
  topLeads: Lead[];
  insights: ScoringInsights | null;
  scoringLoading: boolean;

  // Actions
  setFilters: (filters: Partial<LeadFilters>) => void;
  fetchLeads: () => Promise<void>;
  selectLead: (id: string | null) => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  addNote: (leadId: string, text: string) => Promise<void>;
  convertLead: (id: string) => Promise<void>;
  
  // Scoring Actions
  runScoring: (ids?: string[]) => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchTopLeads: (limitCount?: number) => Promise<void>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  totalLeads: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  filters: { status: 'all', niche: 'all', priority: 'all', search: '', page: 1 },
  selectedLead: null,
  selectedLeadNotes: [],
  detailsLoading: false,
  
  topLeads: [],
  insights: null,
  scoringLoading: false,

  setFilters: (newFilters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    }));
    get().fetchLeads();
  },

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const response = await crmApi.getLeads(get().filters);
      if (response.success) {
        set({ 
          leads: response.data, 
          totalLeads: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0,
          currentPage: response.pagination?.page || 1
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  selectLead: async (id) => {
    if (!id) {
      set({ selectedLead: null, selectedLeadNotes: [] });
      return;
    }

    set({ detailsLoading: true });
    try {
      const response = await crmApi.getLeadDetails(id);
      if (response.success) {
        set({ 
          selectedLead: response.data.lead, 
          selectedLeadNotes: response.data.notes 
        });
      }
    } finally {
      set({ detailsLoading: false });
    }
  },

  createLead: async (data) => {
    const response = await crmApi.createLead(data);
    if (response.success) {
      get().fetchLeads();
      get().fetchInsights();
    }
  },

  updateLead: async (id, updates) => {
    const response = await crmApi.updateLead(id, updates);
    if (response.success) {
      set((state) => ({
        leads: state.leads.map(l => l.id === id ? response.data : l),
        selectedLead: state.selectedLead?.id === id ? response.data : state.selectedLead
      }));
    }
  },

  addNote: async (leadId, text) => {
    const response = await crmApi.addNote(leadId, text);
    if (response.success) {
      set((state) => ({
        selectedLeadNotes: [response.data, ...state.selectedLeadNotes]
      }));
    }
  },

  convertLead: async (id) => {
    const response = await crmApi.convertLead(id);
    if (response.success) {
      get().updateLead(id, { status: 'closed' });
    }
  },

  // Scoring
  runScoring: async (ids) => {
    set({ scoringLoading: true });
    try {
      await crmApi.runScoring(ids);
      await Promise.all([
        get().fetchLeads(),
        get().fetchInsights(),
        get().fetchTopLeads()
      ]);
    } finally {
      set({ scoringLoading: false });
    }
  },

  fetchInsights: async () => {
    const response = await crmApi.getScoringInsights();
    if (response.success) {
      set({ insights: response.data });
    }
  },

  fetchTopLeads: async (limitCount) => {
    const response = await crmApi.getTopLeads(limitCount);
    if (response.success) {
      set({ topLeads: response.data });
    }
  }
}));
