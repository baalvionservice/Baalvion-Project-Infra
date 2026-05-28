'use client';
/**
 * @baalvion/auth-sdk/react — React bindings over createAuthSession().
 *
 * Provides the single auth integration surface for Baalvion apps:
 *   <AuthProvider authUrl="/auth-bff" cookieRefresh mePath="/me"
 *     getAccessToken={…} setTokens={…} clearTokens={…} mapUser={…}>
 *   const { isLoading, isAuthenticated, user, roles, permissions,
 *           login, logout, refresh, hasRole, hasPermission } = useAuthSDK();
 *
 * The provider owns ONE createAuthSession instance and runs the bootstrap (getSession) on mount.
 * Apps must wire getAccessToken/setTokens/clearTokens to their IN-MEMORY token holder (never the
 * SDK's localStorage tokenStorage), preserving the Phase-1 security model.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createAuthSession, createGatewaySession, type AuthSessionOptions, type GatewaySessionOptions, type CanonicalSession } from '../index';

export function hasRole(session: CanonicalSession | null, role: string): boolean {
  return !!session && session.roles.includes(role);
}
export function hasPermission(session: CanonicalSession | null, perm: string): boolean {
  return !!session && session.permissions.includes(perm);
}

export interface AuthSDKContextValue<U = CanonicalSession> {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: CanonicalSession | null;
  user: U | null;
  userId: string | null;
  orgId: string | null;
  email: string | null;
  roles: string[];
  permissions: string[];
  login: (email: string, password: string) => Promise<CanonicalSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<CanonicalSession>;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
  /** CSRF-aware data client — present only in gateway mode (<AuthProvider mode="gateway">). */
  authFetch?: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthSDKContext = createContext<AuthSDKContextValue<any> | undefined>(undefined);

export interface AuthProviderProps<U = CanonicalSession> extends Partial<AuthSessionOptions> {
  children: ReactNode;
  /** 'gateway' = the unified BFF cookie model (createGatewaySession). Omit for legacy modes. */
  mode?: 'gateway';
  /** Gateway base URL or same-origin proxy prefix (required when mode='gateway'). */
  gatewayUrl?: string;
  /** JS-readable CSRF cookie name (gateway mode; default 'csrf_token'). */
  csrfCookie?: string;
  /** Optional projection of the canonical session into an app-specific user shape. */
  mapUser?: (session: CanonicalSession) => U;
  /** Optional callback when the bootstrap resolves to an unauthenticated session. */
  onUnauthenticated?: () => void;
}

const GUEST: CanonicalSession = {
  authenticated: false, mode: 'guest', userId: null, orgId: null, roles: [], permissions: [],
};

export function AuthProvider<U = CanonicalSession>({
  children, mapUser, onUnauthenticated, ...opts
}: AuthProviderProps<U>) {
  const api = useRef(
    opts.mode === 'gateway'
      ? createGatewaySession({
          gatewayUrl:     opts.gatewayUrl!,
          mePath:         opts.mePath,
          csrfCookie:     opts.csrfCookie,
          onUnauthorized: onUnauthenticated,
        } as GatewaySessionOptions)
      : createAuthSession(opts as AuthSessionOptions),
  ).current;
  const [session, setSession] = useState<CanonicalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap once on mount (cookieRefresh → /me). Wait for resolution before exposing auth state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.getSession();
        if (cancelled) return;
        setSession(s);
        if (!s.authenticated) onUnauthenticated?.();
      } catch {
        if (!cancelled) setSession({ ...GUEST });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const value = useMemo<AuthSDKContextValue<U>>(() => {
    const s = session;
    return {
      isLoading,
      isAuthenticated: !!s?.authenticated,
      session: s,
      user: s ? (mapUser ? mapUser(s) : (s as unknown as U)) : null,
      userId: s?.userId ?? null,
      orgId: s?.orgId ?? null,
      email: s?.email ?? null,
      roles: s?.roles ?? [],
      permissions: s?.permissions ?? [],
      login: async (email: string, password: string) => {
        await api.client.auth.login({ email, password });
        const next = await api.refreshSession();
        setSession(next);
        return next;
      },
      logout: async () => {
        await api.logout();
        setSession({ ...GUEST });
        onUnauthenticated?.();
      },
      refresh: async () => {
        const next = await api.refreshSession();
        setSession(next);
        return next;
      },
      hasRole: (role: string) => hasRole(s, role),
      hasPermission: (perm: string) => hasPermission(s, perm),
      authFetch: (api as { authFetch?: (p: string, i?: RequestInit) => Promise<Response> }).authFetch,
    };
  }, [session, isLoading, api, mapUser, onUnauthenticated]);

  return <AuthSDKContext.Provider value={value}>{children}</AuthSDKContext.Provider>;
}

export function useAuthSDK<U = CanonicalSession>(): AuthSDKContextValue<U> {
  const v = useContext(AuthSDKContext);
  if (!v) throw new Error('useAuthSDK must be used within an <AuthProvider>');
  return v as AuthSDKContextValue<U>;
}

/** The gateway data client. Throws unless the provider is in gateway mode. */
export function useAuthApi(): (path: string, init?: RequestInit) => Promise<Response> {
  const { authFetch } = useAuthSDK();
  if (!authFetch) throw new Error('useAuthApi requires <AuthProvider mode="gateway">');
  return authFetch;
}

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Rendered while the session is still bootstrapping (prevents unauthorized-shell flash). */
  loadingFallback?: ReactNode;
  /** Rendered when unauthenticated and no onRedirect is given. */
  fallback?: ReactNode;
  /**
   * IDENTITY-ONLY coarse gate (NOT RBAC): render only if the session carries one of these roles.
   * Real permission enforcement belongs to the RBAC layer, not here.
   */
  requireRoles?: string[];
  /** Invoked (once, post-bootstrap) when unauthenticated — wire to your router's redirect. */
  onRedirect?: (next: string) => void;
}

/**
 * Identity gate. Waits for bootstrap (never renders children or redirects while loading), then
 * requires an authenticated session. Framework-agnostic: pass onRedirect to integrate with your
 * router (e.g. Next router.replace), or supply a fallback.
 */
export function ProtectedRoute({
  children, loadingFallback = null, fallback = null, requireRoles, onRedirect,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, roles } = useAuthSDK();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && onRedirect) {
      const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      onRedirect(next);
    }
  }, [isLoading, isAuthenticated, onRedirect]);

  if (isLoading) return <>{loadingFallback}</>;
  if (!isAuthenticated) return <>{fallback}</>;
  if (requireRoles?.length && !requireRoles.some(r => roles.includes(r))) return <>{fallback}</>;
  return <>{children}</>;
}

export type { CanonicalSession, AuthSessionOptions, GatewaySessionOptions };
