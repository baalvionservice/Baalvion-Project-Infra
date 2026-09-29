"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserRole } from "@/lib/auth";
import { Role } from "@/lib/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

/**
 * Client route guard.
 *
 * SECURITY MODEL (P0): drives off the AuthProvider/useAuth silent-refresh BOOTSTRAP, not a raw
 * synchronous token read. On reload the in-memory access token starts null and is restored via the
 * httpOnly-cookie refresh — so we MUST wait for `isLoading` to settle before deciding, otherwise an
 * authenticated user would be falsely redirected (the partial-hydration race). Real authorization is
 * still enforced at the API; role checks here are UX gating only.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return; // wait for the silent-refresh bootstrap to complete

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles) {
      const userRole = getUserRole();
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.replace("/dashboard");
        return;
      }
    }

    setIsAuthorized(true);
  }, [isLoading, isAuthenticated, allowedRoles, redirectTo, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
