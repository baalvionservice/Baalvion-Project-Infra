import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

type Period = '7d' | '30d' | '90d';

export const analyticsKeys = {
  kpis: (period?: Period) => ['analytics', 'kpis', period] as const,
  userGrowth: (period?: Period) => ['analytics', 'user-growth', period] as const,
  orgGrowth: (period?: Period) => ['analytics', 'org-growth', period] as const,
  revenue: (period?: Period) => ['analytics', 'revenue', period] as const,
  serviceHealth: () => ['analytics', 'service-health'] as const,
  activity: (limit?: number) => ['analytics', 'activity', limit] as const,
};

export const useKpis = (period?: Period) =>
  useQuery({
    queryKey: analyticsKeys.kpis(period),
    queryFn: () => analyticsApi.kpis(period).then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useUserGrowth = (period?: Period) =>
  useQuery({
    queryKey: analyticsKeys.userGrowth(period),
    queryFn: () => analyticsApi.userGrowth(period).then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useOrgGrowth = (period?: Period) =>
  useQuery({
    queryKey: analyticsKeys.orgGrowth(period),
    queryFn: () => analyticsApi.orgGrowth(period).then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useRevenue = (period?: Period) =>
  useQuery({
    queryKey: analyticsKeys.revenue(period),
    queryFn: () => analyticsApi.revenue(period).then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useServiceHealth = () =>
  useQuery({
    queryKey: analyticsKeys.serviceHealth(),
    queryFn: () => analyticsApi.serviceHealth().then((r) => r.data.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

export const useRecentActivity = (limit = 20) =>
  useQuery({
    queryKey: analyticsKeys.activity(limit),
    queryFn: () => analyticsApi.recentActivity(limit).then((r) => r.data.data),
    refetchInterval: 30_000,
  });
