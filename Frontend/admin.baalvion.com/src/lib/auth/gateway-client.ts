'use client';
/**
 * Phase 6E-2 — admin-platform → auth-gateway (BFF) cookie client. ADDITIVE + TOGGLEABLE.
 *
 * Enabled ONLY when NEXT_PUBLIC_BFF_MODE === 'on'. When off (default), the existing zustand/Bearer
 * path is used unchanged (rollback — NOT removed). No JWT is ever read/stored in JS; auth is cookies
 * only (credentials:'include'). CSRF uses the JS-readable csrf_token cookie (double-submit).
 *
 * Wiring (gated by BFF_ENABLED, no legacy code deleted):
 *   - login:     useAuth.login()        → if BFF_ENABLED, call gwLogin() instead of auth-service direct
 *   - bootstrap: AuthProvider on mount  → if BFF_ENABLED, set user = await gwMe() (single source of truth)
 *   - data:      service calls          → if BFF_ENABLED, gwApi('/<svc>/...') instead of axios+Bearer
 *   - logout:    useAuth.logout()       → if BFF_ENABLED, gwLogout()
 */
const GW = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3099';
export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

function csrfFromCookie(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1] ?? '';
}

export interface GatewayUser { userId?: string; id?: string; email?: string; roles?: string[]; orgId?: string | null; permissions?: string[]; }

/** POST /auth/login → HttpOnly cookies set by the gateway. Returns the safe profile (NO token). */
export async function gwLogin(email: string, password: string): Promise<GatewayUser> {
  const r = await fetch(`${GW}/auth/login`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'Login failed'); }
  return (await r.json()).user;
}

/** GET /auth/me — the single source of truth for the session (no localStorage). */
export async function gwMe(): Promise<GatewayUser | null> {
  const r = await fetch(`${GW}/auth/me`, { credentials: 'include' });
  if (!r.ok) return null;
  return (await r.json()).user ?? null;
}

/** POST /auth/logout — clears cookies + revokes the Redis session (instant, cross-tab). */
export async function gwLogout(): Promise<void> {
  await fetch(`${GW}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'x-csrf-token': csrfFromCookie() } });
}

/** Data calls → gateway /api/* (cookie + CSRF). Backend receives signed x-user-id headers server-side. */
export async function gwApi(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) };
  if (method !== 'GET' && method !== 'HEAD') headers['x-csrf-token'] = csrfFromCookie();
  return fetch(`${GW}/api${path}`, { ...init, credentials: 'include', headers });
}
