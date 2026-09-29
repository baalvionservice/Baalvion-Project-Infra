"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gatewayAuth, GatewayIdentity } from '@/lib/auth/gateway-session';

interface AuthContextType {
  user: GatewayIdentity | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<GatewayIdentity | null>;
  register: (email: string, password: string, fullName?: string) => Promise<GatewayIdentity | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GatewayIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await gatewayAuth.getCurrentUser();
    setUser(current);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const identity = await gatewayAuth.login(email, password);
    setUser(identity);
    return identity;
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const identity = await gatewayAuth.register(email, password, fullName);
    setUser(identity);
    return identity;
  }, []);

  const logout = useCallback(async () => {
    await gatewayAuth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refresh }}>
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
