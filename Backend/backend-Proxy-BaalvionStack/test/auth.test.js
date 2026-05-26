'use strict';

// Pure-logic unit tests — runnable with `npm test` (node --test), no DB/Redis.
// DB/Redis-backed integration + auth-bypass tests are described in the PR notes
// and require a live Postgres + Redis (see deployment instructions).

const { test } = require('node:test');
const assert = require('node:assert');

const { parseProxyUsername } = require('../service/proxyAuth');
const apiKeyService = require('../service/apiKeyService');
const { scopesToPermissions } = require('../service/rbac');
const { timingSafeEqualHex, sha256 } = require('../utils/crypto');

test('parseProxyUsername: customer/zone/session → sticky', () => {
  const d = parseProxyUsername('customer-123-zone-us-session-abc123');
  assert.strictEqual(d.customer, '123');
  assert.strictEqual(d.zone, 'us');
  assert.strictEqual(d.session, 'abc123');
  assert.strictEqual(d.rotation, 'sticky'); // session implies sticky
});

test('parseProxyUsername: explicit rotation + country lowercased', () => {
  const d = parseProxyUsername('customer-9-country-DE-rotation-rotating');
  assert.strictEqual(d.country, 'de');
  assert.strictEqual(d.rotation, 'rotating');
  assert.strictEqual(d.session, null);
});

test('parseProxyUsername: no directives → rotating default', () => {
  const d = parseProxyUsername('justsomething');
  assert.strictEqual(d.rotation, 'rotating');
});

test('apiKeyService.detectPrefix recognizes all environments + legacy', () => {
  assert.strictEqual(apiKeyService.detectPrefix('bvl_live_abc'), 'bvl_live_');
  assert.strictEqual(apiKeyService.detectPrefix('bvl_test_abc'), 'bvl_test_');
  assert.strictEqual(apiKeyService.detectPrefix('bvl_proxy_abc'), 'bvl_proxy_');
  assert.strictEqual(apiKeyService.detectPrefix('bns_legacy'), 'bns_');
  assert.strictEqual(apiKeyService.detectPrefix('eyJhbGciOi.x.y'), null); // a JWT, not a key
});

test('scopesToPermissions maps canonical proxy scopes', () => {
  const perms = scopesToPermissions(['proxy:connect', 'usage:read']);
  assert.ok(perms.includes('proxy:view'));
  assert.ok(perms.includes('usage:view'));
  const wild = scopesToPermissions(['*']);
  assert.deepStrictEqual(wild, ['*']);
});

test('timingSafeEqualHex: equal hashes match, different do not, length-mismatch false', () => {
  const a = sha256('bvl_live_secret');
  assert.strictEqual(timingSafeEqualHex(a, a), true);
  assert.strictEqual(timingSafeEqualHex(a, sha256('other')), false);
  assert.strictEqual(timingSafeEqualHex(a, 'deadbeef'), false);
});
