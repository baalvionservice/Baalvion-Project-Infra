
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types/contracts';
import { refresh as authRefresh, decodeJwt } from '@/lib/authClient';
import { setTokens as setApiAccessToken } from '@/lib/apiClient';
import { getPortalProfile } from '@/services/adapters/server/auth.server';

const BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

// Org owners are top-level admins in the portal RBAC.
const normRole = (raw: string): UserRole => {
  const u = (raw || '').toUpperCase();
  if (u === 'OWNER') return 'SUPER_ADMIN';
  if (u === 'MANAGER') return 'ADMIN';
  if (u === 'MEMBER' || u === 'VIEWER') return 'CANDIDATE';
  return (u || 'CANDIDATE') as UserRole;
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
      const roles: string[] = Array.isArray(payload.roles) ? payload.roles : payload.role ? [payload.role] : [];
      const restoredUser = {
        id:        String(payload.sub ?? ''),
        name:      String(payload.email ?? ''),
        fullName:  String(payload.email ?? ''),
        email:     String(payload.email ?? ''),
        avatarUrl: '',
        role:      normRole(String(roles[0] ?? 'candidate')),
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
          role:      normRole(String(profile.role ?? restoredUser.role)),
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
