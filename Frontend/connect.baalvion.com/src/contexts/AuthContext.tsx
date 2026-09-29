'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { brandTokenStore, AUTH_URL } from '@/lib/api-client';

/**
 * Baalvion Connect Auth Context.
 *
 * SINGLE production auth path: email/password against the identity gateway (auth-service via the
 * same-origin `/auth-bff` proxy). Access token in memory (brandTokenStore); refresh token in the
 * httpOnly `baalvion_refresh` cookie. The previous Firebase transitional code, the `signInAs`
 * mock role-switcher, and the forgeable client role cookies have all been REMOVED.
 */
interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob((token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function userFromToken(token: string): User | null {
  const c = decodeJwt(token);
  if (!c) return null;
  return {
    id: String(c.sub ?? c.id ?? ''),
    email: (c.email as string) ?? '',
    role: ((c.role as UserRole) ?? 'BRAND') as UserRole,
    displayName: (c.name as string) ?? (c.email as string) ?? '',
    status: 'ACTIVE',
    isVerified: Boolean(c.email_verified ?? c.emailVerified ?? false),
    tourCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Silent session restore via the httpOnly refresh cookie (no storage reads, no mock).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${AUTH_URL}/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (cancelled || !res.ok) return;
        const json = await res.json().catch(() => ({}));
        const data = json.data ?? json;
        const at: string | undefined = data.accessToken ?? data.token;
        if (at) {
          brandTokenStore.set(at);
          setCurrentUser(userFromToken(at));
        }
      } catch {
        /* not authenticated */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Invalid credentials.');
      }
      const data = json.data ?? json;
      const at: string | undefined = data.accessToken ?? data.token;
      if (!at) throw new Error('Login failed.');
      brandTokenStore.set(at);
      setCurrentUser(userFromToken(at));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Registration failed.');
      }
      const data = json.data ?? json;
      const at: string | undefined = data.accessToken ?? data.token;
      if (!at) throw new Error('Registration failed.');
      brandTokenStore.set(at);
      setCurrentUser(userFromToken(at));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* best-effort; cookie cleared server-side */
    }
    brandTokenStore.clear();
    setCurrentUser(null);
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
  }, []);

  const refreshUser = useCallback(async () => {
    const token = brandTokenStore.getAccess();
    if (token) setCurrentUser(userFromToken(token));
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signOut, refreshUser, loginWithEmail, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
