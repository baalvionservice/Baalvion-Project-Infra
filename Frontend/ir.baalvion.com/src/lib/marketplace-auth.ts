/**
 * SERVER-ONLY, DEV-ONLY. Mints a short-lived RS256 platform JWT so the IR app can talk to
 * domain services while the central identity stack is not running locally.
 *
 * SECURITY (fail-closed): this is PERMANENTLY DISABLED when NODE_ENV=production, and further
 * requires the same IR_LOCAL_AUTH_ENABLED opt-in as the local seed-user backend. It signs with
 * the platform private key, which every service trusts — a frontend able to mint arbitrary
 * subjects, orgs and roles in production is a privilege-escalation primitive, not a convenience.
 * In production, identity comes from the auth-gateway and the user's own access token is
 * forwarded onward (see lib/auth/identity.ts).
 *
 * `org` is REQUIRED and has no default. A shared fallback org silently collapses every investor
 * into one tenant, which defeats deal-room isolation.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { isLocalAuthEnabled } from '@/lib/auth/local-auth';

function loadPrivateKey(): string | null {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PRIVATE_KEY.includes('PRIVATE KEY')) {
    return process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  const candidates = [
    process.env.JWT_PRIVATE_KEY_FILE,
    path.resolve(process.cwd(), '..', '..', 'docker', 'secrets', 'jwt_private_key.pem'),
    path.resolve(process.cwd(), 'docker', 'secrets', 'jwt_private_key.pem'),
  ].filter(Boolean) as string[];
  for (const f of candidates) {
    try { if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8'); } catch { /* next */ }
  }
  return null;
}

const b64url = (b: Buffer | string) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Stable per-user org for local dev, derived from the user id so two dev accounts are two
 * distinct tenants and isolation is actually exercised offline.
 */
export function devOrgForUser(userId: string): string {
  const h = crypto.createHash('sha256').update(`ir-dev-org:${userId}`).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), `4${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join('-');
}

export function mintMarketplaceToken(opts: {
  sub: string | number;
  org: string;
  roles?: string[];
  email?: string;
  ttlSeconds?: number;
}): string | null {
  if (process.env.NODE_ENV === 'production' || !isLocalAuthEnabled()) return null;
  const priv = loadPrivateKey();
  if (!priv) return null;
  const { sub, org, roles = ['investor_admin'], email, ttlSeconds = 900 } = opts;
  if (!org) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'baalvion-key-1' };
  const payload = {
    sub: String(sub), email: email || `investor${sub}@baalvion.test`, org_id: org,
    sid: 'sess-' + crypto.randomUUID(), roles, role: roles[0] || null, permissions: [],
    jti: crypto.randomUUID(), iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + ttlSeconds,
  };
  const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), priv);
  return input + '.' + b64url(sig);
}
