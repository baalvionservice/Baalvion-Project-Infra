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

function setSessionCookie(role: string | null): void {
  if (typeof document === 'undefined') return;
  if (role) {
    const value = btoa(JSON.stringify({ role }));
    document.cookie = `law_elite_session=${value}; Path=/; Max-Age=86400; SameSite=Lax`;
  } else {
    document.cookie = 'law_elite_session=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

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

  useEffect(() => {
    const token = getToken();
    if (token) {
      const claims = parseJwt(token);
      if (claims) {
        const authUser: AuthUser = {
          userId: String(claims.id),
          email: claims.email,
          role: claims.role as UserRole,
        };
        setUser(authUser);
        setRole(claims.role as UserRole);
        setSessionCookie(claims.role);
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
      const authUser: AuthUser = { userId: String(claims.id), email: claims.email, role: userRole };
      setUser(authUser);
      setRole(userRole as UserRole);
      setSessionCookie(userRole);
    }
  };

  const register = async (email: string, password: string, name: string, userRole?: string) => {
    const res = await authLawApi.register(email, password, name, userRole);
    const { accessToken, role: newRole } = res.data?.data || res.data;
    setToken(accessToken);
    const claims = parseJwt(accessToken);
    if (claims) {
      const authUser: AuthUser = { userId: String(claims.id), email: claims.email, name, role: newRole };
      setUser(authUser);
      setRole(newRole as UserRole);
      setSessionCookie(newRole);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setRole(null);
    setSessionCookie(null);
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
