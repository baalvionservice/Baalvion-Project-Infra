'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { authApi } from '@/lib/api/auth';
import { refreshAccessToken } from '@/lib/api/client';

const PUBLIC_PATHS = ['/login', '/mfa', '/forgot-password', '/reset-password'];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, isTokenExpired, setTokens, setUser, setOrgs, setCurrentOrg, setHydrated } =
    useAuthStore();
  const bootstrapped = useRef(false);

  // ── Silent session restore on app start (replaces the removed localStorage persist) ──────────
  // Attempt a cookie refresh; if it succeeds, load the profile + orgs into the in-memory store.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    let cancelled = false;

    (async () => {
      // Skip if we already have a live token (e.g. just logged in this tab).
      if (useAuthStore.getState().isAuthenticated()) {
        if (!cancelled) setHydrated(true);
        return;
      }
      try {
        // Shared single-flight refresh — coalesces with any interceptor-driven refresh
        // so a rotated refresh token is never reused (which would revoke the session).
        const accessToken = await refreshAccessToken();
        if (cancelled || !accessToken) {
          if (!cancelled) setHydrated(true);
          return;
        }
        try {
          const me = await authApi.me();
          if (!cancelled) setUser(me.data.data);
          const orgs = await authApi.getOrgs();
          if (!cancelled) {
            const list = orgs.data.data ?? [];
            setOrgs(list);
            if (list[0]) setCurrentOrg(list[0]);
          }
        } catch {
          /* token is valid; profile enrichment is best-effort */
        }
      } catch {
        /* no valid refresh cookie → remain unauthenticated */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setTokens, setUser, setOrgs, setCurrentOrg, setHydrated]);

  // ── Redirect logic (only after hydration completes) ──────────────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const authenticated = isAuthenticated();

    if (!authenticated && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (authenticated && isPublic) {
      router.replace('/dashboard');
    }
  }, [isHydrated, pathname, router, isAuthenticated, isTokenExpired]);

  return <>{children}</>;
}
