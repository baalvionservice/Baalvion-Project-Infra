/**
 * @fileOverview Guard for protecting functional actions and API calls.
 */

import { canPerform } from "../permissions/core";
import { MaisonUser } from "../rbac/mock-users";

export interface GuardResponse {
  success: boolean;
  error?: string;
}

export function guardAction(
  user: MaisonUser | null,
  permission: string,
  country?: string
): GuardResponse {
  const isAllowed = canPerform(user, permission, country);
  
  if (!isAllowed) {
    return { success: false, error: `Insufficient permissions for: ${permission}` };
  }

  return { success: true };
}
