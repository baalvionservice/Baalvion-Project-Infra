import { AppPermission } from './permissionRegistry';

/**
 * Route Policy Registry
 * Maps application paths to required permissions.
 */
export const ROUTE_POLICIES: Record<string, AppPermission> = {
  '/dashboard': 'VIEW_DASHBOARD',
  '/data-room': 'VIEW_DATA_ROOM',
  '/admin': 'VIEW_ADMIN_PANEL',
  '/phase2': 'VIEW_DASHBOARD',
  '/phase3': 'VIEW_DASHBOARD',
  '/governance/my-voting': 'VOTE_RESOLUTION',
};

/**
 * Helper to find if a path requires a permission
 */
export function getRequiredPermissionForRoute(pathname: string): AppPermission | null {
  // Check direct matches first
  if (ROUTE_POLICIES[pathname]) return ROUTE_POLICIES[pathname];

  // Check prefix matches (e.g. /admin/dashboard matches /admin)
  for (const [route, permission] of Object.entries(ROUTE_POLICIES)) {
    if (pathname.startsWith(route)) return permission;
  }

  return null;
}
