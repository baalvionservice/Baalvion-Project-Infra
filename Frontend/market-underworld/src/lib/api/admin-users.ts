// Authenticated admin-service reads/writes (platform user registry). Every call goes through
// the same-origin /api/admin-proxy/* bridge (see src/app/api/admin-proxy/[...path]/route.ts),
// which translates the httpOnly access_token cookie into the Bearer header admin-service's
// authMiddleware expects — mirrors lib/api/commerce-admin.ts's proxy convention. admin-service
// requires the caller to hold the super_admin role (enforced server-side by requireSuperAdmin).

const PROXY_BASE = '/api/admin-proxy';

// Columns come back verbatim from a raw SQL SELECT in admin-service (no camelCase mapping) —
// see Backend/services/platform/admin-service/service/adminService.js:listUsers.
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: 'active' | 'suspended' | string;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  memberships: { orgId: string; role: string; joinedAt: string }[];
}

export interface PlatformStats {
  userCount: { count: string };
  orgCount: { count: string };
  sessionCount: { count: string };
  recentLogins: { count: string };
  failedLogins: { count: string };
  loginTrend: { date: string; success: string; failed: string }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

interface ListUsersResult {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `admin API ${path} failed: ${res.status}`);
  }
  return body.data;
}

export async function listUsers(opts: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<ListUsersResult> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.search) params.set('search', opts.search);
  if (opts.status) params.set('status', opts.status);
  const qs = params.toString();
  return adminFetch<ListUsersResult>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  return adminFetch<AdminUserDetail>(`/admin/users/${userId}`);
}

export async function suspendUser(userId: string): Promise<void> {
  await adminFetch<{ message: string }>(`/admin/users/${userId}/suspend`, { method: 'POST' });
}

export async function unsuspendUser(userId: string): Promise<void> {
  await adminFetch<{ message: string }>(`/admin/users/${userId}/unsuspend`, { method: 'POST' });
}

export async function sendUserVerification(userId: string): Promise<void> {
  await adminFetch<{ message: string }>(`/admin/users/${userId}/send-verification`, { method: 'POST' });
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return adminFetch<PlatformStats>('/admin/stats');
}

export interface AdminSession {
  id: string;
  user_id: string;
  org_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  email: string;
  full_name: string | null;
}

interface PageResult<T> { items: T[]; total: number; page: number; limit: number; hasMore: boolean }

export async function listSessions(opts: { page?: number; limit?: number } = {}): Promise<PageResult<AdminSession>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return adminFetch<PageResult<AdminSession>>(`/admin/sessions${qs ? `?${qs}` : ''}`);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await adminFetch<{ message: string }>(`/admin/sessions/${sessionId}`, { method: 'DELETE' });
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  org_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

export async function getAuditLogs(opts: { page?: number; limit?: number; action?: string } = {}): Promise<PageResult<AuditLogEntry>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.action) params.set('action', opts.action);
  const qs = params.toString();
  return adminFetch<PageResult<AuditLogEntry>>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
}

export interface RiskEvent {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  details: Record<string, unknown>;
  resolvedAt: string | null;
  createdAt: string;
}

// getRiskEvents double-wraps its response — the service builds the whole {success,data,pagination}
// envelope itself and the controller nests THAT inside sendSuccess's own {success,data} shape (see
// Backend/services/platform/admin-service/controller/adminController.js:172-183). adminFetch already
// unwraps the outer envelope, so what it hands back here is the inner {success,data,pagination} object.
export async function listRiskEvents(opts: { page?: number; limit?: number } = {}): Promise<PageResult<RiskEvent>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const inner = await adminFetch<{ success: boolean; data: RiskEvent[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }>(`/identity/risk-events${qs ? `?${qs}` : ''}`);
  return { items: inner.data, total: inner.pagination.total, page: inner.pagination.page, limit: inner.pagination.limit, hasMore: inner.pagination.hasNext };
}

// ── Feature flags (platform-wide) ────────────────────────────────────────────────────────────
// Backs /admin/marketplace's "Industry Modules" toggle — see featureFlagsController.js. A real,
// general-purpose platform feature-flag store (key/enabled/rollout/targeting), not something
// invented for this UI.

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercent: number | null;
  createdAt: string;
}

export async function listFeatureFlags(opts: { page?: number; limit?: number } = {}): Promise<PageResult<FeatureFlag>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const res = await fetch(`${PROXY_BASE}/admin/feature-flags${qs ? `?${qs}` : ''}`, { credentials: 'include', cache: 'no-store' });
  const body = (await res.json().catch(() => ({}))) as { success: boolean; data: FeatureFlag[]; pagination: { page: number; limit: number; total: number; hasNext: boolean }; error?: { message: string } };
  if (!res.ok || body.success === false) throw new Error(body.error?.message || 'Failed to load feature flags');
  return { items: body.data, total: body.pagination.total, page: body.pagination.page, limit: body.pagination.limit, hasMore: body.pagination.hasNext };
}

export async function createFeatureFlag(body: { key: string; name: string; description?: string; enabled?: boolean }): Promise<FeatureFlag> {
  return adminFetch<FeatureFlag>('/admin/feature-flags', { method: 'POST', body: JSON.stringify(body) });
}

export async function setFeatureFlagEnabled(id: string, enabled: boolean): Promise<FeatureFlag> {
  return adminFetch<FeatureFlag>(`/admin/feature-flags/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
}
