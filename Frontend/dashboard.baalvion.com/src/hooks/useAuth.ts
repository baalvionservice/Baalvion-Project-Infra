'use client';

import { useEffect, useState, useCallback } from 'react';
import { tokenStore, authApi, bootstrapSession, type DashAuthUser } from '@/lib/api-client';
import { realtimeClient } from '@/lib/realtime-client';

export interface UseAuthReturn {
  user: DashAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<DashAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent session restore on mount: refresh via httpOnly cookie → /me. No storage reads.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await bootstrapSession();
      if (cancelled) return;
      setUser(restored);
      setIsLoading(false);

      const token = tokenStore.getAccess();
      if (token && restored && !realtimeClient.connected) {
        realtimeClient.connect(token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      tokenStore.set(tokens);
      setUser(tokens.user);

      // Realtime needs a token; BFF holds none in JS, so connect only if one is present (legacy).
      if (tokens.accessToken) realtimeClient.connect(tokens.accessToken);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors, still clear tokens
    } finally {
      tokenStore.clear();
      realtimeClient.disconnect();
      setUser(null);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };
}
