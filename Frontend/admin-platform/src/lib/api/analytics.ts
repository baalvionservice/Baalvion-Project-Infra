import { adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

export interface KpiMetrics {
  totalUsers: number;
  totalOrgs: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  userGrowth: number;
  orgGrowth: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ServiceHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  action: string;
  actor: { id: number; email: string; fullName: string; avatarUrl: string | null };
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const analyticsApi = {
  kpis: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<KpiMetrics>>('/admin/analytics/kpis', { params: { period } }),

  userGrowth: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<ChartDataPoint[]>>('/admin/analytics/users/growth', {
      params: { period },
    }),

  orgGrowth: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<ChartDataPoint[]>>('/admin/analytics/orgs/growth', {
      params: { period },
    }),

  revenue: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<ChartDataPoint[]>>('/admin/analytics/revenue', {
      params: { period },
    }),

  serviceHealth: () =>
    adminApiClient.get<ApiResponse<ServiceHealth[]>>('/admin/analytics/services/health'),

  recentActivity: (limit?: number) =>
    adminApiClient.get<ApiResponse<ActivityEvent[]>>('/admin/analytics/activity', {
      params: { limit },
    }),

  trafficByPage: (period?: '7d' | '30d') =>
    adminApiClient.get<ApiResponse<Array<{ page: string; views: number; uniqueVisitors: number }>>>(
      '/admin/analytics/traffic',
      { params: { period } },
    ),
};
