import { adminApiClient } from './client';
import type { AdminUser, UserDetail, UpdateUserPayload, SuspendUserPayload, RemovedUser } from '@/lib/types/user.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type { UserRole } from '@/lib/types/auth.types';

// admin-service (:3021) is the identity domain backend. It queries auth.users directly
// and returns snake_case rows inside { success, data: { items, total, page, limit, hasMore } }.
// We normalize to the camelCase AdminUser + PaginatedResponse the console renders.

interface RawUser {
  id: string | number;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  status?: string;
  email_verified_at?: string | null;
  mfa_enabled?: boolean;
  role?: string | null;
  org_count?: number;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
  memberships?: Array<{ orgId: string; role: string; joinedAt: string }>;
}

interface RawPage<T> { items: T[]; total: number; page: number; limit: number; hasMore: boolean }

const toAdminUser = (u: RawUser): AdminUser => ({
  id: Number(u.id),
  email: u.email,
  fullName: u.full_name ?? '',
  avatarUrl: u.avatar_url ?? null,
  status: (u.status ?? 'active') as AdminUser['status'],
  emailVerifiedAt: u.email_verified_at ?? null,
  mfaEnabled: !!u.mfa_enabled,
  role: (u.role ?? u.memberships?.[0]?.role ?? 'member') as UserRole,
  orgCount: u.org_count ?? u.memberships?.length ?? 0,
  lastLoginAt: u.last_login_at ?? null,
  createdAt: u.created_at ?? new Date().toISOString(),
  updatedAt: u.updated_at ?? u.created_at ?? new Date().toISOString(),
});

export const usersApi = {
  list: async (params?: PaginationParams & { status?: string; role?: string }) => {
    const res = await adminApiClient.get<ApiResponse<RawPage<RawUser>>>('/admin/users', {
      params: {
        page:   params?.page,
        limit:  params?.limit,
        search: params?.search || undefined,
        status: params?.status || undefined,
      },
    });
    const d = res.data.data;
    const items = (d.items ?? []).map(toAdminUser);
    const limit = d.limit ?? params?.limit ?? items.length;
    const page  = d.page ?? params?.page ?? 1;
    const total = d.total ?? items.length;
    const body: PaginatedResponse<AdminUser> = {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
        hasNext: !!d.hasMore,
        hasPrev: page > 1,
      },
    };
    return { ...res, data: body };
  },

  /**
   * Change a person's ORG role — the one the access token carries and authz reads.
   * The server enforces the rank guards; the UI only narrows the choices it offers.
   */
  changeRole: async (id: number, role: string) => {
    const res = await adminApiClient.patch<
      ApiResponse<{ userId: string; previousRole?: string; role: string; sessionsRevoked?: boolean }>
    >(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },

  get: async (id: number) => {
    const res = await adminApiClient.get<ApiResponse<RawUser>>(`/admin/users/${id}`);
    const u = res.data.data;
    const detail: UserDetail = {
      ...toAdminUser(u),
      orgs: (u.memberships ?? []).map((m) => ({
        id: m.orgId, name: m.orgId, slug: '', role: m.role as UserRole, joinedAt: m.joinedAt,
      })),
      sessions: [],
      auditSummary: { totalActions: 0, lastAction: null },
    };
    return { ...res, data: { ...res.data, data: detail } };
  },

  update: (id: number, payload: UpdateUserPayload) =>
    adminApiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, payload),

  suspend: (id: number, payload: SuspendUserPayload) =>
    adminApiClient.post<ApiResponse<{ message: string }>>(`/admin/users/${id}/suspend`, payload),

  unsuspend: (id: number) =>
    adminApiClient.post<ApiResponse<{ message: string }>>(`/admin/users/${id}/unsuspend`),

  delete: (id: number) => adminApiClient.delete<ApiResponse<void>>(`/admin/users/${id}`),

  /** Soft-remove: blocks sign-in, signs them out, revokes business access. History is kept. */
  remove: (id: number, reason?: string) =>
    adminApiClient.post<ApiResponse<{ id: string; deleted: boolean }>>(`/admin/users/${id}/remove`, { reason }),

  restore: (id: number) =>
    adminApiClient.post<ApiResponse<{ id: string; restored: boolean }>>(`/admin/users/${id}/restore`),

  listRemoved: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await adminApiClient.get<ApiResponse<RawPage<{
      id: string | number; email: string; full_name?: string | null;
      removed_at?: string | null; removed_by?: string | null; reason?: string | null;
    }>>>('/admin/users/removed', { params });
    const d = res.data.data;
    const items: RemovedUser[] = (d.items ?? []).map((u) => ({
      id: Number(u.id),
      email: u.email,
      fullName: u.full_name ?? '',
      removedAt: u.removed_at ?? null,
      removedBy: u.removed_by ?? null,
      reason: u.reason ?? null,
    }));
    return { items, total: d.total ?? items.length, page: d.page ?? 1, limit: d.limit ?? items.length };
  },

  sendVerification: (id: number) =>
    adminApiClient.post<ApiResponse<void>>(`/admin/users/${id}/send-verification`),

  revokeSessions: (id: number) =>
    adminApiClient.post<ApiResponse<void>>(`/admin/users/${id}/revoke-sessions`),

  exportCsv: (params?: PaginationParams) =>
    adminApiClient.get('/admin/users/export', { params, responseType: 'blob' }),
};
