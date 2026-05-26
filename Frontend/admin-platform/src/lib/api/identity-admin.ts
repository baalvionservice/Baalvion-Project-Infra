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
};
