/**
 * Canonical verifier / middleware test suite (Phase 2). node:test, zero new deps.
 *
 * Spins up a local JWKS endpoint, signs RS256 tokens with an in-test keypair, and
 * exercises createJwksVerifier (canonical mode) + createAuthMiddleware across the
 * 14 required scenarios. Run: node --test tests/
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const { createJwksVerifier, createAuthMiddleware, VerifyError } = require('../index.js');

const ISSUER = 'baalvion-auth';
const AUDIENCE = 'baalvion-platform';

// ── Two keypairs (kid1 active, kid2 for rotation) ───────────────────────────────
function makeKeypair(kid) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
  return { kid, publicKey, privateKey, jwk: { ...jwk, kid, use: 'sig', alg: 'RS256' } };
}
const k1 = makeKeypair('kid-1');
const k2 = makeKeypair('kid-2');

// Mutable JWKS so we can test rotation + caching.
let served = { keys: [k1.jwk] };
let server, jwksUri;

before(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(served));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  jwksUri = `http://127.0.0.1:${server.address().port}/jwks.json`;
});
after(() => server && server.close());

const canonicalClaims = (over = {}) => ({
  sub: 'u-1', org_id: 'o-1', sid: 's-1', jti: 'jti-1',
  roles: ['admin'], permissions: ['read:org'], ...over,
});

function sign(key, claims, opts = {}) {
  return jwt.sign(claims, key.privateKey, {
    algorithm: 'RS256', keyid: key.kid, issuer: ISSUER, audience: AUDIENCE, expiresIn: '5m', ...opts,
  });
}

const verifier = () => createJwksVerifier({
  jwksUri, issuer: ISSUER, audience: AUDIENCE,
  requiredClaims: ['sub', 'org_id', 'sid', 'jti'],
  rejectHs256: true, validateRolesPermissions: true,
  isBlacklisted: async (jti) => jti === 'jti-revoked',
});

// ── 1. valid canonical token ────────────────────────────────────────────────────
test('1. valid canonical token verifies', async () => {
  const payload = await verifier().verify(sign(k1, canonicalClaims()));
  assert.equal(payload.sub, 'u-1');
  assert.equal(payload.org_id, 'o-1');
  assert.deepEqual(payload.roles, ['admin']);
});

// ── 2. expired ───────────────────────────────────────────────────────────────────
test('2. expired token rejected', async () => {
  await assert.rejects(() => verifier().verify(sign(k1, canonicalClaims(), { expiresIn: '-1s' })));
});

// ── 3. wrong issuer ──────────────────────────────────────────────────────────────
test('3. wrong issuer rejected', async () => {
  await assert.rejects(() => verifier().verify(sign(k1, canonicalClaims(), { issuer: 'evil' })));
});

// ── 4. wrong audience ────────────────────────────────────────────────────────────
test('4. wrong audience rejected', async () => {
  await assert.rejects(() => verifier().verify(sign(k1, canonicalClaims(), { audience: 'evil' })));
});

// ── 5/6. wrong algorithm + HS256 rejection ───────────────────────────────────────
test('5+6. HS256 / non-RS256 token rejected (alg_not_allowed)', async () => {
  const hs = jwt.sign(canonicalClaims(), 'shared-secret', { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, expiresIn: '5m' });
  await assert.rejects(() => verifier().verify(hs), (e) => e instanceof VerifyError && e.code === 'alg_not_allowed');
});

// ── 7/8/9. missing required claims ────────────────────────────────────────────────
for (const claim of ['sub', 'org_id', 'sid']) {
  test(`7-9. missing ${claim} rejected (missing_claim)`, async () => {
    const c = canonicalClaims(); delete c[claim];
    await assert.rejects(() => verifier().verify(sign(k1, c)), (e) => e.code === 'missing_claim');
  });
}

// ── 10. malformed roles ───────────────────────────────────────────────────────────
test('10. malformed roles (non-array) rejected', async () => {
  await assert.rejects(
    () => verifier().verify(sign(k1, canonicalClaims({ roles: 'admin' }))),
    (e) => e.code === 'malformed_roles',
  );
});

// ── 11. malformed permissions ─────────────────────────────────────────────────────
test('11. malformed permissions (non-array) rejected', async () => {
  await assert.rejects(
    () => verifier().verify(sign(k1, canonicalClaims({ permissions: 'read' }))),
    (e) => e.code === 'malformed_permissions',
  );
});

// ── 12. revoked JTI ───────────────────────────────────────────────────────────────
test('12. revoked jti rejected', async () => {
  await assert.rejects(
    () => verifier().verify(sign(k1, canonicalClaims({ jti: 'jti-revoked' }))),
    (e) => e.code === 'blacklisted',
  );
});

// ── 13. rotated kid support ───────────────────────────────────────────────────────
test('13. rotated kid (second key) verifies', async () => {
  served = { keys: [k1.jwk, k2.jwk] };           // publish both
  const v = verifier();
  await v.verify(sign(k1, canonicalClaims()));    // old kid
  const p = await v.verify(sign(k2, canonicalClaims())); // new kid
  assert.equal(p.sub, 'u-1');
});

// ── 14. JWKS cache behavior ───────────────────────────────────────────────────────
test('14. JWKS cache serves verification after endpoint goes empty (within TTL)', async () => {
  served = { keys: [k1.jwk] };
  const v = createJwksVerifier({ jwksUri, issuer: ISSUER, audience: AUDIENCE, jwksTtlMs: 60_000 });
  await v.verify(sign(k1, canonicalClaims()));    // populates cache
  served = { keys: [] };                           // key disappears from endpoint
  const p = await v.verify(sign(k1, canonicalClaims())); // still verifies from cache
  assert.equal(p.sub, 'u-1');
  v.resetCache();
  await assert.rejects(() => v.verify(sign(k1, canonicalClaims()))); // cache cleared → no key
});

// ── middleware smoke: req.auth mapping ────────────────────────────────────────────
test('middleware maps canonical claims to req.auth', async () => {
  const mw = createAuthMiddleware({ jwksUri, issuer: ISSUER, audience: AUDIENCE });
  served = { keys: [k1.jwk] };
  const req = { headers: { authorization: `Bearer ${sign(k1, canonicalClaims())}` } };
  await new Promise((resolve, reject) => mw(req, {}, (err) => (err ? reject(err) : resolve())));
  assert.equal(req.auth.userId, 'u-1');
  assert.equal(req.auth.orgId, 'o-1');
  assert.equal(req.auth.sessionId, 's-1');
  assert.deepEqual(req.auth.roles, ['admin']);
  assert.deepEqual(req.auth.permissions, ['read:org']);
});

test('middleware rejects a missing bearer header', async () => {
  const mw = createAuthMiddleware({ jwksUri, issuer: ISSUER, audience: AUDIENCE });
  const err = await new Promise((resolve) => mw({ headers: {} }, {}, resolve));
  assert.equal(err.status, 401);
  assert.equal(err.code, 'unauthorized');
});
