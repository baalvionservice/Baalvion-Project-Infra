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
    admin: 'ADMIN',
    co_founder: 'CO_FOUNDER',
    cofounder: 'CO_FOUNDER',
    investor: 'INVESTOR',
    employee: 'EMPLOYEE',
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

export function getCurrentUser(): User | null {
  const authUser = tokenStore.getUser();
  if (!authUser) return null;
  return mapToUser(authUser);
}

export function logout(): void {
  tokenStore.clear();
}

export function isAuthenticated(): boolean {
  return tokenStore.getAccess() !== null && tokenStore.getUser() !== null;
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
