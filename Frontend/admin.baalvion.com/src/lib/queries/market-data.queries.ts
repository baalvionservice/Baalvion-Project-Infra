import { useQuery } from '@tanstack/react-query';
import { marketDataApi } from '@/lib/api/market-data';

export const marketDataKeys = {
  all: ['cms', 'market-data'] as const,
  overview: (websiteId?: string) => [...marketDataKeys.all, 'overview', websiteId ?? 'global'] as const,
  quote: (symbol: string, range: string, websiteId?: string) =>
    [...marketDataKeys.all, 'quote', symbol, range, websiteId ?? 'global'] as const,
};

// Server-side cache already refreshes each slice on its own cadence (60s quotes,
// 30min forex/gold, hourly bonds, 6h commodities) — polling the endpoint every 60s
// just picks up whatever's fresh in Redis, it never triggers extra provider calls.
export const useMarketDataOverview = (websiteId?: string) =>
  useQuery({
    queryKey: marketDataKeys.overview(websiteId),
    queryFn: () => marketDataApi.overview(websiteId).then((r) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const useAssetQuote = (symbol: string, range: string, websiteId?: string) =>
  useQuery({
    queryKey: marketDataKeys.quote(symbol, range, websiteId),
    queryFn: () => marketDataApi.quote(symbol, range, websiteId).then((r) => r.data.data),
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
