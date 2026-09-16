import { adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

// Mission Control — the per-property status rollup.
//
// Every field here is measured, never inferred. A probe that could not run reports
// 'not_configured' or 'unknown' and the UI renders a dash; the one thing an operations panel
// must never do is show a green tick it did not earn.

export type ProbeStatus =
  | 'up'
  | 'degraded'
  | 'down'
  | 'not_deployed'
  | 'not_configured'
  | 'no_rails'
  | 'unknown';

export interface ProbeCell {
  status: ProbeStatus;
  latencyMs: number | null;
  detail?: Record<string, unknown> | null;
  changedAt?: string | null;
  checkedAt?: string | null;
  lastOkAt?: string | null;
}

export interface ServiceCell extends ProbeCell {
  name: string;
  tier?: string;
  container?: string;
  port?: number;
  /** 'not-deployed' means nothing runs it — it is absent, not broken. */
  deployment?: string;
}

export interface StatusIncident {
  id: number;
  target_id: string;
  kind: string;
  site_id: string | null;
  severity: 'critical' | 'warning' | 'info';
  status?: 'open' | 'resolved';
  cause: string | null;
  opened_at: string;
  resolved_at?: string | null;
  /** Null with an alert_error set means the incident was recorded but no phone buzzed. */
  alert_sent_at: string | null;
  alert_error: string | null;
}

/** One findability assertion about a live property, as measured — never inferred. */
export interface SeoCheck {
  id: string;
  label: string;
  ok: boolean;
  severity: 'critical' | 'warning' | 'info';
  detail?: string;
}

export interface SeoCell extends ProbeCell {
  detail?: {
    domain?: string;
    servedHost?: string;
    redirectedTo?: string | null;
    canonical?: string | null;
    httpStatus?: number;
    sitemapsDeclared?: number | null;
    aiCrawlersBlocked?: number | null;
    checks?: SeoCheck[];
    failing?: number;
    reason?: string;
  } | null;
}

export interface SiteStatus {
  id: string;
  name: string;
  domain: string | null;
  siteStatus: 'live' | 'not_live' | string;
  rails: string[];
  railsBasis?: string;
  overall: ProbeStatus;
  pills: {
    website: ProbeCell;
    auth: ProbeCell;
    payments: ProbeCell;
    services: { status: ProbeStatus };
    data: ProbeCell;
  };
  services: ServiceCell[];
  /** Findability. Reported next to the property, never folded into `overall`. */
  seo?: SeoCell;
  incidents: StatusIncident[];
}

export interface StatusRollup {
  generatedAt: string;
  lastSweepAt: string | null;
  sites: SiteStatus[];
  platform: Array<ProbeCell & { id: string; kind: string; name: string }>;
  unattachedServices: ServiceCell[];
  openIncidents: number;
  alerting: { channel: string; configured: boolean; heartbeat: boolean };
}

export interface TargetHistory {
  targetId: string;
  kind: string;
  samples: number;
  /** Null when no probe ran in the window — never 100%, which would claim unmeasured uptime. */
  uptimePct: number | null;
  avgLatencyMs: number | null;
  lastCheckedAt: string;
}

export interface SiteHistory {
  siteId: string;
  windowHours: number;
  targets: TargetHistory[];
  incidents: StatusIncident[];
}

export const statusApi = {
  rollup: () => adminApiClient.get<ApiResponse<StatusRollup>>('/admin/status/sites'),

  history: (siteId: string, hours = 24) =>
    adminApiClient.get<ApiResponse<SiteHistory>>(`/admin/status/sites/${siteId}/history`, {
      params: { hours },
    }),

  incidents: (status: 'open' | 'resolved' | 'all' = 'open') =>
    adminApiClient.get<ApiResponse<StatusIncident[]>>('/admin/status/incidents', {
      params: { status },
    }),

  /** Proves the last hop actually reaches a phone — the step most monitoring setups never verify. */
  testAlert: () => adminApiClient.post<ApiResponse<{ sent: boolean; error?: string }>>('/admin/status/test-alert'),
};
