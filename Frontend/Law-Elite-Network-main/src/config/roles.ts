/**
 * @fileOverview Professional Role Definitions for Law Elite Network.
 */
export const ROLES = {
  CLIENT: "client",
  LAWYER: "lawyer",
  ADMIN: "admin",
} as const;

export type UserRoleType = typeof ROLES[keyof typeof ROLES];
