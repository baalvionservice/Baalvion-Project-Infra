
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types/contracts';
import { refresh as authRefresh, decodeJwt } from '@/lib/authClient';
import { setTokens as setApiAccessToken } from '@/lib/apiClient';
import { getPortalProfile } from '@/services/adapters/server/auth.server';

const BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

// Org owners are top-level admins in the portal RBAC.
/**
 * Map an identity-service role onto a portal role.
 *
 * `OWNER` deliberately does NOT map to SUPER_ADMIN any more. Registration creates an
 * organization and makes the registrant its owner, so EVERY signed-up user holds `owner` —
 * which meant every new account was optimistically a portal super-admin, and stayed one
 * whenever the profile call that corrects it failed (see "jobs-service down" below).
 * Verified 2026-09-05: a fresh /register issues roles: ['owner'].
 *
 * Portal authority now comes from the centrally-granted `businesses.jobs` claim, or from the
 * portal profile. An org role alone grants nothing here.
 */
export const normRole = (raw: string): UserRole => {
  const u = (raw || '').toUpperCase();
  if (u === 'MANAGER') return 'ADMIN';
  if (u === 'MEMBER' || u === 'VIEWER' || u === 'OWNER') return 'CANDIDATE';
  return (u || 'CANDIDATE') as UserRole;
};

/**
 * The role granted for THIS product in the admin console, carried in the access token as
 * `businesses.jobs`. One grant, honoured everywhere — the portal no longer has to infer
 * authority from an org role that says nothing about jobs.
 *
 * Returns null when no grant exists, so the caller falls back to the portal profile.
 */
export const businessRole = (payload: Record<string, unknown>): UserRole | null => {
  const businesses = payload.businesses as Record<string, string> | undefined;
  const granted = businesses?.jobs;
  return granted ? normRole(String(granted)) : null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setTokens, clearAuth, setIsLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Restore the session from the httpOnly refresh cookie (no localStorage token).
      const token = await authRefresh();
      if (cancelled) return;
      if (!token) {
        clearAuth();
        setIsLoading(false);
        return;
      }
      setApiAccessToken(token); // access token in memory

      const payload = decodeJwt(token);
      // A grant made in the admin console wins. Without one the optimistic role is CANDIDATE —
      // the LEAST privilege — because this state persists if the profile call below fails, and
      // failing open into an admin role is exactly how the OWNER→SUPER_ADMIN bug bit.
      const grantedRole = businessRole(payload as Record<string, unknown>);
      const restoredUser = {
        id:        String(payload.sub ?? ''),
        name:      String(payload.email ?? ''),
        fullName:  String(payload.email ?? ''),
        email:     String(payload.email ?? ''),
        avatarUrl: '',
        role:      grantedRole ?? 'CANDIDATE',
        isActive:  true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic restore — then enrich with the real portal identity (role + candidateId)
      // from the jobs-service (auth tokens only ever say "owner").
      setTokens(restoredUser, token);

      try {
        const profile = await getPortalProfile();
        if (!profile || cancelled) return;
        setTokens({
          ...restoredUser,
          id:        String(profile.userId ?? restoredUser.id),
          name:      String(profile.name ?? restoredUser.name),
          fullName:  String(profile.name ?? restoredUser.fullName),
          email:     String(profile.email ?? restoredUser.email),
          // An explicit console grant is authoritative; the portal profile only fills the gap
          // when there is none. Otherwise revoking centrally would be undone by stale local state.
          role:      grantedRole ?? normRole(String(profile.role ?? restoredUser.role)),
          candidateId: profile.candidateId ?? null,
          isActive:  true,
        }, token);
      } catch {
        /* jobs-service down — keep optimistic state */
      }
    })();

    return () => { cancelled = true; };
  }, [setTokens, clearAuth, setIsLoading]);

  return <>{children}</>;
};
