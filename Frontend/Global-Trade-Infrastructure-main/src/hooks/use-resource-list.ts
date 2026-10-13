'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toList } from '@/lib/api-list';

/**
 * Load one list from the trade API as its own query, so a dashboard card shows its own loading
 * and error state instead of the whole page waiting on the slowest request.
 *
 * Unlike a bare `apiClient.get`, a failed response THROWS here: that is what lets the card say
 * "couldn't load" rather than quietly showing zero, which would look like a real answer.
 */
export function useResourceList<T = Record<string, any>>(
  key: string,
  path: string,
  params: Record<string, string | number | boolean> = {},
  options: { refreshSeconds?: number } = {},
) {
  return useQuery<T[]>({
    queryKey: ['resource-list', key, path, params],
    queryFn: async () => {
      const res = await apiClient.get<unknown>(path, params);
      if (!res.success) throw new Error(res.error?.message || 'Could not load this information');
      return toList<T>(res);
    },
    retry: 1,
    retryDelay: 1500,
    staleTime: 30_000,
    refetchInterval: (options.refreshSeconds ?? 30) * 1000,
    refetchOnWindowFocus: true,
  });
}
