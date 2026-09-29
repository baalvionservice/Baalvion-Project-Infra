import { useQuery } from '@tanstack/react-query';
import { platformRegistryApi } from '@/lib/api/platform-registry';

export const platformRegistryKeys = {
  all: ['platform-registry'] as const,
  list: () => [...platformRegistryKeys.all, 'list'] as const,
  revenue: () => [...platformRegistryKeys.all, 'revenue'] as const,
};

export const usePlatformRegistry = () =>
  useQuery({
    queryKey: platformRegistryKeys.list(),
    queryFn: () => platformRegistryApi.list().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

export const usePlatformRevenueRollup = () =>
  useQuery({
    queryKey: platformRegistryKeys.revenue(),
    queryFn: () => platformRegistryApi.revenue().then((r) => r.data.data),
    refetchInterval: 5 * 60_000,
  });
