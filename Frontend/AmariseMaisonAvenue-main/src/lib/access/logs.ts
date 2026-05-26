/**
 * @fileOverview Internal logging for the Access Validation Layer.
 */

import { MaisonUser } from "@/lib/rbac/mock-users";

export function logAccessAttempt(
  user: MaisonUser | null,
  permission: string,
  country: string | undefined,
  status: "GRANTED" | "DENIED"
) {
  const userName = user?.name || "Anonymous";
  const userRole = user?.role || "NONE";
  const targetCountry = country || "GLOBAL";

  console.log(
    `%c[ACCESS LOG] %cStatus: ${status} %c| User: ${userName} (${userRole}) | Perm: ${permission} | Country: ${targetCountry}`,
    "color: #D4AF37; font-weight: bold;",
    status === "GRANTED" ? "color: #10b981;" : "color: #ef4444;",
    "color: #6b7280;"
  );
}
