// Platform-level admin roles. Mirrors the backend gate in
// proxy-service/middleware/permissionMiddleware.js (requirePlatformAdmin):
// platform_admin OR the strictly-higher super_admin may open the admin console.
export const PLATFORM_ADMIN_ROLES = new Set(["platform_admin", "super_admin"]);

export function isPlatformAdmin(role?: string | null): boolean {
  return !!role && PLATFORM_ADMIN_ROLES.has(role);
}
