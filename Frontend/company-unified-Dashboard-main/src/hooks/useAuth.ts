'use client';

import { useEffect, useState, useCallback } from 'react';
import { tokenStore, authApi, type DashAuthUser } from '@/lib/api-client';
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

  // Initialise from localStorage on mount
  useEffect(() => {
    const storedUser = tokenStore.getUser();
    setUser(storedUser);
    setIsLoading(false);

    // Connect realtime if already authenticated
    const token = tokenStore.getAccess();
    if (token && storedUser && !realtimeClient.connected) {
      realtimeClient.connect(token);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      tokenStore.set(tokens);
      setUser(tokens.user);

      // Connect realtime WebSocket after successful login
      realtimeClient.connect(tokens.accessToken);
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
    isAuthenticated: user !== null && tokenStore.getAccess() !== null,
    isLoading,
    login,
    logout,
  };
}
