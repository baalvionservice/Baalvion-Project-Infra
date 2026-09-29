import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unifiedAnalyticsApi } from '@/lib/api/analytics-unified';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

/** Convert a period preset to an inclusive [from,to] YYYY-MM-DD range. */
export function rangeFromPeriod(period: AnalyticsPeriod): { from: string; to: string } {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export const unifiedAnalyticsKeys = {
  overview: (id: string, period: AnalyticsPeriod, module: string) =>
    ['ua', 'overview', id, period, module] as const,
  timeseries: (id: string, period: AnalyticsPeriod, metric: string, module: string) =>
    ['ua', 'timeseries', id, period, metric, module] as const,
  breakdown: (id: string, period: AnalyticsPeriod, dimension: string, metric: string, module: string) =>
    ['ua', 'breakdown', id, period, dimension, metric, module] as const,
  realtime: (id: string) => ['ua', 'realtime', id] as const,
  providers: (id: string) => ['ua', 'providers', id] as const,
  seoVitals: (id: string, period: AnalyticsPeriod) => ['ua', 'seo-vitals', id, period] as const,
  providerTotals: (id: string, provider: string) => ['ua', 'provider-totals', id, provider] as const,
  providerBreakdown: (id: string, provider: string, metric: string, dimension: string) =>
    ['ua', 'provider-breakdown', id, provider, metric, dimension] as const,
  moduleTotals: (id: string, period: AnalyticsPeriod, module: string) =>
    ['ua', 'module-totals', id, period, module] as const,
  infra: (id: string) => ['ua', 'infra', id] as const,
  anomalies: (id: string) => ['ua', 'anomalies', id] as const,
  providerState: (id: string) => ['ua', 'provider-state', id] as const,
};

export const useTrafficOverview = (websiteId: string, period: AnalyticsPeriod, module = 'traffic') =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.overview(websiteId, period, module),
    queryFn: () =>
      unifiedAnalyticsApi.overview(websiteId, { ...rangeFromPeriod(period), module }).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useTrafficTimeseries = (
  websiteId: string,
  period: AnalyticsPeriod,
  metric = 'pageviews',
  module = 'traffic',
) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.timeseries(websiteId, period, metric, module),
    queryFn: () =>
      unifiedAnalyticsApi
        .timeseries(websiteId, { ...rangeFromPeriod(period), metric, module })
        .then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useTrafficBreakdown = (
  websiteId: string,
  period: AnalyticsPeriod,
  dimension: string,
  metric = 'pageviews',
  module = 'traffic',
  limit = 20,
) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.breakdown(websiteId, period, dimension, metric, module),
    queryFn: () =>
      unifiedAnalyticsApi
        .breakdown(websiteId, { ...rangeFromPeriod(period), dimension, metric, module, limit })
        .then((r) => r.data.data),
    enabled: !!websiteId && !!dimension,
    staleTime: 60_000,
  });

export const useRealtime = (websiteId: string, windowMin = 5) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.realtime(websiteId),
    queryFn: () => unifiedAnalyticsApi.realtime(websiteId, windowMin).then((r) => r.data.data),
    enabled: !!websiteId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

export const useAnalyticsProviders = (websiteId: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.providers(websiteId),
    queryFn: () => unifiedAnalyticsApi.providers(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 120_000,
  });

export const useSeoVitals = (websiteId: string, period: AnalyticsPeriod) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.seoVitals(websiteId, period),
    queryFn: () => unifiedAnalyticsApi.seoVitals(websiteId, rangeFromPeriod(period)).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useProviderTotals = (websiteId: string, provider: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.providerTotals(websiteId, provider),
    queryFn: () => unifiedAnalyticsApi.providerTotals(websiteId, provider).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 120_000,
  });

export const useProviderBreakdown = (websiteId: string, provider: string, metric: string, dimension: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.providerBreakdown(websiteId, provider, metric, dimension),
    queryFn: () =>
      unifiedAnalyticsApi.providerBreakdown(websiteId, provider, { metric, dimension }).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 120_000,
  });

export const useModuleTotals = (websiteId: string, period: AnalyticsPeriod, module: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.moduleTotals(websiteId, period, module),
    queryFn: () =>
      unifiedAnalyticsApi.moduleTotals(websiteId, { ...rangeFromPeriod(period), module }).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useInfra = (websiteId: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.infra(websiteId),
    queryFn: () => unifiedAnalyticsApi.infra(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

export const useAnomalies = (websiteId: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.anomalies(websiteId),
    queryFn: () => unifiedAnalyticsApi.anomalies(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 120_000,
  });

export const useProviderState = (websiteId: string) =>
  useQuery({
    queryKey: unifiedAnalyticsKeys.providerState(websiteId),
    queryFn: () => unifiedAnalyticsApi.providerState(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
    staleTime: 60_000,
  });

export const useTriggerProviderSync = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => unifiedAnalyticsApi.triggerSync(websiteId, provider).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: unifiedAnalyticsKeys.providers(websiteId) }),
  });
};
