import apiClient from './client';
import { authClient } from './client';
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

export const organizationsApi = {
  list: (params?: PaginationParams & { plan?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<OrgSummary>>('/admin/organizations', { params }),

  get: (id: string) => apiClient.get<ApiResponse<OrgDetail>>(`/admin/organizations/${id}`),

  create: (payload: CreateOrgPayload) =>
    apiClient.post<ApiResponse<OrgSummary>>('/admin/organizations', payload),

  update: (id: string, payload: Partial<CreateOrgPayload>) =>
    apiClient.patch<ApiResponse<OrgSummary>>(`/admin/organizations/${id}`, payload),

  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/admin/organizations/${id}`),

  suspend: (id: string, reason: string) =>
    apiClient.post<ApiResponse<OrgSummary>>(`/admin/organizations/${id}/suspend`, { reason }),

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
