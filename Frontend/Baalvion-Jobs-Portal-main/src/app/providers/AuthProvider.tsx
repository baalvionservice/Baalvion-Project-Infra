
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types/contracts';
import { refresh as authRefresh, decodeJwt } from '@/lib/authClient';
import { setTokens as setApiAccessToken } from '@/lib/apiClient';

const BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

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
        role:      String(roles[0] ?? 'candidate').toUpperCase() as UserRole,
        isActive:  true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic restore — then enrich from the server.
      setTokens(restoredUser, token);

      const meUrl = BASE_URL.replace('/auth', '/users/me');
      try {
        const res = await fetch(meUrl, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
        const data = res.ok ? await res.json() : null;
        if (!data || cancelled) return;
        const u = data?.data ?? data;
        setTokens({
          ...restoredUser,
          id:        String(u.id ?? restoredUser.id),
          name:      String(u.name ?? u.fullName ?? restoredUser.name),
          fullName:  String(u.name ?? u.fullName ?? restoredUser.fullName),
          email:     String(u.email ?? restoredUser.email),
          avatarUrl: String(u.avatarUrl ?? ''),
          role:      String(u.role ?? restoredUser.role).toUpperCase() as UserRole,
          isActive:  u.status === 'active' || u.isActive === true,
        }, token);
      } catch {
        /* server down — keep optimistic state */
      }
    })();

    return () => { cancelled = true; };
  }, [setTokens, clearAuth, setIsLoading]);

  return <>{children}</>;
};
