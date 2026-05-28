#!/usr/bin/env node
/**
 * Proof that the Phase-1 auth fix is correct, run against the REAL
 * @baalvion/auth-node lib and the REAL generated dev keypair.
 *
 *   1. Sign an RS256 token the way auth-service/utils/jwtRsa.js does
 *      (private key, kid, iss=baalvion-auth, aud=baalvion-platform).
 *   2. Verify it through the EXACT adapter shape a verify-only service uses
 *      (about-service: createAuthServer({ accessSecret, env })), with the
 *      standardized env (JWT_PUBLIC_KEY / JWT_ISSUER / JWT_AUDIENCE /
 *      JWT_ALLOW_HS256_FALLBACK=false, NODE_ENV=production).  → must PASS.
 *   3. Forge an HS256 token with the shared secret and verify it. → must be REJECTED.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'Backend/packages/auth-node/index.js'));
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

const privateKey = readFileSync(join(root, 'docker/secrets/jwt_private_key.pem'), 'utf8');
const publicKey = readFileSync(join(root, 'docker/secrets/jwt_public_key.pem'), 'utf8');
const kid = crypto.createHash('sha256')
  .update(crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' }))
  .digest('base64url').slice(0, 16);

// (1) auth-service-style RS256 token
const rs256 = jwt.sign(
  { sub: 'user-123', email: 'a@b.com', org_id: 'org-1', role: 'admin', permissions: [] },
  privateKey,
  { algorithm: 'RS256', expiresIn: '15m', issuer: 'baalvion-auth', audience: 'baalvion-platform', keyid: kid },
);

// Standardized fleet env (what docker-compose will inject)
process.env.NODE_ENV = 'production';
process.env.JWT_PUBLIC_KEY = publicKey.trim();          // auth-node reads this
process.env.JWT_ISSUER = 'baalvion-auth';
process.env.JWT_AUDIENCE = 'baalvion-platform';
process.env.JWT_ALLOW_HS256_FALLBACK = 'false';

const { createAuthServer } = require(join(root, 'Backend/packages/auth-node/index.js'));
// EXACT about-service adapter shape:
const auth = createAuthServer({ accessSecret: 'dev-hs256-secret-should-be-ignored', env: 'production' });

let pass = 0, fail = 0;
const ok = (name, cond) => { (cond ? pass++ : fail++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

// (2) RS256 must verify
try {
  const d = auth.verifyAccessToken(rs256);
  ok('RS256 token from auth-service is accepted by verify-only service', d.sub === 'user-123');
  ok('issuer enforced (baalvion-auth)', d.iss === 'baalvion-auth');
  ok('audience enforced (baalvion-platform)', d.aud === 'baalvion-platform');
} catch (e) { ok('RS256 token accepted', false); console.log('   err:', e.message); }

// (3) HS256 forgery must be rejected (no HS256-only path remains)
const hsForge = jwt.sign({ sub: 'attacker' }, 'dev-hs256-secret-should-be-ignored', { algorithm: 'HS256' });
try { auth.verifyAccessToken(hsForge); ok('HS256 forgery REJECTED', false); }
catch { ok('HS256 forgery REJECTED', true); }

// (4) wrong-audience token rejected
const badAud = jwt.sign({ sub: 'x' }, privateKey, { algorithm: 'RS256', issuer: 'baalvion-auth', audience: 'baalvion-services', keyid: kid });
try { auth.verifyAccessToken(badAud); ok('wrong-audience token REJECTED', false); }
catch { ok('wrong-audience token REJECTED', true); }

console.log(`\n${fail === 0 ? '✅ ALL PASS' : '❌ ' + fail + ' FAILED'}  (${pass} passed, ${fail} failed)`);
process.exit(fail === 0 ? 0 : 1);
