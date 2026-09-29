import apiClient from './client';

// Platform-owner billing admin — talks to proxy-service /v1/admin/billing/* (RS256, platform_admin).

export interface AdminSubscriptionRow {
  id: string;
  orgId: string;
  orgName: string;
  planSlug: string;
  planName: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string | null;
}

export interface SubscriptionSummary {
  total: number;
  byStatus: Record<string, number>;
  activeMrr: number;
}

export interface AdminPlan {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  bandwidthLimitGb: number;
  features: string[];
}

export interface AdminPlanInput {
  name?: string;
  monthlyPrice?: number;
  bandwidthLimitGb?: number;
  features?: string[];
}

export interface CustomerRevenue {
  orgId: string;
  orgName: string;
  planSlug: string;
  status: string;
  mrr: number;
  creditPurchased: number;
  lifetimeRevenue: number;
}

export interface RevenueTotals {
  mrr: number;
  creditRevenue: number;
  lifetimeRevenue: number;
  customers: number;
  arr: number;
}

export interface PlanRevenue {
  planSlug: string;
  customers: number;
  mrr: number;
  lifetimeRevenue: number;
  sharePct: number;
}

export interface RevenueReport {
  customers: CustomerRevenue[];
  totals: RevenueTotals;
  byPlan: PlanRevenue[];
}

export const adminBillingApi = {
  summary: () => apiClient.get('/admin/billing/subscriptions/summary'),
  revenue: () => apiClient.get('/admin/billing/revenue'),
  listSubscriptions: (params?: { page?: number; pageSize?: number; status?: string; q?: string }) =>
    apiClient.get('/admin/billing/subscriptions', { params }),
  changeOrgPlan: (orgId: string, planSlug: string) =>
    apiClient.post(`/admin/billing/subscriptions/${orgId}/change-plan`, { planSlug }),
  cancelOrg: (orgId: string) => apiClient.post(`/admin/billing/subscriptions/${orgId}/cancel`),
  listPlans: () => apiClient.get('/admin/billing/plans'),
  createPlan: (body: AdminPlanInput) => apiClient.post('/admin/billing/plans', body),
  updatePlan: (id: string, body: AdminPlanInput) => apiClient.patch(`/admin/billing/plans/${id}`, body),
  deletePlan: (id: string) => apiClient.delete(`/admin/billing/plans/${id}`),
};
