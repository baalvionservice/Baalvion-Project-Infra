import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { authClient, AuthUser, AuthTokens, RegisterResult } from "@/lib/authClient";
import { tokenStore } from "@/lib/tokenStore";

/**
 * SECURITY MODEL (P0 remediation): the access token + user are held in memory (React state) ONLY.
 * NO localStorage/sessionStorage. The refresh token is the httpOnly cookie set by auth-service.
 * On app start we silently restore the session via a cookie refresh (no storage reads).
 */
interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, fullName: string, plan?: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  loginWithTokens: (tokens: AuthTokens) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Silent session restore (no localStorage). Tries /me FIRST off the still-live access cookie —
  // a session bootstrapped via the SSO hand-off from auth.baalvion.com has no refresh cookie at
  // all (that flow never gets a refresh token — see SsoCallback.tsx), so going straight to
  // /refresh first would 401 and log out a perfectly valid, still-live SSO session on its very
  // first reload. Only falls back to /refresh (native login's path) when /me says the access
  // cookie is gone or expired.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        try {
          const u = await authClient.me('');
          if (!cancelled) {
            setUser(u);
            tokenStore.set(null, u);
          }
          return; // access cookie alone was enough — no refresh cookie to fall back to
        } catch {
          /* access cookie missing/expired — fall through to refresh */
        }
        try {
          const { accessToken: at } = await authClient.refresh();
          if (cancelled || !at) return;
          setAccessToken(at);
          tokenStore.set(at);
          try {
            const u = await authClient.me(at);
            if (!cancelled) {
              setUser(u);
              tokenStore.set(at, u);
            }
          } catch {
            /* token valid; profile fetch best-effort */
          }
        } catch {
          /* no valid refresh cookie → remain unauthenticated */
        }
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = useCallback((tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    setUser(tokens.user);
    tokenStore.set(tokens.accessToken, tokens.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authClient.login(email, password);
    apply(tokens);
    return tokens.user;
  }, [apply]);

  const register = useCallback(async (email: string, password: string, fullName: string, plan?: string) => {
    const result = await authClient.register(email, password, fullName, plan);
    apply(result);
    return result;
  }, [apply]);

  const logout = useCallback(async () => {
    if (accessToken) {
      try { await authClient.logout(accessToken); } catch { /* ignore */ }
    }
    setAccessToken(null);
    setUser(null);
    tokenStore.clear();
  }, [accessToken]);

  const loginWithTokens = useCallback((tokens: AuthTokens) => {
    apply(tokens);
  }, [apply]);

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
