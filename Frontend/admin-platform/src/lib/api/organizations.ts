import { adminApiClient, authClient } from './client';
import type {
  OrgSummary,
  OrgDetail,
  OrgMember,
  Invitation,
  CreateOrgPayload,
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from '@/lib/types/organization.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';

// admin-service (:3021) /admin/orgs returns snake_case orgs (with owner_* joined) inside
// { success, data: { items, total, page, limit, hasMore } }. Normalize to OrgSummary.
interface RawOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string | number;
  member_count?: number;
  created_at: string;
  owner_email?: string | null;
  owner_name?: string | null;
  owner_avatar?: string | null;
}

const toOrgSummary = (o: RawOrg): OrgSummary => ({
  id: String(o.id),
  name: o.name,
  slug: o.slug,
  plan: o.plan,
  logoUrl: null,
  memberCount: o.member_count ?? 0,
  status: 'active',
  createdAt: o.created_at,
  owner: {
    id: Number(o.owner_id),
    email: o.owner_email ?? '',
    fullName: o.owner_name ?? o.owner_email ?? '—',
    avatarUrl: o.owner_avatar ?? null,
  },
});

export const organizationsApi = {
  list: async (params?: PaginationParams & { plan?: string; status?: string }) => {
    const res = await adminApiClient.get<ApiResponse<{ items: RawOrg[]; total: number; page: number; limit: number; hasMore: boolean }>>(
      '/admin/orgs',
      { params: { page: params?.page, limit: params?.limit, search: params?.search || undefined, plan: params?.plan || undefined } },
    );
    const d = res.data.data;
    const items = (d.items ?? []).map(toOrgSummary);
    const limit = d.limit ?? params?.limit ?? items.length;
    const page  = d.page ?? params?.page ?? 1;
    const total = d.total ?? items.length;
    const body: PaginatedResponse<OrgSummary> = {
      success: true,
      data: items,
      pagination: {
        page, limit, total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
        hasNext: !!d.hasMore,
        hasPrev: page > 1,
      },
    };
    return { ...res, data: body };
  },

  get: (id: string) => adminApiClient.get<ApiResponse<OrgDetail>>(`/admin/orgs/${id}`),

  create: (payload: CreateOrgPayload) =>
    adminApiClient.post<ApiResponse<OrgSummary>>('/admin/orgs', payload),

  update: (id: string, payload: Partial<CreateOrgPayload>) =>
    adminApiClient.patch<ApiResponse<OrgSummary>>(`/admin/orgs/${id}`, payload),

  delete: (id: string) => adminApiClient.delete<ApiResponse<void>>(`/admin/orgs/${id}`),

  suspend: (id: string, reason: string) =>
    adminApiClient.post<ApiResponse<OrgSummary>>(`/admin/orgs/${id}/suspend`, { reason }),

  members: (orgId: string) =>
    authClient.get<ApiResponse<OrgMember[]>>(`/orgs/${orgId}/members`),

  invite: (orgId: string, payload: InviteMemberPayload) =>
    authClient.post<ApiResponse<Invitation>>(`/orgs/${orgId}/invite`, payload),

  updateMember: (orgId: string, userId: number, payload: UpdateMemberRolePayload) =>
    authClient.patch<ApiResponse<OrgMember>>(`/orgs/${orgId}/members/${userId}`, payload),

  removeMember: (orgId: string, userId: number) =>
    authClient.delete<ApiResponse<void>>(`/orgs/${orgId}/members/${userId}`),

  invitations: (orgId: string) =>
    authClient.get<ApiResponse<Invitation[]>>(`/orgs/${orgId}/invitations`),

  cancelInvitation: (orgId: string, invitationId: string) =>
    authClient.delete<ApiResponse<void>>(`/orgs/${orgId}/invitations/${invitationId}`),
};
