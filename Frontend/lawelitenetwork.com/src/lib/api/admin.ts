"use client";

/**
 * Admin API client for the Law Elite Network console.
 * Talks to law-service `/v1/admin/*` (registry-driven CRUD + moderation + broadcast).
 * Uses the shared authenticated axios instance, so it inherits the in-memory bearer token.
 */
import { apiClient, getToken } from "./client";

export type AdminResource =
  | "lawyers" | "clients" | "users" | "cases" | "bookings" | "payments"
  | "subscriptions" | "reviews" | "articles" | "categories" | "subcategories"
  | "notifications" | "referrals" | "messages" | "documents" | "audit";

export interface Pagination {
  total: number; page: number; limit: number; totalPages: number;
}
export interface Paginated<T = any> { items: T[]; pagination: Pagination; }

export interface DashboardStats {
  lawyers: { total: number; active: number; pending: number };
  clients: { total: number };
  bookings: { total: number; pending: number; completed: number };
  cases: { total: number; open: number };
  payments: { total: number; succeeded: number; totalRevenue: number };
  articles: { total: number; published: number };
  reviews: { total: number };
  subscriptions: { total: number; active: number };
}

export interface Analytics {
  bookingsByStatus: { status: string; count: string }[];
  casesByCategory: { category: string | null; count: string }[];
  revenueByMonth: { month: string; revenue: string }[];
}

const unwrap = (res: any) => res?.data?.data;

export type ListParams = {
  page?: number; limit?: number; search?: string; sort?: string; order?: "ASC" | "DESC";
  [filter: string]: string | number | boolean | undefined;
};

export const adminApi = {
  dashboard: async (): Promise<DashboardStats> => unwrap(await apiClient.get("/admin/dashboard")),
  analytics: async (params?: { from?: string; to?: string }): Promise<Analytics> =>
    unwrap(await apiClient.get("/admin/analytics", { params })),

  list: async <T = any>(resource: AdminResource, params?: ListParams): Promise<Paginated<T>> =>
    unwrap(await apiClient.get(`/admin/${resource}`, { params })),
  get: async <T = any>(resource: AdminResource, id: string | number): Promise<T> =>
    unwrap(await apiClient.get(`/admin/${resource}/${id}`)),
  create: async <T = any>(resource: AdminResource, body: Record<string, unknown>): Promise<T> =>
    unwrap(await apiClient.post(`/admin/${resource}`, body)),
  update: async <T = any>(resource: AdminResource, id: string | number, body: Record<string, unknown>): Promise<T> =>
    unwrap(await apiClient.patch(`/admin/${resource}/${id}`, body)),
  remove: async (resource: AdminResource, id: string | number): Promise<{ deleted: boolean; id: string }> =>
    unwrap(await apiClient.delete(`/admin/${resource}/${id}`)),

  // ── Moderation / lifecycle actions ──────────────────────────────────────────
  verifyLawyer: async (id: string | number) => unwrap(await apiClient.post(`/admin/lawyers/${id}/verify`)),
  suspendLawyer: async (id: string | number) => unwrap(await apiClient.patch(`/admin/lawyers/${id}/suspend`)),
  activateLawyer: async (id: string | number) => unwrap(await apiClient.patch(`/admin/lawyers/${id}/activate`)),
  setUserStatus: async (id: string | number, status: "active" | "suspended") =>
    unwrap(await apiClient.patch(`/admin/users/${id}/status`, { status })),
  refundPayment: async (id: string | number) => unwrap(await apiClient.post(`/admin/payments/${id}/refund`)),
  publishArticle: async (id: string | number) => unwrap(await apiClient.post(`/admin/articles/${id}/publish`)),
  archiveArticle: async (id: string | number) => unwrap(await apiClient.post(`/admin/articles/${id}/archive`)),
  cancelSubscription: async (id: string | number) => unwrap(await apiClient.patch(`/admin/subscriptions/${id}/cancel`)),
  broadcast: async (body: { title: string; message: string; type?: string; audience?: "all" | "lawyers" | "clients" }) =>
    unwrap(await apiClient.post("/admin/notifications/broadcast", body)),
};

/**
 * Robust admin check that tolerates both the canonical token (`roles: []`) and the
 * legacy single `role` claim. Used by the console guard so it works regardless of
 * which issuer minted the in-memory token.
 */
export function tokenIsAdmin(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const claims = JSON.parse(atob(token.split(".")[1] || ""));
    const roles: string[] = Array.isArray(claims.roles)
      ? claims.roles
      : claims.role ? [claims.role] : [];
    return roles.some((r) => ["admin", "owner", "super_admin"].includes(r));
  } catch {
    return false;
  }
}
