import { adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

export type PlatformStatus = 'online' | 'down' | 'unreachable' | 'not_configured' | 'not_deployed';

export interface PlatformEntry {
  key: string;
  name: string;
  domain: string;
  adminUrl: string | null;
  status: PlatformStatus;
  latencyMs: number | null;
  version: string | null;
  lastDeploy?: string | null;
  hasRevenueSource: boolean;
}

// Every platform's real billing model is shaped differently (subscription-metered SaaS vs.
// org-based commerce) — fields are present only when the source genuinely reports them.
// Never backfill a missing field with 0 or an estimate; omit it.
export interface PlatformRevenueEntry {
  key: string;
  name: string;
  available: boolean;
  reason?: string;
  data?: {
    mrr?: number | null;
    arr?: number | null;
    customers?: number | null;
    activeSubscriptions?: number | null;
    newSubscriptions?: number | null;
    churn?: number | null;
    lifetimeRevenue?: number | null;
    arpu?: number | null;
    revenueGrowth?: number | null;
    sourceBreakdown?: Array<{ source: string; amount: number }> | null;
  };
}

export interface PlatformRevenueRollup {
  platforms: PlatformRevenueEntry[];
}

export const platformRegistryApi = {
  list: () => adminApiClient.get<ApiResponse<PlatformEntry[]>>('/admin/platforms'),
  revenue: () => adminApiClient.get<ApiResponse<PlatformRevenueRollup>>('/admin/platforms/revenue'),
};
