/**
 * @fileOverview Role definitions for the Maison platform.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COUNTRY_ADMIN: "country_admin",
  OPERATOR: "operator",
  VENDOR: "vendor",
  CLIENT: "client",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
