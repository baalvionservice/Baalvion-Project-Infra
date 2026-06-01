// Thin client for the RBAC service (:3055). EVERY call goes to RBAC — this module never
// writes to commerce or any other DB. Mutations are authorized by RBAC (requireScopeAdmin)
// against the forwarded caller token; the frontend is never an authority layer.
import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  RbacTenant,
  RbacRole,
  RbacAssignment,
  RbacEffective,
  AssignRolePayload,
} from '@/lib/types/rbac.types';

const client = serviceClients.rbac;

export const rbacApi = {
  tenants: {
    listCountries: () =>
      client.get<ApiResponse<RbacTenant[]>>('/tenants', { params: { type: 'country' } }),
    listStoresUnder: (countryTenantId: string) =>
      client.get<ApiResponse<RbacTenant[]>>('/tenants', {
        params: { type: 'organization', parentId: countryTenantId },
      }),
    get: (id: string) => client.get<ApiResponse<RbacTenant>>(`/tenants/${id}`),
  },

  roles: {
    list: () =>
      client.get<ApiResponse<RbacRole[]>>('/roles', { params: { includeSystem: true } }),
    listByKey: (key: string) =>
      client.get<ApiResponse<RbacRole[]>>('/roles', { params: { key, includeSystem: true } }),
  },

  assignments: {
    listByScope: (scopeId: string) =>
      client.get<ApiResponse<RbacAssignment[]>>('/assignments', {
        params: { scopeId, status: 'active' },
      }),
    listByUser: (userId: string) =>
      client.get<ApiResponse<RbacAssignment[]>>('/assignments', {
        params: { userId, status: 'active' },
      }),
    create: (payload: AssignRolePayload) =>
      client.post<ApiResponse<RbacAssignment>>('/assignments', payload),
    revoke: (id: string) =>
      client.delete<ApiResponse<{ id: string; revoked: boolean }>>(`/assignments/${id}`),
  },

  users: {
    effective: (userId: string, scopeId?: string) =>
      client.get<ApiResponse<RbacEffective>>(`/users/${userId}/effective`, {
        params: scopeId ? { scopeId } : undefined,
      }),
  },
};
