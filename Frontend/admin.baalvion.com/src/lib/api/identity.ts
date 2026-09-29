import { adminApiClient, serviceClients } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type {
  RbacRole, ApiKey, JwksKey, SsoConfig, MfaPolicy, RiskEvent, LoginHeatmapEntry, DeviceInfo,
} from '@/lib/types/identity.types';

// ── RBAC service (rbac-service, :3055) is the real source of truth for roles ────
// admin-service never implemented `GET /identity/roles` (404 — "reserved for future
// expansion"), so role reads target rbac-service via serviceClients.rbac and map its
// response shape to the RbacRole the Identity Center renders.
//
// rbac-service `GET /roles` returns a flat array under `data`:
//   { id, tenantId, key, name, description, scopeType, level, parentRoleId,
//     isSystem, isAssignable, status, attributes, metadata, createdBy, createdAt, updatedAt }
// The list endpoint does NOT include per-role permission grants or member counts, so
// those are surfaced honestly as empty (0) rather than fabricated.
interface RbacServiceRole {
  id: string;
  tenantId: string | null;
  key: string;
  name: string;
  description: string | null;
  scopeType: string;
  level: number;
  parentRoleId: string | null;
  isSystem: boolean;
  isAssignable: boolean;
  status: string;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

const toRbacRole = (r: RbacServiceRole): RbacRole => ({
  id:          r.id,
  name:        r.key,
  displayName: r.name,
  description: r.description ?? '',
  isSystem:    r.isSystem,
  permissions: [], // grants live on a separate endpoint (GET /roles/:id/permissions); not fetched in the list view
  memberCount: 0,  // assignment counts live on a separate endpoint; not fetched in the list view
  createdAt:   r.createdAt,
  updatedAt:   r.updatedAt,
});

export const identityApi = {
  // RBAC roles — backed by rbac-service (:3055), not admin-service.
  listRoles: () =>
    serviceClients.rbac
      .get<ApiResponse<RbacServiceRole[]>>('/roles')
      .then((res) => ({
        ...res,
        data: { ...res.data, data: (res.data.data ?? []).map(toRbacRole) } as ApiResponse<RbacRole[]>,
      })),

  getRole: (id: string) =>
    serviceClients.rbac
      .get<ApiResponse<RbacServiceRole>>(`/roles/${id}`)
      .then((res) => ({
        ...res,
        data: { ...res.data, data: res.data.data ? toRbacRole(res.data.data) : res.data.data } as ApiResponse<RbacRole>,
      })),

  createRole: (data: Partial<RbacRole>) =>
    serviceClients.rbac.post<ApiResponse<RbacRole>>('/roles', data),

  updateRole: (id: string, data: Partial<RbacRole>) =>
    serviceClients.rbac.patch<ApiResponse<RbacRole>>(`/roles/${id}`, data),

  deleteRole: (id: string) =>
    serviceClients.rbac.delete<ApiResponse<void>>(`/roles/${id}`),

  // API keys
  listApiKeys: (params?: PaginationParams & { orgId?: string; userId?: string; status?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<ApiKey>>>('/identity/api-keys', { params }),

  revokeApiKey: (id: string) =>
    adminApiClient.post<ApiResponse<void>>(`/identity/api-keys/${id}/revoke`),

  createApiKey: (data: { name: string; scopes: string[]; orgId?: string; expiresAt?: string }) =>
    adminApiClient.post<ApiResponse<ApiKey & { rawKey: string }>>('/identity/api-keys', data),

  // JWKS / signing keys
  listJwksKeys: () =>
    adminApiClient.get<ApiResponse<JwksKey[]>>('/identity/jwks'),

  rotateSigningKey: () =>
    adminApiClient.post<ApiResponse<JwksKey>>('/identity/jwks/rotate'),

  retireKey: (kid: string) =>
    adminApiClient.post<ApiResponse<void>>(`/identity/jwks/${kid}/retire`),

  // SSO
  listSsoConfigs: (params?: PaginationParams) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<SsoConfig>>>('/identity/sso', { params }),

  createSsoConfig: (data: Partial<SsoConfig>) =>
    adminApiClient.post<ApiResponse<SsoConfig>>('/identity/sso', data),

  updateSsoConfig: (id: string, data: Partial<SsoConfig>) =>
    adminApiClient.patch<ApiResponse<SsoConfig>>(`/identity/sso/${id}`, data),

  deleteSsoConfig: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/identity/sso/${id}`),

  // MFA policy
  getMfaPolicy: (orgId: string) =>
    adminApiClient.get<ApiResponse<MfaPolicy>>(`/identity/mfa-policy/${orgId}`),

  updateMfaPolicy: (orgId: string, data: Partial<MfaPolicy>) =>
    adminApiClient.put<ApiResponse<MfaPolicy>>(`/identity/mfa-policy/${orgId}`, data),

  // Risk events
  listRiskEvents: (params?: PaginationParams & { severity?: string; type?: string; resolved?: boolean }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<RiskEvent>>>('/identity/risk-events', { params }),

  resolveRiskEvent: (id: string) =>
    adminApiClient.post<ApiResponse<RiskEvent>>(`/identity/risk-events/${id}/resolve`),

  // Login heatmap
  getLoginHeatmap: (params?: { orgId?: string; days?: number }) =>
    adminApiClient.get<ApiResponse<LoginHeatmapEntry[]>>('/identity/analytics/login-heatmap', { params }),

  // Devices
  listDevices: (userId: string) =>
    adminApiClient.get<ApiResponse<DeviceInfo[]>>(`/identity/users/${userId}/devices`),

  revokeDevice: (userId: string, deviceId: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/identity/users/${userId}/devices/${deviceId}`),

  // Token revocation
  revokeAllUserTokens: (userId: string) =>
    adminApiClient.post<ApiResponse<{ revokedCount: number }>>(`/identity/users/${userId}/revoke-all-tokens`),

  revokeAllOrgTokens: (orgId: string) =>
    adminApiClient.post<ApiResponse<{ revokedCount: number }>>(`/identity/orgs/${orgId}/revoke-all-tokens`),
};
