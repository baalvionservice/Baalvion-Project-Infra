
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types/contracts';

const TOKEN_KEY = 'baalvion_jobs_token';
const BASE_URL  = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000/v1/auth';

// Decode JWT payload without signature check (browser-side, token validity
// is enforced by the server on every API call)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setTokens, clearAuth, setIsLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      // Token missing or expired — clear and let login page handle it
      clearAuth();
      return;
    }

    // Restore user from token payload immediately so UI renders without flash
    const restoredUser = {
      id:        String(payload.sub ?? payload.id ?? ''),
      name:      String(payload.email ?? ''),
      fullName:  String(payload.email ?? ''),
      email:     String(payload.email ?? ''),
      avatarUrl: '',
      role:      (String(payload.role ?? 'CANDIDATE').toUpperCase()) as UserRole,
      isActive:  true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic restore — then validate against server in the background
    setTokens(restoredUser, token);

    // Validate token server-side and enrich user data
    const meUrl = BASE_URL.replace('/auth', '/users/me');
    fetch(meUrl, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const u = data?.data ?? data;
        const enriched = {
          ...restoredUser,
          id:        String(u.id ?? restoredUser.id),
          name:      String(u.name ?? u.fullName ?? restoredUser.name),
          fullName:  String(u.name ?? u.fullName ?? restoredUser.fullName),
          email:     String(u.email ?? restoredUser.email),
          avatarUrl: String(u.avatarUrl ?? ''),
          role:      (String(u.role ?? restoredUser.role).toUpperCase()) as UserRole,
          isActive:  u.status === 'active' || u.isActive === true,
        };
        setTokens(enriched, token);
      })
      .catch(() => { /* server down — keep optimistic state */ });
  }, [setTokens, clearAuth, setIsLoading]);

  return <>{children}</>;
};
