"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authLawApi, setToken, clearToken, getToken, TOKEN_KEY } from '@/lib/api/client';

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

function parseJwt(token: string): { id: string; email: string; role: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // The access token is in memory; on a fresh load there is nothing to restore (no refresh cookie
  // on law-service yet — see lib/api/client.ts). If a token survives in memory (same-session
  // remount), repopulate from its claims.
  useEffect(() => {
    const token = getToken();
    if (token) {
      const claims = parseJwt(token);
      if (claims) {
        setUser({ userId: String(claims.id), email: claims.email, role: claims.role as UserRole });
        setRole(claims.role as UserRole);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authLawApi.login(email, password);
    const { accessToken, role: userRole } = res.data?.data || res.data;
    setToken(accessToken);
    const claims = parseJwt(accessToken);
    if (claims) {
      setUser({ userId: String(claims.id), email: claims.email, role: userRole });
      setRole(userRole as UserRole);
    }
  };

  const register = async (email: string, password: string, name: string, userRole?: string) => {
    const res = await authLawApi.register(email, password, name, userRole);
    const { accessToken, role: newRole } = res.data?.data || res.data;
    setToken(accessToken);
    const claims = parseJwt(accessToken);
    if (claims) {
      setUser({ userId: String(claims.id), email: claims.email, name, role: newRole });
      setRole(newRole as UserRole);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
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
