'use strict';
// Verifies the trust boundary: only a correctly signed gateway identity is accepted, and any
// tampering with the user, org or roles invalidates it. These run in CI via the node:test gate.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

process.env.GATEWAY_SIGNING_SECRET = 'test-secret';
const { bffBridge } = require('./index.js');

const sign = (u, o, r, sec = 'test-secret') =>
  crypto.createHmac('sha256', sec).update(`${u}.${o}.${r.join(',')}`).digest('hex');
const req = (headers) => ({ headers });
const good = () => ({
  'x-user-id': 'u1', 'x-org-id': 'org1', 'x-roles': JSON.stringify(['admin']),
  'x-session-id': 's1', 'x-gateway-signature': sign('u1', 'org1', ['admin']),
});

test('accepts a correctly signed gateway identity', () => {
  const r = bffBridge(req(good()));
  assert.equal(r.identity.userId, 'u1');
  assert.equal(r.identity.orgId, 'org1');
  assert.deepEqual(r.identity.roles, ['admin']);
  assert.equal(r.identity.source, 'gateway');
});

test('rejects a signature made with the wrong secret', () => {
  const h = { ...good(), 'x-gateway-signature': sign('u1', 'org1', ['admin'], 'wrong') };
  assert.equal(bffBridge(req(h)).reject, true);
});

test('rejects escalated roles — the signature covers them', () => {
  const h = { ...good(), 'x-roles': JSON.stringify(['super_admin']) };
  assert.equal(bffBridge(req(h)).reject, true);
});

test('rejects a swapped org — the signature covers it', () => {
  const h = { ...good(), 'x-org-id': 'org2' };
  assert.equal(bffBridge(req(h)).reject, true);
});

test('hybrid: no gateway headers falls through to the bearer path', () => {
  assert.equal(bffBridge(req({})), null);
});

test('strict: no gateway identity is refused outright', () => {
  process.env.ISLAND_AUTH_MODE = 'strict';
  assert.equal(bffBridge(req({})).reject, true);
  delete process.env.ISLAND_AUTH_MODE;
});

test('legacy: the bridge is disabled entirely', () => {
  process.env.ISLAND_AUTH_MODE = 'legacy';
  assert.equal(bffBridge(req(good())), null);
  delete process.env.ISLAND_AUTH_MODE;
});
