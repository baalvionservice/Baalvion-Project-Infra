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

  // Silent session restore (no localStorage). Tries /refresh FIRST — it's the only call that
  // returns a real bearer token in the body, which platformClient/adminApiClient (via tokenStore)
  // need for cross-origin calls to proxy-service (org data, billing, …). Only when that fails (no
  // refresh cookie at all — the case for a session bootstrapped via the SSO hand-off from
  // auth.baalvion.com, which never gets a refresh token; see SsoCallback.tsx) falls back to /me,
  // which still resolves `user` off the shorter-lived access cookie alone. That fallback has no
  // bearer token to recover — /me never returns the raw token — so an SSO session's cross-origin
  // calls stay limited after a reload; what it fixes is `isAuthenticated` (derived from `user`,
  // not `accessToken`) so a live SSO session isn't wrongly bounced to /login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        try {
          const { accessToken: at } = await authClient.refresh();
          if (cancelled || !at) throw new Error('no token');
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
          return;
        } catch {
          /* no refresh cookie (or refresh failed) — fall through to a cookie-only /me */
        }
        try {
          const u = await authClient.me('');
          if (!cancelled) {
            setUser(u);
            tokenStore.set(null, u);
          }
        } catch {
          /* no live session either way → remain unauthenticated */
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
      // Derived from `user`, not `accessToken`: the cookie-only restore path (an SSO-bootstrapped
      // session with no refresh token — see the effect above) resolves `/me` successfully and sets
      // `user`, but has no raw token to put in `accessToken` (it's httpOnly, never returned by
      // /me). Gating on `accessToken` here bounced a perfectly live session to /login on its very
      // first reload — this was the SSO logout-on-refresh bug in its final form.
      isAuthenticated: !!user,
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
