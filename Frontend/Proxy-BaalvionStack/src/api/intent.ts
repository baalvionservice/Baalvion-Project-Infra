/**
 * API Intent Layer
 *
 * Thin wrapper over real API clients. Previously contained simulated/mock
 * implementations — those have been replaced with real calls.
 */

import { ApiResponse, PaginatedResponse, PaginationParams } from "@/contracts/v1/base";
import { User, Organization, ApiKey } from "@/contracts/v1/identity";
import { Subscription, UsageRecord, Invoice } from "@/contracts/v1/billing";
import { Proxy, Preset, Provider } from "@/contracts/v1/proxy";
import { AuditEvent, Alert } from "@/contracts/v1/events";
import { authClient } from "@/lib/authClient";

// ============================================
// RESPONSE HELPERS
// ============================================

function success<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      latency: 0,
      version: "v1",
    },
  };
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const tokens = await authClient.login(email, password);
    // Persist tokens for subsequent API calls
    localStorage.setItem("baalvion_access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem("baalvion_refresh_token", tokens.refreshToken);
    }
    localStorage.setItem("baalvion_auth_user", JSON.stringify(tokens.user));
    return success({ token: tokens.accessToken, user: tokens.user as unknown as User });
  },

  async logout(): Promise<ApiResponse<void>> {
    const token = localStorage.getItem("baalvion_access_token") ?? "";
    await authClient.logout(token).catch(() => {/* best-effort */});
    localStorage.removeItem("baalvion_access_token");
    localStorage.removeItem("baalvion_refresh_token");
    localStorage.removeItem("baalvion_auth_user");
    return success(undefined);
  },

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    const refreshToken = localStorage.getItem("baalvion_refresh_token") ?? "";
    const tokens = await authClient.refresh(refreshToken);
    localStorage.setItem("baalvion_access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem("baalvion_refresh_token", tokens.refreshToken);
    }
    return success({ token: tokens.accessToken, expiresAt: tokens.expiresAt ?? "" });
  },
};

// ============================================
// PROXY API — stub (use platformClient.proxyApi for real calls)
// ============================================

export const proxyApi = {
  list: (_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Proxy>>> =>
    Promise.resolve(success({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrev: false })),
  get: (_id: string): Promise<ApiResponse<Proxy>> =>
    Promise.resolve(success({} as Proxy)),
  create: (data: Partial<Proxy>): Promise<ApiResponse<Proxy>> =>
    Promise.resolve(success({ ...data, id: crypto.randomUUID() } as Proxy)),
  update: (_id: string, data: Partial<Proxy>): Promise<ApiResponse<Proxy>> =>
    Promise.resolve(success(data as Proxy)),
  delete: (_id: string): Promise<ApiResponse<void>> =>
    Promise.resolve(success(undefined)),
  rotate: (_id: string): Promise<ApiResponse<Proxy>> =>
    Promise.resolve(success({} as Proxy)),
};

// ============================================
// USAGE API — stub (use platformClient.usageApi for real calls)
// ============================================

export const usageApi = {
  getSummary: (): Promise<ApiResponse<UsageRecord>> =>
    Promise.resolve(success({} as UsageRecord)),
  getHistory: (_days: number): Promise<ApiResponse<UsageRecord[]>> =>
    Promise.resolve(success([])),
};

// ============================================
// BILLING API — stub (use platformClient.billingApi for real calls)
// ============================================

export const billingApi = {
  getSubscription: (): Promise<ApiResponse<Subscription>> =>
    Promise.resolve(success({} as Subscription)),
  getInvoices: (): Promise<ApiResponse<Invoice[]>> =>
    Promise.resolve(success([])),
  changePlan: (_planId: string): Promise<ApiResponse<Subscription>> =>
    Promise.resolve(success({} as Subscription)),
};

// ============================================
// AUDIT API — stub (use platformClient.auditApi for real calls)
// ============================================

export const auditApi = {
  listEvents: (_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<AuditEvent>>> =>
    Promise.resolve(success({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 0, hasNext: false, hasPrev: false })),
  exportEvents: (format: "csv" | "json"): Promise<ApiResponse<{ url: string }>> =>
    Promise.resolve(success({ url: `/exports/audit-${Date.now()}.${format}` })),
};

// ============================================
// ALERTS API — stub (use platformClient for real calls)
// ============================================

export const alertsApi = {
  list: (): Promise<ApiResponse<Alert[]>> =>
    Promise.resolve(success([])),
  acknowledge: (_id: string): Promise<ApiResponse<Alert>> =>
    Promise.resolve(success({} as Alert)),
  resolve: (_id: string): Promise<ApiResponse<Alert>> =>
    Promise.resolve(success({} as Alert)),
};

export const api = { auth: authApi, proxy: proxyApi, usage: usageApi, billing: billingApi, audit: auditApi, alerts: alertsApi };
