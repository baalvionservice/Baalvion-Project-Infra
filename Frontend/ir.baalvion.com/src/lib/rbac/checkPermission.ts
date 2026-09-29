import { AppRole } from './roles';
import { AppPermission, PERMISSION_REGISTRY } from './permissionRegistry';

/**
 * Permission Resolver
 * Validates if a specific role has the required permission.
 */
export function checkPermission(role: AppRole, permission: AppPermission): boolean {
  const allowedRoles = PERMISSION_REGISTRY[permission];
  
  if (!allowedRoles) {
    console.error(`Permission ${permission} is not defined in registry.`);
    return false;
  }

  // Admin override: admins have access to all internal permissions
  if (role === 'admin') return true;

  return allowedRoles.includes(role);
}
