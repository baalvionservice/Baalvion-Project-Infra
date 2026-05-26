/**
 * @fileOverview Consolidated Institutional Access Registry.
 * High-level guard functions for components and actions.
 */

import { canPerform } from "../permissions/core";
import { MaisonUser } from "../permissions/mock-users";

export interface GuardResponse {
  success: boolean;
  error?: string;
}

/**
 * Functional Action Guard
 * Used to protect function calls within the app.
 */
export function guardAction(
  user: MaisonUser | null,
  permission: string,
  country?: string
): GuardResponse {
  const isAllowed = canPerform(user, permission, country);
  
  if (!isAllowed) {
    return { 
      success: false, 
      error: `Security Violation: Insufficient clearance for ${permission} in ${country || 'Global'} node.` 
    };
  }

  return { success: true };
}

/**
 * Route Visibility Guard
 * Used for high-level page and section protection.
 */
export function guardPage(
  user: MaisonUser | null,
  permission: string,
  country?: string
): boolean {
  return canPerform(user, permission, country);
}

/**
 * Access Auditing Utility
 */
export function logAccessAttempt(
  user: MaisonUser | null,
  permission: string,
  country: string | undefined,
  status: "GRANTED" | "DENIED"
) {
  const userName = user?.name || "Anonymous";
  const statusColor = status === "GRANTED" ? "color: #10b981;" : "color: #ef4444;";
  
  console.log(
    `%c[SECURITY] %cStatus: ${status} %c| User: ${userName} | Perm: ${permission} | Node: ${country || "GLOBAL"}`,
    "color: #D4AF37; font-weight: bold;",
    statusColor,
    "color: #6b7280;"
  );
}
