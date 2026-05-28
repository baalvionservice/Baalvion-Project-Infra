'use client';
/**
 * Phase 6E-3 — Mining → auth-gateway (BFF) cookie client. ADDITIVE + TOGGLEABLE.
 *
 * Enabled ONLY when NEXT_PUBLIC_BFF_MODE === 'on'. When off (default), the existing
 * mining-service Bearer/localStorage path is used unchanged (rollback — NOT removed).
 * No JWT read/stored in JS; auth is cookies only (credentials:'include'); CSRF double-submit.
 *
 * Wiring (gated by BFF_ENABLED, no legacy deleted):
 *   - login     → if BFF_ENABLED, gwLogin() instead of mining-service/auth-service direct
 *   - bootstrap → if BFF_ENABLED, user = await gwMe()  (single source of truth, no LS)
 *   - data      → if BFF_ENABLED, gwApi('/mining/...') instead of axios+Bearer to mining-service
 *   - logout    → if BFF_ENABLED, gwLogout()
 */
const GW = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3099';
export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

function csrfFromCookie(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1] ?? '';
}

export interface GatewayUser { userId?: string; id?: string; email?: string; roles?: string[]; orgId?: string | null; permissions?: string[]; }

export async function gwLogin(email: string, password: string): Promise<GatewayUser> {
  const r = await fetch(`${GW}/auth/login`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'Login failed'); }
  return (await r.json()).user;
}

export async function gwMe(): Promise<GatewayUser | null> {
  const r = await fetch(`${GW}/auth/me`, { credentials: 'include' });
  if (!r.ok) return null;
  return (await r.json()).user ?? null;
}

export async function gwLogout(): Promise<void> {
  await fetch(`${GW}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'x-csrf-token': csrfFromCookie() } });
}

export async function gwApi(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) };
  if (method !== 'GET' && method !== 'HEAD') headers['x-csrf-token'] = csrfFromCookie();
  return fetch(`${GW}/api${path}`, { ...init, credentials: 'include', headers });
}
