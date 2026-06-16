"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { isProtectedPath } from "@/lib/auth-paths";

/**
 * App-wide authentication boundary, mounted once in the root layout.
 *
 * Every PROTECTED route (see {@link isProtectedPath}) is wrapped in <ProtectedRoute>, so an
 * unauthenticated user is redirected to /auth/login and NEVER renders an authenticated page
 * shell. This closes the edge-middleware gap where a dotted dynamic segment
 * (e.g. `/analytics/domains/example.com`) matched the static-asset exclusion and slipped the
 * cookie gate. Public routes render straight through, preserving their SSR/SEO.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  // `usePathname` returns "" before the router is ready; an empty path is non-public, so it
  // fails closed (gated) rather than briefly exposing a shell.
  const pathname = usePathname() ?? "";
  if (isProtectedPath(pathname)) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }
  return <>{children}</>;
}
