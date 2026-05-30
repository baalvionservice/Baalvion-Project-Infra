"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authLawApi, setToken, clearToken, getToken, TOKEN_KEY, silentRefresh, apiClient, setImpersonation, getImpersonation } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

export interface Impersonation { id: string; name?: string; role: UserRole; email?: string }

export type UserRole = 'admin' | 'lawyer' | 'client' | null;

interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  impersonating: Impersonation | null;
  startImpersonation: (target: { id: string; name?: string }) => Promise<Impersonation | null>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  login: async () => null,
  register: async () => {},
  logout: () => {},
  impersonating: null,
  startImpersonation: async () => null,
  stopImpersonation: async () => {},
});

function parseJwt(token: string): { id: string; email: string; role: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Resolve the authoritative LAW role (client | lawyer | admin) from law-service /auth/me.
// The identity token only carries org-roles (every user is an org "owner"); platform
// authorization is local to law-service, so the app role must come from /auth/me.
async function resolveLawRole(): Promise<{ role: UserRole; profile: any } | null> {
  try {
    const me = await authLawApi.me();
    const profile = me.data?.data || null;
    return { role: (profile?.role ?? 'client') as UserRole, profile };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonatingState] = useState<Impersonation | null>(null);

  const hydrateFromToken = async (token: string) => {
    const claims = parseJwt(token) as any;
    const resolved = await resolveLawRole();
    const lawRole = (resolved?.role ?? 'client') as UserRole;
    const authUser: AuthUser = {
      userId: String(claims?.sub ?? claims?.id ?? resolved?.profile?.id ?? ''),
      email: claims?.email ?? resolved?.profile?.email,
      name: resolved?.profile?.full_name,
      role: lawRole,
    };
    setUser(authUser);
    setRole(lawRole);
    // Mirror into the zustand store used by booking/checkout/lawyer/profile/etc. pages,
    // so there is a single source of truth for the session across both auth layers.
    try {
      useAuthStore.getState().setUser({
        id: authUser.userId,
        uid: authUser.userId,
        email: authUser.email,
        name: authUser.name,
        role: lawRole,
      } as any);
    } catch { /* store optional */ }
    return authUser;
  };

  // Access token lives in memory. On a fresh load, attempt a silent refresh against the
  // BFF (/api/auth/refresh) using the httpOnly refresh cookie — this restores the session
  // across reloads (persistent login) without ever putting the token in localStorage.
  useEffect(() => {
    let alive = true;
    (async () => {
      let token = getToken();
      if (!token) {
        // Shared, deduped refresh (same in-flight promise the apiClient uses) so we never
        // fire two concurrent refreshes against the rotating refresh token.
        token = await silentRefresh();
      }
      if (token && alive) {
        const u = await hydrateFromToken(token);
        // If an impersonation was active before reload, hydrate restored the TARGET's
        // identity (the header is sent on /auth/me) — reflect that in the banner state.
        if (getImpersonation() && u) {
          setImpersonatingState({ id: getImpersonation() as string, name: u.name, role: u.role, email: u.email });
        }
      } else if (alive) {
        // No active session — clear any stale persisted zustand user.
        try { useAuthStore.getState().logout(); } catch { /* noop */ }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser | null> => {
    const res = await authLawApi.login(email, password);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
    if (!accessToken) return null;
    setToken(accessToken);
    return hydrateFromToken(accessToken);
  };

  const register = async (email: string, password: string, name: string, userRole?: string) => {
    const res = await authLawApi.register(email, password, name, userRole);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
    if (accessToken) {
      setToken(accessToken);
      await hydrateFromToken(accessToken);
    }
  };

  const logout = () => {
    authLawApi.logout().catch(() => {});
    clearToken();
    setImpersonation(null);
    setImpersonatingState(null);
    setUser(null);
    setRole(null);
    try { useAuthStore.getState().logout(); } catch { /* noop */ }
  };

  // ── Admin "View as" impersonation ──────────────────────────────────────────
  // Verify (admin token) that the target is impersonable, then arm the apiClient header
  // and re-hydrate the session AS the target so every page renders the target's data.
  const startImpersonation = async (target: { id: string; name?: string }): Promise<Impersonation | null> => {
    if (!user || role !== 'admin') return null;
    // Validate + audit server-side (runs with the admin's real token, no header yet).
    const res = await apiClient.get(`/admin/impersonate/${target.id}`);
    const payload = (res.data?.data ?? res.data) as { id: string | number; role: UserRole; email?: string; name?: string };
    const id = String(payload?.id ?? target.id);
    setImpersonation(id);
    const u = await hydrateFromToken(getToken() as string);
    const imp: Impersonation = {
      id,
      role: (payload?.role ?? u?.role ?? 'client') as UserRole,
      name: payload?.name ?? target.name ?? u?.name,
      email: payload?.email ?? u?.email,
    };
    setImpersonatingState(imp);
    return imp;
  };

  // Drop the impersonation header and re-hydrate as the real (admin) identity.
  const stopImpersonation = async (): Promise<void> => {
    setImpersonation(null);
    setImpersonatingState(null);
    const token = getToken();
    if (token) await hydrateFromToken(token);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, login, register, logout, impersonating, startImpersonation, stopImpersonation }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useRole() {
  const { role } = useAuth();
  return role;
}

// Legacy compat — old code imported these from AuthContext
export { AuthContext };

// `useAuthContext` is an alias used by src/hooks/useAuth.ts
export const useAuthContext = useAuth;
