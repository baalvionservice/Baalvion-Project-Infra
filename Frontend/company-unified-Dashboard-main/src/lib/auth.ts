/**
 * Auth utilities for company-unified-dashboard.
 * Delegates credential validation to proxy-backend via api-client.ts.
 * No passwords are stored in source code.
 */

import { tokenStore, type DashAuthUser, type DashAuthTokens } from './api-client';

export type Role = 'ADMIN' | 'INVESTOR' | 'CO_FOUNDER' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  imageId: string;
  orgId?: string;
}

function mapToUser(authUser: DashAuthUser): User {
  const roleMap: Record<string, Role> = {
    // Platform owner / super-admin → the full Admin panel.
    owner: 'ADMIN',
    super_admin: 'ADMIN',
    superadmin: 'ADMIN',
    admin: 'ADMIN',
    co_founder: 'CO_FOUNDER',
    cofounder: 'CO_FOUNDER',
    investor: 'INVESTOR',
    viewer: 'INVESTOR',     // read-only viewer → read-only metrics view
    employee: 'EMPLOYEE',
    member: 'EMPLOYEE',
    staff: 'EMPLOYEE',
  };
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    role: roleMap[authUser.role.toLowerCase()] ?? 'EMPLOYEE',
    imageId: `user-${authUser.id}`,
    orgId: authUser.orgId,
  };
}

export function setCurrentUser(tokens: DashAuthTokens): void {
  tokenStore.set(tokens);
}

/**
 * Update the in-memory profile from a mapped `User` (e.g. the client-side role-view switch).
 * Server-side RBAC remains authoritative — this only changes the local view.
 */
export function setCurrentUserProfile(user: User): void {
  tokenStore.setUser({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
  });
}

export function getCurrentUser(): User | null {
  const authUser = tokenStore.getUser();
  if (!authUser) return null;
  return mapToUser(authUser);
}

export function logout(): void {
  tokenStore.clear();
}

export function isAuthenticated(): boolean {
  // BFF model: identity (from /auth/me) — there is no JS-readable token to check.
  return tokenStore.getUser() !== null;
}

export function getUserRole(): Role | null {
  const user = getCurrentUser();
  return user?.role ?? null;
}

export function hasRole(requiredRole: Role): boolean {
  return getUserRole() === requiredRole;
}

export function hasAnyRole(roles: Role[]): boolean {
  const role = getUserRole();
  return role ? roles.includes(role) : false;
}
