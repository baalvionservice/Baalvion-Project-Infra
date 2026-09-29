import type { UserRole } from '@/lib/types/auth.types';
import type { ActionType, ResourceType } from '@/lib/types/common.types';

type PermissionMatrix = Partial<Record<ResourceType, ActionType[]>>;

const ROLE_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  super_admin: {
    users: ['create', 'read', 'update', 'delete', 'manage'],
    organizations: ['create', 'read', 'update', 'delete', 'manage'],
    cms: ['create', 'read', 'update', 'delete', 'manage'],
    media: ['create', 'read', 'update', 'delete', 'manage'],
    analytics: ['read', 'manage'],
    payments: ['read', 'update', 'manage'],
    audit_logs: ['read', 'manage'],
    feature_flags: ['create', 'read', 'update', 'delete', 'manage'],
    notifications: ['create', 'read', 'update', 'delete', 'manage'],
    settings: ['read', 'update', 'manage'],
  },
  owner: {
    users: ['create', 'read', 'update', 'delete'],
    organizations: ['read', 'update', 'manage'],
    cms: ['create', 'read', 'update', 'delete'],
    media: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    payments: ['read'],
    audit_logs: ['read'],
    feature_flags: ['read', 'update'],
    notifications: ['create', 'read', 'update'],
    settings: ['read', 'update'],
  },
  admin: {
    users: ['create', 'read', 'update'],
    organizations: ['read', 'update'],
    cms: ['create', 'read', 'update', 'delete'],
    media: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    payments: ['read'],
    audit_logs: ['read'],
    feature_flags: ['read'],
    notifications: ['create', 'read', 'update'],
    settings: ['read'],
  },
  manager: {
    users: ['read', 'update'],
    organizations: ['read'],
    cms: ['create', 'read', 'update'],
    media: ['create', 'read', 'update'],
    analytics: ['read'],
    payments: ['read'],
    audit_logs: ['read'],
    notifications: ['read'],
  },
  editor: {
    cms: ['create', 'read', 'update'],
    media: ['create', 'read', 'update'],
  },
  member: {
    cms: ['read'],
    media: ['read'],
  },
  viewer: {
    cms: ['read'],
    analytics: ['read'],
  },
  support: {
    users: ['read'],
    audit_logs: ['read'],
    notifications: ['create', 'read'],
  },
  developer: {
    feature_flags: ['read', 'update'],
    analytics: ['read'],
    audit_logs: ['read'],
  },
  analyst: {
    analytics: ['read'],
    audit_logs: ['read'],
  },
  finance: {
    payments: ['read'],
    analytics: ['read'],
  },
  compliance: {
    cms: ['read', 'update'],
    audit_logs: ['read', 'manage'],
    users: ['read'],
    analytics: ['read'],
  },
  moderator: {
    cms: ['read', 'update', 'delete'],
    media: ['read', 'update'],
    users: ['read'],
  },
  readonly: {
    cms: ['read'],
    analytics: ['read'],
  },
};

export const hasPermission = (
  role: UserRole,
  resource: ResourceType,
  action: ActionType,
): boolean => {
  const perms = ROLE_PERMISSIONS[role];
  return perms[resource]?.includes(action) ?? false;
};

export const getResourcePermissions = (role: UserRole, resource: ResourceType): ActionType[] =>
  ROLE_PERMISSIONS[role][resource] ?? [];

export { ROLE_PERMISSIONS };
