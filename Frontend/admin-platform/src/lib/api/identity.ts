import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type {
  RbacRole, ApiKey, JwksKey, SsoConfig, MfaPolicy, RiskEvent, LoginHeatmapEntry, DeviceInfo,
} from '@/lib/types/identity.types';

export const identityApi = {
  // RBAC roles
  listRoles: () =>
    adminApiClient.get<ApiResponse<RbacRole[]>>('/identity/roles'),

  getRole: (id: string) =>
    adminApiClient.get<ApiResponse<RbacRole>>(`/identity/roles/${id}`),

  createRole: (data: Partial<RbacRole>) =>
    adminApiClient.post<ApiResponse<RbacRole>>('/identity/roles', data),

  updateRole: (id: string, data: Partial<RbacRole>) =>
    adminApiClient.patch<ApiResponse<RbacRole>>(`/identity/roles/${id}`, data),

  deleteRole: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/identity/roles/${id}`),

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
