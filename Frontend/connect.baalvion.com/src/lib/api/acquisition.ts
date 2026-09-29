
import api from './axios';
import { ScrapedLead, EnrichedLead, ScraperPlatform, ScrapeSession } from '@/types/acquisition';
import { ApiResponse } from '@/types/crm';

export const acquisitionApi = {
  scrapeLeads: async (platform: ScraperPlatform, query: string, limit: number): Promise<ApiResponse<ScrapedLead[]>> => {
    const { data } = await api.post('/acquisition/scrape', { platform, query, limit });
    return data;
  },

  enrichLeads: async (leads: ScrapedLead[]): Promise<ApiResponse<EnrichedLead[]>> => {
    const { data } = await api.post('/acquisition/enrich', { leads });
    return data;
  },

  importLeads: async (leads: ScrapedLead[]): Promise<ApiResponse<{ importedCount: number }>> => {
    const { data } = await api.post('/acquisition/import', { leads });
    return data;
  },

  getHistory: async (): Promise<ApiResponse<ScrapeSession[]>> => {
    const { data } = await api.get('/acquisition/history');
    return data;
  }
};
