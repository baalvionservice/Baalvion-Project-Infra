import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

// ── Unified Analytics API (cms-service, website-scoped) ───────────────────────
// Backs the per-website Analytics dashboard. All calls go through cmsApiClient
// (NEXT_PUBLIC_CMS_API_URL → /api-bff/knowledge/cms/api/v1) and are scoped to a
// website the caller is a verified member of (enforced server-side by loadCmsRole).

export interface TrafficMetrics {
  pageviews: number;
  visitors: number;
  sessions: number;
  events: number;
  avgSessionS: number;
  bounceRate: number;
  engagementRate: number;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface OverviewResponse {
  range: DateRange;
  module: string;
  metrics: TrafficMetrics;
}

export interface TimeseriesPoint {
  day: string;
  value: number;
}

export interface TimeseriesResponse {
  range: DateRange;
  module: string;
  metric: string;
  series: TimeseriesPoint[];
}

export interface BreakdownRow {
  label: string;
  value: number;
}

export interface BreakdownResponse {
  range: DateRange;
  module: string;
  dimension: string;
  metric: string;
  rows: BreakdownRow[];
}

export interface RealtimeResponse {
  windowMin: number;
  activeVisitors: number;
  activeSessions: number;
  events: number;
  topPages: Array<{ page: string; views: number }>;
}

export interface ProviderConnection {
  provider: string;
  enabled: boolean;
  status: string;
  config: Record<string, unknown>;
}

export interface ProviderCatalogItem {
  provider: string;
  label: string;
  category: string;
  requiredCreds: string[];
  implemented: boolean;
}

export interface ProvidersResponse {
  connected: ProviderConnection[];
  catalog: ProviderCatalogItem[];
}

export interface ReportParams {
  from?: string;
  to?: string;
  module?: string;
  metric?: string;
  dimension?: string;
  limit?: number;
}

const base = (websiteId: string): string => `/cms/websites/${websiteId}/analytics`;

export const unifiedAnalyticsApi = {
  overview: (websiteId: string, params?: ReportParams) =>
    cmsApiClient.get<ApiResponse<OverviewResponse>>(`${base(websiteId)}/overview`, { params }),

  timeseries: (websiteId: string, params?: ReportParams) =>
    cmsApiClient.get<ApiResponse<TimeseriesResponse>>(`${base(websiteId)}/timeseries`, { params }),

  breakdown: (websiteId: string, params: ReportParams) =>
    cmsApiClient.get<ApiResponse<BreakdownResponse>>(`${base(websiteId)}/breakdown`, { params }),

  realtime: (websiteId: string, windowMin?: number) =>
    cmsApiClient.get<ApiResponse<RealtimeResponse>>(`${base(websiteId)}/realtime`, {
      params: { windowMin },
    }),

  providers: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<ProvidersResponse>>(`${base(websiteId)}/providers`),

  triggerSync: (websiteId: string, provider: string) =>
    cmsApiClient.post<ApiResponse<{ enqueued: boolean; provider: string }>>(
      `${base(websiteId)}/providers/${provider}/sync`,
    ),

  seoVitals: (websiteId: string, params?: ReportParams) =>
    cmsApiClient.get<ApiResponse<SeoVitalsResponse>>(`${base(websiteId)}/seo/vitals`, { params }),

  providerTotals: (websiteId: string, provider: string) =>
    cmsApiClient.get<ApiResponse<{ provider: string; totals: Record<string, number> }>>(
      `${base(websiteId)}/providers/${provider}/totals`,
    ),

  providerBreakdown: (websiteId: string, provider: string, params: ReportParams) =>
    cmsApiClient.get<ApiResponse<BreakdownResponse>>(`${base(websiteId)}/providers/${provider}/breakdown`, { params }),

  moduleTotals: (websiteId: string, params: ReportParams) =>
    cmsApiClient.get<ApiResponse<ModuleTotalsResponse>>(`${base(websiteId)}/totals`, { params }),

  infra: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<InfraResponse>>(`${base(websiteId)}/infra`),

  anomalies: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<AnomaliesResponse>>(`${base(websiteId)}/anomalies`),

  providerState: (websiteId: string) =>
    cmsApiClient.get<ApiResponse<ProviderStateResponse>>(`${base(websiteId)}/providers/state`),
};

export interface Anomaly {
  kind: string;
  severity: string;
  metric: string | null;
  observed: number;
  expected: number;
  deviationPct: number;
  detectedAt: string;
}

export interface AnomaliesResponse {
  anomalies: Anomaly[];
}

export interface ProviderSyncState {
  provider: string;
  watermark: string | null;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  rowsWritten: number;
  callsToday: number;
}

export interface ProviderStateResponse {
  providers: ProviderSyncState[];
}

export interface ModuleTotalsResponse {
  range: DateRange;
  module: string;
  totals: Record<string, number>;
}

export interface InfraResponse {
  queues: Record<string, Record<string, number> | { error: string }>;
  events24h: number;
  partitions: number;
}

export interface CoreWebVitals {
  lcp: number;
  cls: number;
  inp: number;
  samples: number;
}

export interface SeoVitalsResponse {
  range: DateRange;
  vitals: CoreWebVitals;
}
