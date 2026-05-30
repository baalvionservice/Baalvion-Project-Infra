import { adminApiClient } from './client';
import type { AdminUser, UserDetail, UpdateUserPayload, SuspendUserPayload } from '@/lib/types/user.types';
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

  sendVerification: (id: number) =>
    adminApiClient.post<ApiResponse<void>>(`/admin/users/${id}/send-verification`),

  revokeSessions: (id: number) =>
    adminApiClient.post<ApiResponse<void>>(`/admin/users/${id}/revoke-sessions`),

  exportCsv: (params?: PaginationParams) =>
    adminApiClient.get('/admin/users/export', { params, responseType: 'blob' }),
};
