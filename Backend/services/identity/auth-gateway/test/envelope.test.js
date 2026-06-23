'use strict';
// Pure-logic unit tests for the v2 signed identity envelope (lib/envelope.js).
//
// Runner: node:test (built into Node 18+). No live DB, no Redis, no network — envelope.js
// only depends on the `crypto` core module, so these run deterministically anywhere.
//
//   node --test test/envelope.test.js
//
// The root workspace uses Jest, but its jest.config.ts only includes a few packages/* projects
// and does NOT scan this service, so node:test is the dependency-free, runnable choice here.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { build, verify, DEFAULT_TTL } = require('../lib/envelope');

const SECRET = 'unit-test-signing-secret-min-32-chars-long';
const USER = {
  userId: 'user-123',
  orgId: 'org-456',
  roles: ['admin', 'member'],
  sessionId: 'sess-789',
  permissions: ['read', 'write'],
};

test('build returns a base64url payload and a 64-char hex HMAC signature', () => {
  const { payload, signature } = build(USER, { secret: SECRET });
  assert.equal(typeof payload, 'string');
  assert.equal(typeof signature, 'string');
  // base64url payload contains no +, /, or = characters.
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
  // HMAC-SHA256 hex digest is 64 hex characters.
  assert.match(signature, /^[0-9a-f]{64}$/);
});

test('build → verify round-trips and preserves the resolved identity', () => {
  const { payload, signature } = build(USER, { secret: SECRET });
  const envelope = verify(payload, signature, { secret: SECRET });
  assert.equal(envelope.v, 2);
  assert.equal(envelope.user.id, 'user-123');
  assert.equal(envelope.user.orgId, 'org-456');
  assert.deepEqual(envelope.user.roles, ['admin', 'member']);
  assert.equal(envelope.user.sessionId, 'sess-789');
  assert.deepEqual(envelope.user.permissions, ['read', 'write']);
});

test('build defaults missing geo to unknown/none and stamps a TTL window', () => {
  const before = Math.floor(Date.now() / 1000);
  const { payload, signature } = build(USER, { secret: SECRET });
  const envelope = verify(payload, signature, { secret: SECRET });
  assert.equal(envelope.geo.country, 'unknown');
  assert.equal(envelope.geo.source, 'none');
  assert.ok(envelope.issued_at >= before);
  assert.equal(envelope.expires_at - envelope.issued_at, DEFAULT_TTL);
});

test('build accepts user.id as an alias for userId and coerces orgId to string', () => {
  const { payload, signature } = build(
    { id: 42, orgId: 7, roles: [], sessionId: null, permissions: [] },
    { secret: SECRET },
  );
  const envelope = verify(payload, signature, { secret: SECRET });
  assert.equal(envelope.user.id, '42');
  assert.equal(envelope.user.orgId, '7');
  assert.equal(envelope.user.sessionId, null);
});

test('build throws when the signing secret is missing (fail-closed)', () => {
  assert.throws(() => build(USER, {}), /secret required/);
});

test('verify rejects a tampered payload (signature no longer matches)', () => {
  const { payload, signature } = build(USER, { secret: SECRET });
  // Flip the first character of the payload to simulate tampering.
  const tampered = (payload[0] === 'A' ? 'B' : 'A') + payload.slice(1);
  assert.throws(() => verify(tampered, signature, { secret: SECRET }), (err) => {
    assert.equal(err.code, 'envelope_signature');
    return true;
  });
});

test('verify rejects a wrong secret', () => {
  const { payload, signature } = build(USER, { secret: SECRET });
  assert.throws(() => verify(payload, signature, { secret: 'a-different-secret-of-some-length' }), (err) => {
    assert.equal(err.code, 'envelope_signature');
    return true;
  });
});

test('verify rejects missing required fields', () => {
  assert.throws(() => verify('', '', { secret: SECRET }), (err) => {
    assert.equal(err.code, 'envelope_invalid');
    return true;
  });
});

test('verify rejects an expired envelope (replay window exceeded)', () => {
  const { payload, signature } = build(USER, { secret: SECRET, ttlSeconds: -120 });
  assert.throws(() => verify(payload, signature, { secret: SECRET }), (err) => {
    assert.equal(err.code, 'envelope_expired');
    return true;
  });
});
