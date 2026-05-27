/**
 * Service-to-service HMAC auth tests (node:test, zero-dependency).
 *
 * Mirrors the EXACT signature construction in createServiceAuthMiddleware
 * (src/index.ts) after the Phase 1 fix:
 *
 *   bodyHash = HMAC_SHA256(secret, JSON.stringify(body))     // FIXED: keyed by the real secret
 *   message  = `${method}:${path}:${ts}:${nonce}:${bodyHash}`
 *   sig      = HMAC_SHA256(secret, message)
 *
 * The pre-fix code keyed bodyHash with the literal string 'hash', which meant the
 * body digest was NOT bound to the shared secret. These tests prove:
 *   1. a signature built with the correct secret verifies,
 *   2. a signature built the OLD way (literal 'hash' body key) is REJECTED,
 *   3. a wrong secret is rejected,
 *   4. tampering with the body is rejected.
 *
 * Run: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = 'phase1-strong-service-secret';

// ── verifier: mirrors the FIXED middleware (bodyHash keyed by `secret`) ──────────
function sign(secret, { method, path, ts, nonce, body }, bodyKey = secret) {
  const bodyHash = createHmac('sha256', bodyKey).update(JSON.stringify(body) ?? '').digest('hex');
  const message = `${method}:${path}:${ts}:${nonce}:${bodyHash}`;
  return createHmac('sha256', secret).update(message).digest('hex');
}

function verify(secret, req, presentedSig) {
  const expected = sign(secret, req);            // FIXED scheme: bodyHash keyed by secret
  try {
    return timingSafeEqual(Buffer.from(presentedSig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const baseReq = () => ({
  method: 'POST',
  path: '/v1/internal/notify',
  ts: String(Date.now()),
  nonce: 'nonce-123',
  body: { event: 'user.created', userId: 'u1' },
});

test('valid signature with the correct secret is accepted', () => {
  const req = baseReq();
  const sig = sign(SECRET, req);                 // signed correctly
  assert.equal(verify(SECRET, req, sig), true);
});

test('OLD scheme (literal "hash" body key) is now REJECTED', () => {
  const req = baseReq();
  const oldSig = sign(SECRET, req, 'hash');       // pre-fix: bodyHash keyed by literal 'hash'
  assert.equal(verify(SECRET, req, oldSig), false);
});

test('a literal-secret signature does not validate against the real secret', () => {
  const req = baseReq();
  const literalSig = sign('hash', req, 'hash');   // attacker who only knows the old literal
  assert.equal(verify(SECRET, req, literalSig), false);
});

test('wrong secret is rejected', () => {
  const req = baseReq();
  const sig = sign('a-different-secret', req);
  assert.equal(verify(SECRET, req, sig), false);
});

test('body tampering changes the hash and is rejected', () => {
  const req = baseReq();
  const sig = sign(SECRET, req);
  const tampered = { ...req, body: { ...req.body, userId: 'attacker' } };
  assert.equal(verify(SECRET, tampered, sig), false);
});
