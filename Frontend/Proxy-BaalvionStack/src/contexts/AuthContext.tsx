import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { authClient, AuthUser, AuthTokens } from "@/lib/authClient";

const ACCESS_KEY = "baalvion_access_token";
const REFRESH_KEY = "baalvion_refresh_token";
const USER_KEY = "baalvion_auth_user";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithTokens: (tokens: AuthTokens) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (token && stored) {
      try {
        setAccessToken(token);
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  const persist = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    setAccessToken(tokens.accessToken);
    setUser(tokens.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authClient.login(email, password);
    persist(result);
  }, [persist]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const result = await authClient.register(email, password, fullName);
    persist(result);
  }, [persist]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      try { await authClient.logout(token); } catch { /* ignore */ }
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const loginWithTokens = useCallback((tokens: AuthTokens) => {
    persist(tokens);
  }, [persist]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isAuthenticated: !!accessToken,
      isInitialized,
      login,
      register,
      logout,
      loginWithTokens,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
