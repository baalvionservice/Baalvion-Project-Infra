'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { evaluate, hasPermission, type AccessDecision, type AccessRequirement, type Principal } from './access';
import { policyFor } from './policy';
import { maxRoleLevel, isUnmappedConsoleRole } from './hierarchy';

/**
 * The console's authorization hook — one place every screen asks "may I?".
 *
 * Reads the FULL roles[] + permissions[] the access token carries, so its answers match
 * what auth-node will decide when the request actually lands.
 */
export function useAccess() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const principal = useMemo<Principal | null>(
    () => (user ? { roles: user.roles ?? [], permissions: user.permissions ?? [] } : null),
    [user],
  );

  return useMemo(
    () => ({
      principal,
      /** False until the silent cookie refresh has resolved — don't deny before then. */
      isReady: isHydrated,
      roles: principal?.roles ?? [],
      level: maxRoleLevel(principal?.roles ?? []),
      /** True when the user holds only roles the backend hierarchy doesn't know. */
      hasUnmappedRoleOnly:
        !!principal?.roles.length && principal.roles.every(isUnmappedConsoleRole),
      can: (permission: string) => (principal ? hasPermission(principal, permission) : false),
      check: (requirement: AccessRequirement): AccessDecision => evaluate(principal, requirement),
      checkRoute: (pathname: string): AccessDecision => {
        const policy = policyFor(pathname);
        // No rule → signed-in staff only. Never silently public.
        if (!policy) return evaluate(principal, { label: 'Signed-in staff' });
        return evaluate(principal, policy);
      },
    }),
    [principal, isHydrated],
  );
}

/** Decision for the route currently on screen. */
export function useRouteAccess(): AccessDecision & { isReady: boolean } {
  const pathname = usePathname();
  const { checkRoute, isReady } = useAccess();
  return useMemo(
    () => ({ ...checkRoute(pathname ?? '/'), isReady }),
    [checkRoute, pathname, isReady],
  );
}
