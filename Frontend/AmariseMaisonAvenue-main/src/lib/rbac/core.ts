import { MaisonUser } from "./mock-users";
import { Permission } from "./permissions";
import { rolePermissions } from "./role-permissions";
import { logAccess } from "./logger";

/**
 * @fileOverview Core logic for permission validation.
 */

/**
 * Checks if a user has a specific functional permission.
 */
export function hasPermission(
  user: MaisonUser,
  permission: Permission
): boolean {
  const perms =
    rolePermissions[user.role as keyof typeof rolePermissions] || [];

  // Super admin override
  if (perms.includes("*")) return true;

  return perms.includes(permission);
}

/**
 * Checks if a user has geographic jurisdiction over a resource.
 */
export function canAccessCountry(
  user: MaisonUser,
  resourceCountry: string
): boolean {
  if (user.role === "super_admin") return true;
  if (user.country === "GLOBAL") return true;

  return user.country === resourceCountry;
}

/**
 * Combined validation: Does the user have the skill AND the right location?
 */
export function canPerform(
  user: MaisonUser,
  permission: Permission,
  resourceCountry?: string
): boolean {
  const hasPerm = hasPermission(user, permission);
  const hasGeo = resourceCountry
    ? canAccessCountry(user, resourceCountry)
    : true;

  const granted = hasPerm && hasGeo;

  logAccess(user.id, permission as string, granted, resourceCountry);

  return granted;
}
