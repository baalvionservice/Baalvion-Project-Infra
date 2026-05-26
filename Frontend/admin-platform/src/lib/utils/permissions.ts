import { hasPermission } from '@/lib/constants/permissions';
import type { UserRole } from '@/lib/types/auth.types';
import type { ActionType, ResourceType } from '@/lib/types/common.types';
import { ROLES } from '@/lib/constants/roles';

export const can = (
  role: UserRole | undefined,
  resource: ResourceType,
  action: ActionType,
): boolean => {
  if (!role) return false;
  return hasPermission(role, resource, action);
};

export const isAtLeast = (userRole: UserRole | undefined, minRole: UserRole): boolean => {
  if (!userRole) return false;
  return ROLES[userRole].level >= ROLES[minRole].level;
};

export const isAdminLevel = (role: UserRole | undefined): boolean =>
  isAtLeast(role, 'admin');

export const isSuperAdmin = (role: UserRole | undefined): boolean =>
  role === 'super_admin';
