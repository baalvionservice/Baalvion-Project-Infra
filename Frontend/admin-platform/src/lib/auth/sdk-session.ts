'use client';
/**
 * Phase 5C PILOT — additive @baalvion/auth-sdk layer over admin-platform's existing hybrid auth.
 *
 * NON-BREAKING: the zustand store (useAuthStore), the axios clients, and the 401→refresh
 * interceptors in lib/api/client.ts are ALL UNCHANGED. This module is DORMANT — nothing
 * imports it yet, so the Next build is unaffected until a component opts in.
 *
 * Resolution order (auth-sdk createAuthSession):
 *   (1) HttpOnly cookie session   → GET /me { credentials:'include' }   (admin already sends cookies)
 *   (2) bearer fallback           → existing zustand accessToken (localStorage-persisted)
 *   (3) guest
 *
 * To adopt incrementally: a component can call `getSession()/getUser()` instead of reading
 * useAuthStore directly. The old useAuth()/useAuthStore continue to work side-by-side.
 */
import { createAuthSession, createGatewaySession } from '@baalvion/auth-sdk';
import { useAuthStore } from '@/lib/store/authStore';

const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ||
  'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

export const authSession = createAuthSession({
  authUrl: AUTH_URL,
  cookieMode: true, // (1) prefer the HttpOnly cookie session
  // (2) bearer fallback: reuse the EXISTING store token (no new storage introduced)
  getAccessToken: () => useAuthStore.getState().accessToken,
  // refresh is the server-side HttpOnly cookie (admin's interceptor already handles /refresh)
  getRefreshToken: () => null,
  setTokens: (t) => useAuthStore.getState().setTokens(t.accessToken, 900),
  clearTokens: () => useAuthStore.getState().logout(),
});

/** Unified session helpers (old useAuth/useAuthStore keep working unchanged). */
export const getSession = () => authSession.getSession();
export const getUser = () => authSession.getUser();
export const refreshSession = () => authSession.refreshSession();
export const logout = () => authSession.logout();

// ── Unified gateway (BFF) session — additive, gated by NEXT_PUBLIC_BFF_MODE ──────
// The target model: no token in JS (cookies + CSRF), data via gatewaySession.authFetch. At cutover
// this replaces the zustand-Bearer/axios path in lib/api/client.ts and the localStorage-persisted
// access token. Left additive here so the existing path keeps working until the switch.
export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';
export const gatewaySession = createGatewaySession({
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL ?? '/auth-bff',
});
