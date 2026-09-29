import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  commerceAnalyticsApi,
  type AnalyticsRange,
  type RevenueGranularity,
} from '@/lib/api/commerce-analytics';

export const analyticsKeys = {
  all: (storeId: string) => ['commerce', storeId, 'analytics'] as const,
  summary: (storeId: string, r: AnalyticsRange) =>
    ['commerce', storeId, 'analytics', 'summary', r] as const,
  topProducts: (storeId: string, r: AnalyticsRange, limit: number) =>
    ['commerce', storeId, 'analytics', 'top-products', r, limit] as const,
  byCountry: (storeId: string, r: AnalyticsRange) =>
    ['commerce', storeId, 'analytics', 'by-country', r] as const,
  revenue: (storeId: string, r: AnalyticsRange, g: RevenueGranularity) =>
    ['commerce', storeId, 'analytics', 'revenue', r, g] as const,
  reconciliation: (storeId: string, r: AnalyticsRange) =>
    ['commerce', storeId, 'analytics', 'reconciliation', r] as const,
  lowStock: (storeId: string, limit: number) =>
    ['commerce', storeId, 'analytics', 'low-stock', limit] as const,
};

export const useAnalyticsSummary = (storeId: string, range: AnalyticsRange) =>
  useQuery({
    queryKey: analyticsKeys.summary(storeId, range),
    queryFn: () => commerceAnalyticsApi.summary(storeId, range).then((r) => r.data.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useTopProducts = (storeId: string, range: AnalyticsRange, limit = 10) =>
  useQuery({
    queryKey: analyticsKeys.topProducts(storeId, range, limit),
    queryFn: () => commerceAnalyticsApi.topProducts(storeId, range, limit).then((r) => r.data.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useRevenueByCountry = (storeId: string, range: AnalyticsRange) =>
  useQuery({
    queryKey: analyticsKeys.byCountry(storeId, range),
    queryFn: () => commerceAnalyticsApi.byCountry(storeId, range).then((r) => r.data.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useRevenueSeries = (
  storeId: string,
  range: AnalyticsRange,
  granularity: RevenueGranularity = 'day',
) =>
  useQuery({
    queryKey: analyticsKeys.revenue(storeId, range, granularity),
    queryFn: () =>
      commerceAnalyticsApi.revenue(storeId, range, granularity).then((r) => r.data.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useReconciliation = (storeId: string, range: AnalyticsRange) =>
  useQuery({
    queryKey: analyticsKeys.reconciliation(storeId, range),
    queryFn: () => commerceAnalyticsApi.reconciliation(storeId, range).then((r) => r.data.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

export const useLowStockAlerts = (storeId: string, limit = 10) =>
  useQuery({
    queryKey: analyticsKeys.lowStock(storeId, limit),
    queryFn: () => commerceAnalyticsApi.lowStock(storeId, limit).then((r) => r.data),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });
