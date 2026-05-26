import { Role, ROLES } from "../roles/system";

/**
 * @fileOverview Consolidated Institutional Identity Registry.
 * The absolute source of truth for Maison personnel and session defaults.
 */

export interface MaisonUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: string; // 'global' or lowercase country code ('us', 'uk', 'ae', 'in', 'sg')
}

export const users: MaisonUser[] = [
  {
    id: "u-super",
    name: "Julian Vandervilt",
    email: "julian@amarise-luxe.com",
    role: ROLES.SUPER_ADMIN,
    country: "global",
  },
  {
    id: "u-admin-us",
    name: "Hub Lead (USA)",
    email: "admin.us@amarise-luxe.com",
    role: ROLES.COUNTRY_ADMIN,
    country: "us",
  },
  {
    id: "u-admin-uk",
    name: "Hub Lead (UK)",
    email: "admin.uk@amarise-luxe.com",
    role: ROLES.COUNTRY_ADMIN,
    country: "uk",
  },
  {
    id: "u-admin-ae",
    name: "Hub Lead (UAE)",
    email: "admin.ae@amarise-luxe.com",
    role: ROLES.COUNTRY_ADMIN,
    country: "ae",
  },
  {
    id: "u-admin-in",
    name: "Hub Lead (India)",
    email: "admin.in@amarise-luxe.com",
    role: ROLES.COUNTRY_ADMIN,
    country: "in",
  },
  {
    id: "u-admin-sg",
    name: "Hub Lead (Singapore)",
    email: "admin.sg@amarise-luxe.com",
    role: ROLES.COUNTRY_ADMIN,
    country: "sg",
  },
  {
    id: "u-client-1",
    name: "Julian Vandervilt",
    email: "julian@vandervilt.com",
    role: ROLES.CLIENT,
    country: "us",
  },
  {
    id: "u-op-us",
    name: "US Registry Operator",
    email: "ops.us@amarise-luxe.com",
    role: ROLES.OPERATIONS_ADMIN,
    country: "us",
  },
];

/**
 * Primary session default for institutional testing.
 */
export const MOCK_SESSION_USER = users[0];
