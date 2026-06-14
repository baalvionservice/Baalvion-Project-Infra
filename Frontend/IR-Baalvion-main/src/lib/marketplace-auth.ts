// SERVER-ONLY. Mints a short-lived RS256 platform JWT so the IR app's BFF can authenticate
// to marketplace-service on behalf of the logged-in IR investor. Mirrors
// Backend/scripts/mint-token.cjs (same private key → verifies against every service's
// JWT_PUBLIC_KEY). The key never reaches the browser — only used inside route handlers.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// The IR investor persona maps to a stable marketplace investor org. (A full build would
// resolve this from the user's real org via auth-service; this keeps the demo coherent.)
export const INVESTOR_ORG = process.env.MARKETPLACE_INVESTOR_ORG || '11111111-1111-1111-1111-111111111111';

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

export function mintMarketplaceToken(opts: { sub: string | number; roles?: string[]; org?: string; email?: string; ttlSeconds?: number }): string | null {
  const priv = loadPrivateKey();
  if (!priv) return null;
  const { sub, roles = ['investor_admin'], org = INVESTOR_ORG, email, ttlSeconds = 900 } = opts;
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
