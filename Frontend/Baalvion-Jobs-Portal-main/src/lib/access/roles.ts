/**
 * Pure role helpers — safe to import from both client and server (no React,
 * no stores, no Node APIs). Single source of truth for mapping a backend role
 * string to the portal `UserRole` and deciding admin access.
 */
import { type UserRole, ALL_ADMIN_ROLES } from './access.types';

const ROLE_MAP: Record<string, UserRole> = {
  OWNER: 'SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'ADMIN',
  RECRUITER: 'RECRUITER',
  INTERVIEWER: 'INTERVIEWER',
  FINANCE: 'FINANCE',
  CONTRACTOR: 'CONTRACTOR',
  CLIENT: 'CLIENT',
  CANDIDATE: 'CANDIDATE',
  MEMBER: 'CANDIDATE',
  VIEWER: 'CANDIDATE',
};

/** Map a raw backend role string to the portal UserRole (defaults to CANDIDATE). */
export function normalizeRole(raw: string): UserRole {
  return ROLE_MAP[(raw ?? '').toUpperCase()] ?? 'CANDIDATE';
}

/** True when the (raw) role resolves to a role permitted in the admin panel. */
export function isAdminRole(raw: string): boolean {
  return ALL_ADMIN_ROLES.includes(normalizeRole(raw));
}
