
import { create } from 'zustand';
import { ScrapedLead, EnrichedLead, ScraperPlatform, ScrapeSession } from '@/types/acquisition';
import { acquisitionApi } from '@/lib/api/acquisition';

interface AcquisitionState {
  scrapedLeads: ScrapedLead[];
  enrichedLeads: Record<string, EnrichedLead>;
  history: ScrapeSession[];
  loading: boolean;
  enriching: boolean;
  importing: boolean;
  
  // Actions
  runScraper: (platform: ScraperPlatform, query: string, limit: number) => Promise<void>;
  runEnrichment: (leads: ScrapedLead[]) => Promise<void>;
  runImport: (leads: ScrapedLead[]) => Promise<number>;
  fetchHistory: () => Promise<void>;
  clearLeads: () => void;
}

export const useAcquisitionStore = create<AcquisitionState>((set, get) => ({
  scrapedLeads: [],
  enrichedLeads: {},
  history: [],
  loading: false,
  enriching: false,
  importing: false,

  runScraper: async (platform, query, limit) => {
    set({ loading: true });
    try {
      const response = await acquisitionApi.scrapeLeads(platform, query, limit);
      if (response.success) {
        set({ scrapedLeads: response.data });
        await get().fetchHistory();
      }
    } finally {
      set({ loading: false });
    }
  },

  runEnrichment: async (leads) => {
    set({ enriching: true });
    try {
      const response = await acquisitionApi.enrichLeads(leads);
      if (response.success) {
        const enrichedMap = response.data.reduce((acc, curr) => ({
          ...acc,
          [curr.id]: curr
        }), {});
        
        set((state) => ({
          enrichedLeads: { ...state.enrichedLeads, ...enrichedMap },
          scrapedLeads: state.scrapedLeads.map(l => 
            leads.find(sl => sl.id === l.id) ? { ...l, isEnriched: true } : l
          )
        }));
      }
    } finally {
      set({ enriching: false });
    }
  },

  runImport: async (leads) => {
    set({ importing: true });
    try {
      const response = await acquisitionApi.importLeads(leads);
      if (response.success) {
        return response.data.importedCount;
      }
      return 0;
    } finally {
      set({ importing: false });
    }
  },

  fetchHistory: async () => {
    const response = await acquisitionApi.getHistory();
    if (response.success) {
      set({ history: response.data });
    }
  },

  clearLeads: () => set({ scrapedLeads: [], enrichedLeads: {} })
}));
