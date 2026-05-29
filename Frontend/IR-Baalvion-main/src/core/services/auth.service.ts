"use client";

import { UserRole } from "../content/schemas";
import irAuthClient from "@/lib/auth-client";

/**
 * Institutional Auth Service
 * Thin wrapper over the real JWT auth client (irAuthClient) with stable signatures.
 *
 * SECURITY (P0 remediation): the forgeable `baalvion_session_mock` cookie and the
 * `baalvion_user_role` localStorage mirror have been REMOVED. Role is derived only from
 * the verified, in-memory access token. The frontend never trusts a client-written role.
 */
export const authService = {
  /** Real primary auth — calls auth-service via the same-origin /auth-bff proxy. */
  login: async (email: string, password: string): Promise<{ role: UserRole }> => {
    const user = await irAuthClient.login(email, password);
    if (typeof window !== "undefined") {
      // In-memory notification only — NOT persisted.
      window.dispatchEvent(new CustomEvent("auth-updated", { detail: { role: user.role } }));
    }
    return { role: user.role as UserRole };
  },

  /** Real logout — clears the server session (httpOnly cookie) and the in-memory token. */
  logout: async (): Promise<void> => {
    await irAuthClient.logout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  },

  getCurrentUser: async (): Promise<{ role: UserRole }> => {
    if (typeof window === "undefined") return { role: "public" as UserRole };

    if (irAuthClient.isAuthenticated()) {
      try {
        const user = await irAuthClient.getCurrentUser();
        if (user?.role) return { role: user.role as UserRole };
      } catch {
        /* fall through to guest */
      }
    }
    return { role: "public" as UserRole };
  },

  /**
   * @deprecated Demo/testing only. No longer persists a role (no cookie, no localStorage).
   * Dispatches an in-memory event so live UI can react within the session.
   */
  setRole: (role: UserRole) => {
    // Demo/testing only and DISABLED in production — no client-side role injection in prod builds.
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth-updated", { detail: { role } }));
    }
  },

  hasAccess: (resourceRoles: UserRole[], userRole: UserRole): boolean => {
    if (!resourceRoles || resourceRoles.length === 0) return true;
    if (userRole === "admin") return true;
    if (resourceRoles.includes("public")) return true;
    return resourceRoles.includes(userRole);
  },

  /** @deprecated Use logout() instead. Kept for backwards compatibility. */
  signOut: () => {
    authService.logout().catch(() => {
      if (typeof window !== "undefined") window.location.href = "/";
    });
  },
};
