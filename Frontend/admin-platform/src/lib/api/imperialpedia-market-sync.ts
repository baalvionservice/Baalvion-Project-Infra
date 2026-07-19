import { serviceClients } from './client';

/**
 * imperialpedia-service's own market-data SYNC health — distinct from
 * cms-service's provider-key health (Finnhub/Twelve Data/Alpha Vantage/FRED/
 * CoinGecko, surfaced separately via cms/newsroom/market-data's
 * MarketDataHealthPanel). This is the other half of the pipeline: whether
 * imperialpedia-service actually pulled that data down and wrote it into
 * asset_summaries, which is what /market-news, /world and /markets/quote/*
 * on the public site actually read from.
 */
export interface SyncStatus {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  lastRowCount: number | null;
  lastSkippedCount: number | null;
  configOk: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const imperialpediaMarketSyncApi = {
  status: () =>
    serviceClients.imperialpedia.get<ApiEnvelope<SyncStatus>>('/market-data/sync-status').then((r) => r.data.data),
  resync: () =>
    serviceClients.imperialpedia.post<ApiEnvelope<SyncStatus>>('/market-data/resync').then((r) => r.data.data),
};
