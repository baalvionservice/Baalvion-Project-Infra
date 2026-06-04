import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  commerceRevenueApi,
  type RevenueRange,
  type PlatformRevenueReport,
} from '@/lib/api/commerce-revenue';

const KEY = 'commerce-revenue';

// Platform-wide order revenue. Unlike commerce-analytics.queries.ts this is NOT
// store-scoped — it never gates on activeStoreId; the backend aggregates across
// every store the caller's platform-admin gate permits.
export const usePlatformCommerceRevenue = (range: RevenueRange) =>
  useQuery<PlatformRevenueReport>({
    queryKey: [KEY, 'platform', range],
    queryFn: () => commerceRevenueApi.revenue(range).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
