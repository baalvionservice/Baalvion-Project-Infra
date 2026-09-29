// Types for the RBAC service (:3055) — the single source of truth for the admin hierarchy.
// This module is a pure client of RBAC; it owns NO permission logic of its own.

export type RbacScopeType = 'platform' | 'country' | 'organization';
export type RbacTenantType = 'platform' | 'country' | 'organization';

export interface RbacTenant {
  id: string;
  type: RbacTenantType;
  parentId: string | null;
  externalRef: string | null; // country tenant → ISO-2 code; store tenant → storeId
  name: string;
  slug: string;
  status: string;
  attributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RbacRole {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  description?: string | null;
  scopeType: RbacScopeType;
  level: number;
  isSystem: boolean;
  isAssignable: boolean;
  status: string;
}

export interface RbacAssignmentRole {
  id: string;
  key: string;
  name: string;
  level: number;
  scopeType: RbacScopeType;
}

export interface RbacAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  scopeType: RbacScopeType;
  scopeId: string;
  grantedBy?: string | null;
  status: string;
  expiresAt?: string | null;
  role?: RbacAssignmentRole;
}

export interface RbacEffectivePermission {
  key: string;
  effect: 'allow' | 'deny';
  constraints?: Record<string, unknown>;
  viaRole: string;
  scopeId: string;
}

export interface RbacPerScope {
  scopeType: RbacScopeType;
  level: number;
  roles: string[];
}

export interface RbacEffective {
  userId: string;
  roles: string[];
  maxLevel: number;
  perScope: Record<string, RbacPerScope>;
  permissions: RbacEffectivePermission[];
}

export interface AssignRolePayload {
  userId: string;
  roleId: string;
  scopeId: string;
  expiresAt?: string;
}

// Canonical commerce role keys — MUST match backend commerceAuthz.COMMERCE_STORE_ROLES.
export const COUNTRY_ADMIN_ROLE_KEY = 'country_admin';
export const STORE_TEAM_ROLE_KEYS = [
  'store_admin',
  'product_manager',
  'seo_manager',
  'ops_manager',
  'store_viewer',
] as const;
export type StoreTeamRoleKey = (typeof STORE_TEAM_ROLE_KEYS)[number];
