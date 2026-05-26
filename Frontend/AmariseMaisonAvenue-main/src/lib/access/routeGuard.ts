/**
 * @fileOverview High-level guard for protecting page views and routes.
 */

import { canPerform } from "../permissions/core";
import { MaisonUser } from "../rbac/mock-users";
import { PERMISSIONS } from "../permissions/engine";

export function guardPage(
  user: MaisonUser | null,
  permission: string,
  country?: string
): boolean {
  return canPerform(user, permission, country);
}
