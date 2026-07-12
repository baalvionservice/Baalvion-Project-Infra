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

  activationFunnel: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<Array<{ step: string; count: number }>>>(
      '/admin/analytics/funnel',
      { params: { period } },
    ),

  retentionCohorts: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<Array<{ cohortWeek: string; cohortSize: number; retention: number[] }>>>(
      '/admin/analytics/retention',
      { params: { period } },
    ),

  signupChannels: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<Array<{ channel: string; count: number }>>>(
      '/admin/analytics/signup-channels',
      { params: { period } },
    ),

  geography: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<Array<{ country: string; users: number }>>>(
      '/admin/analytics/geography',
      { params: { period } },
    ),

  eventTypes: (period?: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<Array<{ event: string; count: number }>>>(
      '/admin/analytics/event-types',
      { params: { period } },
    ),

  paymentFunnel: () =>
    adminApiClient.get<ApiResponse<{ available: boolean; reason?: string; steps: Array<{ step: string; count: number }> }>>(
      '/admin/analytics/payment-funnel',
    ),
};
