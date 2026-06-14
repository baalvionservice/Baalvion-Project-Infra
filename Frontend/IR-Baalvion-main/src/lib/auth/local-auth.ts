/**
 * IR-Baalvion LOCAL auth backend (dev / standalone mode).
 *
 * When the central Baalvion identity stack (auth-service / gateway) is not running, the IR
 * frontend can authenticate against this self-contained seed-user store so the full
 * institutional experience (gated dashboards, governance, capital-ops) is usable offline.
 *
 * SECURITY: this path is ONLY mounted when NEXT_PUBLIC_AUTH_BFF_PATH points at /api/auth-local
 * (set in .env.local for local dev). In production the auth client talks to the real /auth-bff
 * gateway and none of this code is reachable. The minted token is intentionally UNSIGNED — IR's
 * internal route guards do an unverified decode by design; decisive verification lives upstream
 * at auth-service. Do NOT enable this path against a public deployment.
 */
import type { AppRole } from '@/lib/rbac/roles';

export const REFRESH_COOKIE =
  process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

export interface SeedUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
}

/**
 * Seed institutional accounts — one per access tier. These are the local login credentials.
 */
export const SEED_USERS: SeedUser[] = [
  {
    id: 'usr_admin',
    email: 'admin@baalvion.com',
    password: 'Admin123!',
    name: 'Platform Administrator',
    role: 'admin',
  },
  {
    id: 'usr_p1',
    email: 'institutional@baalvion.com',
    password: 'Investor123!',
    name: 'Institutional Investor',
    role: 'p1_institutional',
  },
  {
    id: 'usr_p2',
    email: 'spv@baalvion.com',
    password: 'Spv123!',
    name: 'Private SPV Partner',
    role: 'p2_spv',
  },
  {
    id: 'usr_p3',
    email: 'operator@baalvion.com',
    password: 'Operator123!',
    name: 'Strategic Operator',
    role: 'p3_operator',
  },
  {
    id: 'usr_compliance',
    email: 'compliance@baalvion.com',
    password: 'Compliance123!',
    name: 'Compliance Officer',
    role: 'compliance',
  },
];

export interface AuthClaims {
  sub: string;
  email: string;
  name: string;
  role: AppRole;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf8');
}

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes

/** Mints an (unsigned) JWT-shaped access token carrying the user's role claim. */
export function mintAccessToken(user: SeedUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const claims: AuthClaims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + ACCESS_TTL_SECONDS,
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claims),
  )}.local`;
}

/** Opaque refresh-cookie value: a base64url snapshot of the user id (server re-resolves the user). */
export function encodeRefresh(user: SeedUser): string {
  return base64UrlEncode(JSON.stringify({ uid: user.id, t: Date.now() }));
}

export function userFromRefresh(cookieValue: string | undefined): SeedUser | null {
  if (!cookieValue) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(cookieValue)) as { uid?: string };
    if (!parsed?.uid) return null;
    return SEED_USERS.find((u) => u.id === parsed.uid) ?? null;
  } catch {
    return null;
  }
}

export function findUser(email: string, password: string): SeedUser | null {
  const normalized = email.trim().toLowerCase();
  return (
    SEED_USERS.find(
      (u) => u.email.toLowerCase() === normalized && u.password === password,
    ) ?? null
  );
}

export function publicUser(user: SeedUser) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
