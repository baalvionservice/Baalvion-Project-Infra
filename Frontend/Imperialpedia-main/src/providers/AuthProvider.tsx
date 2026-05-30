'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authClient, { type AuthUser } from '@/lib/auth-client';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Bootstraps the Imperialpedia session on mount: exchanges the httpOnly `baalvion_refresh`
 * cookie for an in-memory access token (auth-client). Exposes auth state + login/logout to
 * the tree. The middleware still gates protected routes on the cookie; this drives the UI.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await authClient.refreshToken();
      if (!token) {
        setUser(null);
        return;
      }
      // Prefer the profile endpoint; fall back to whatever the token/login surfaced.
      const me = await authClient.getCurrentUser().catch(() => null);
      setUser(me ?? { id: 'me', email: '' });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authClient.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
