"use client";

import { useState, useEffect, useCallback } from "react";
import { authService } from "@/core/services/auth.service";
import { UserRole } from "@/core/content/schemas";

/**
 * Institutional Auth Hook
 * Prepared for real session management (JWT/OIDC).
 */
export function useAuth() {
  const [role, setRole] = useState<UserRole>("public");
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const { role: currentRole } = await authService.getCurrentUser();
    setRole(currentRole);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-updated", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-updated", checkAuth);
    };
  }, [checkAuth]);

  const changeRole = (newRole: UserRole) => {
    authService.setRole(newRole);
  };

  const signOut = () => {
    authService.signOut();
  };

  return {
    role,
    isLoading,
    isAuthenticated: role !== "public",
    isAdmin: role === "admin",
    isCompliance: role === "compliance" || role === "ComplianceOfficer",
    changeRole,
    signOut,
    refresh: checkAuth,
  };
}
