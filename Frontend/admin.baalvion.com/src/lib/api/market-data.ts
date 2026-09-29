import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type { AssetQuote, MarketDataOverview } from '@/lib/types/market-data.types';

export const marketDataApi = {
  overview: (websiteId?: string) =>
    cmsApiClient.get<ApiResponse<MarketDataOverview>>('/cms/market-data/overview', {
      params: websiteId ? { websiteId } : undefined,
    }),

  quote: (symbol: string, range: string, websiteId?: string) =>
    cmsApiClient.get<ApiResponse<AssetQuote>>(`/cms/market-data/quote/${encodeURIComponent(symbol)}`, {
      params: { range, ...(websiteId ? { websiteId } : {}) },
    }),
};
