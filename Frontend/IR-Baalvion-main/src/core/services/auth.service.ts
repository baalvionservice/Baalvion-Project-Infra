"use client";

import { UserRole } from "../content/schemas";
import irAuthClient from "@/lib/auth-client";

/**
 * Institutional Auth Service
 * Wraps the real JWT auth client (irAuthClient) while keeping the same exported
 * function signatures so all existing middleware and components continue to work.
 *
 * Migration notes:
 *  - getCurrentUser() now reads from a validated JWT first, falls back to cookie.
 *  - login() / logout() call the real proxy-backend.
 *  - setRole() is retained for demo/testing but is NOT the primary auth flow.
 *  - hasAccess() is unchanged — still the canonical RBAC utility.
 */
export const authService = {
  /**
   * Real primary auth — calls proxy-backend :4000/v1/auth/login.
   */
  login: async (email: string, password: string): Promise<{ role: UserRole }> => {
    const user = await irAuthClient.login(email, password);
    // Mirror the role into the legacy cookie so the existing middleware still works
    // during the JWT middleware transition period.
    if (typeof window !== "undefined") {
      document.cookie = `baalvion_session_mock=${user.role}; path=/; max-age=3600; samesite=lax`;
      localStorage.setItem("baalvion_user_role", user.role);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("auth-updated", { detail: { role: user.role } }));
    }
    return { role: user.role as UserRole };
  },

  /**
   * Real logout — calls proxy-backend and clears all tokens.
   */
  logout: async (): Promise<void> => {
    await irAuthClient.logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("baalvion_user_role");
      window.location.href = "/";
    }
  },

  getCurrentUser: async (): Promise<{ role: UserRole }> => {
    if (typeof window === "undefined") return { role: "public" as UserRole };

    // 1. Try the real JWT first
    if (irAuthClient.isAuthenticated()) {
      try {
        const user = await irAuthClient.getCurrentUser();
        if (user?.role) return { role: user.role as UserRole };
      } catch {
        // Fall through to cookie fallback
      }
    }

    // 2. Legacy cookie fallback (keeps middleware working during transition)
    const cookieRole = document.cookie
      .split("; ")
      .find((row) => row.startsWith("baalvion_session_mock="))
      ?.split("=")[1] as UserRole;

    const role =
      cookieRole ||
      (localStorage.getItem("baalvion_user_role") as UserRole) ||
      "public";
    return { role };
  },

  /**
   * @deprecated For demo/testing only. Use login() for real authentication.
   * Sets a role directly without backend validation — useful for local UI testing.
   */
  setRole: (role: UserRole) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("baalvion_user_role", role);
      document.cookie = `baalvion_session_mock=${role}; path=/; max-age=3600; samesite=lax`;
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(
        new CustomEvent("auth-updated", { detail: { role } })
      );
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
      authService.setRole("public");
      window.location.href = "/";
    });
  },
};
