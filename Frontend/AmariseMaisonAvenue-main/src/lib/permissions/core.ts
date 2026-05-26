import { rolePermissions } from "./rolePermissions";
import { MaisonUser } from "./mock-users";
import { Permission } from "./engine";

/**
 * @fileOverview Refined core logic for permission validation and real-time access control.
 * Handles both Functional (can I do X?) and Geographic (can I do X in Hub Y?) validation.
 */

/**
 * Functional permission check.
 */
export function hasFunctionPermission(user: MaisonUser | null, permission: string): boolean {
  if (!user) return false;
  const perms = rolePermissions[user.role] || [];
  
  // Super Admin wildcard override
  if (perms.includes("*")) return true;
  
  return perms.includes(permission as Permission);
}

/**
 * Geographic jurisdiction check (Hub Isolation).
 */
export function hasGeographicJurisdiction(user: MaisonUser | null, resourceCountry?: string): boolean {
  if (!user) return false;
  
  // Super Admins and Global Operators bypass geographic isolation
  if (user.role === "super_admin" || user.country.toLowerCase() === "global") {
    return true;
  }

  // Regional users are strictly isolated to their country code
  if (resourceCountry) {
    return user.country.toLowerCase() === resourceCountry.toLowerCase();
  }

  return true;
}

/**
 * Combined Institutional Access Validation
 */
export function canPerform(user: MaisonUser | null, permission: string, resourceCountry?: string): boolean {
  const funcOk = hasFunctionPermission(user, permission);
  const geoOk = hasGeographicJurisdiction(user, resourceCountry);
  
  const granted = funcOk && geoOk;

  if (!granted && user) {
    console.warn(`%c[SECURITY] Access Denied: User ${user.name} on ${permission} in ${resourceCountry || 'global'} hub.`, "color: #ef4444; font-weight: bold;");
  }

  return granted;
}
