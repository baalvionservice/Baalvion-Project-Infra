import { useQuery } from '@tanstack/react-query';
import { presenceApi } from '@/lib/api/presence';

export const presenceKeys = {
  count: (storeId: string) => ['commerce', storeId, 'presence', 'count'] as const,
};

// Live visitor count for one store, polled every 15s (a non-authoritative vanity metric — never a
// security/business control). Pauses while the admin tab is backgrounded (refetchIntervalInBackground
// false). Fails soft — the backend returns { count: 0 } if Redis is down. `enabled` already gates the
// polling on a selected store.
const POLL_MS = 15_000;

export const useLiveVisitors = (storeId: string) =>
  useQuery({
    queryKey: presenceKeys.count(storeId),
    queryFn: () => presenceApi.count(storeId).then((r) => r.data.data.count),
    enabled: !!storeId,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
