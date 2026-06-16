/**
 * IR-Baalvion LOCAL auth backend (dev / standalone mode).
 *
 * When the central Baalvion identity stack (auth-service / gateway) is not running, the IR
 * frontend can authenticate against this self-contained seed-user store so the full
 * institutional experience (gated dashboards, governance, capital-ops) is usable offline.
 *
 * SECURITY (fail-closed): this backend is PERMANENTLY DISABLED in production. It activates only
 * when BOTH (a) NODE_ENV !== 'production' AND (b) IR_LOCAL_AUTH_ENABLED === 'true'. Seed accounts
 * are NEVER hardcoded — they are read from the server-only IR_LOCAL_SEED_USERS env var (JSON),
 * which is set in a developer's .env.local. The minted token is unsigned and is meaningless to any
 * real verifier; decisive verification lives upstream at auth-service. The route handlers under
 * /api/auth-local additionally return 404 whenever isLocalAuthEnabled() is false.
 */
import type { AppRole } from '@/lib/rbac/roles';

export const REFRESH_COOKIE =
  process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

/**
 * Whether the local (dev/standalone) auth backend is permitted to run.
 * Fail-closed: production ALWAYS returns false regardless of any other env var, so the
 * /api/auth-local routes and seed accounts cannot exist in a production deployment.
 */
export function isLocalAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.IR_LOCAL_AUTH_ENABLED === 'true';
}

export interface SeedUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
}

/**
 * Seed institutional accounts for local dev — loaded from the server-only IR_LOCAL_SEED_USERS
 * env var (a JSON array of SeedUser). Never hardcoded, never shipped to the browser. Empty in
 * production and whenever local auth is disabled.
 */
function loadSeedUsers(): SeedUser[] {
  if (!isLocalAuthEnabled()) return [];
  const raw = process.env.IR_LOCAL_SEED_USERS;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (u): u is SeedUser =>
          !!u &&
          typeof (u as SeedUser).id === 'string' &&
          typeof (u as SeedUser).email === 'string' &&
          typeof (u as SeedUser).password === 'string' &&
          typeof (u as SeedUser).name === 'string' &&
          typeof (u as SeedUser).role === 'string',
      )
      .map((u) => ({
        id: u.id,
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role,
      }));
  } catch {
    return [];
  }
}

export const SEED_USERS: SeedUser[] = loadSeedUsers();

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
  if (!isLocalAuthEnabled() || !cookieValue) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(cookieValue)) as { uid?: string };
    if (!parsed?.uid) return null;
    return SEED_USERS.find((u) => u.id === parsed.uid) ?? null;
  } catch {
    return null;
  }
}

export function findUser(email: string, password: string): SeedUser | null {
  if (!isLocalAuthEnabled()) return null;
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
