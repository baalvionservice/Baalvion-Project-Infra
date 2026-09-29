import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  users:          { total: number };
  orgs:           { total: number };
  activeSessions: number;
  last24h: {
    logins:       number;
    failedLogins: number;
  };
  loginTrend: Array<{ date: string; success: number; failed: number }>;
}

export interface AdminUser {
  id:               string;
  email:            string;
  full_name:        string;
  avatar_url:       string | null;
  status:           'active' | 'suspended' | 'pending';
  email_verified_at: string | null;
  mfa_enabled:      boolean;
  created_at:       string;
  memberships?:     Array<{ orgId: string; role: string; joinedAt: string }>;
}

export interface AdminOrg {
  id:           string;
  name:         string;
  slug:         string;
  plan:         string;
  owner_id:     string;
  member_count: number;
  created_at:   string;
}

export interface ImpersonationResult {
  token:          string;
  expiresIn:      number;
  impersonationId: string;
  targetUser:     { id: string; email: string };
}

export interface AdminSession {
  id:           string;
  user_id:      string;
  org_id:       string | null;
  ip_address:   string;
  user_agent:   string;
  created_at:   string;
  last_seen_at: string;
  expires_at:   string;
  email:        string;
  full_name:    string;
}

export interface AdminAuditLog {
  id:            string;
  user_id:       string;
  org_id:        string | null;
  action:        string;
  resource_type: string | null;
  resource_id:   string | null;
  metadata:      Record<string, unknown>;
  ip_address:    string;
  user_agent:    string | null;
  severity:      string | null;
  created_at:    string;
}

/**
 * One sign-in event, from the canonical auth audit stream.
 *
 * `site` is the property it happened on. `null` means the request carried no Origin at all
 * (server-to-server, OAuth callbacks) — genuinely unknown, not "baalvion". Render it as such;
 * auth-service deliberately does not guess.
 */
export interface LoginEvent {
  id:          string;
  event_type:  'login_success' | 'login_failure';
  app_id:      string | null;
  user_id:     string | null;
  org_id:      string | null;
  session_id:  string | null;
  ip_address:  string | null;
  user_agent:  string | null;
  severity:    string | null;
  metadata:    Record<string, unknown>;
  created_at:  string;
  user_email:  string | null;
  user_name:   string | null;
  user_avatar: string | null;
}

/** Per-site totals. `site` is 'unknown' for the NULL bucket — that is the filter value too. */
export interface LoginSiteRollup {
  site:          string;
  logins:        number;
  failures:      number;
  users:         number;
  last_seen_at:  string | null;
}

export interface LoginActivity {
  items:   LoginEvent[];
  total:   number;
  page:    number;
  limit:   number;
  hasMore: boolean;
  sites:   LoginSiteRollup[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const identityAdminApi = {
  getStats: () =>
    adminApiClient.get<ApiResponse<PlatformStats>>('/admin/stats'),

  listUsers: (params?: PaginationParams & { search?: string; status?: string }) =>
    adminApiClient.get<ApiResponse<{ items: AdminUser[]; total: number; page: number; limit: number }>>('/admin/users', { params }),

  getUser: (userId: string) =>
    adminApiClient.get<ApiResponse<AdminUser>>(`/admin/users/${userId}`),

  suspendUser: (userId: string) =>
    adminApiClient.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/suspend`),

  unsuspendUser: (userId: string) =>
    adminApiClient.post<ApiResponse<{ message: string }>>(`/admin/users/${userId}/unsuspend`),

  impersonateUser: (userId: string) =>
    adminApiClient.post<ApiResponse<ImpersonationResult>>(`/admin/users/${userId}/impersonate`),

  listOrgs: (params?: PaginationParams & { search?: string; plan?: string }) =>
    adminApiClient.get<ApiResponse<{ items: AdminOrg[]; total: number }>>('/admin/orgs', { params }),

  listAllSessions: (params?: PaginationParams & { userId?: string; orgId?: string }) =>
    adminApiClient.get<ApiResponse<{ items: AdminSession[]; total: number }>>('/admin/sessions', { params }),

  revokeSession: (sessionId: string) =>
    adminApiClient.delete<ApiResponse<{ message: string }>>(`/admin/sessions/${sessionId}`),

  getAuditLogs: (params?: PaginationParams & {
    orgId?: string; userId?: string; action?: string; severity?: string; from?: string; to?: string;
  }) =>
    adminApiClient.get<ApiResponse<{ items: AdminAuditLog[]; total: number }>>('/admin/audit-logs', { params }),

  /** Sign-in activity across every property. `site: 'unknown'` selects the no-Origin bucket. */
  getLoginActivity: (params?: PaginationParams & {
    site?: string; event?: 'login_success' | 'login_failure'; userId?: string; from?: string; to?: string;
  }) =>
    adminApiClient.get<ApiResponse<LoginActivity>>('/admin/login-activity', { params }),
};
