'use strict';

// Pure-config tests for appConfig.js — no DB, no network, no socket server.
// appConfig is a side-effect-free module that only reads process.env and builds
// a plain config object, so it is safe to require directly under node:test.
const test   = require('node:test');
const assert = require('node:assert');

const config = require('./appConfig');

test('exposes the canonical service identity and a numeric port', () => {
  assert.strictEqual(config.serviceName, 'realtime-service');
  assert.strictEqual(typeof config.port, 'number');
  assert.ok(config.port > 0);
});

test('allowedOrigins is always a non-empty array of strings', () => {
  assert.ok(Array.isArray(config.allowedOrigins));
  assert.ok(config.allowedOrigins.length > 0);
  for (const origin of config.allowedOrigins) {
    assert.strictEqual(typeof origin, 'string');
  }
});

test('namespaceRoles covers every served namespace with role allow-lists', () => {
  const expected = ['/dashboard', '/ir', '/jobs', '/admin', '/ctm'];
  for (const ns of expected) {
    assert.ok(Array.isArray(config.namespaceRoles[ns]), `${ns} should have roles`);
    assert.ok(config.namespaceRoles[ns].length > 0, `${ns} role list should be non-empty`);
  }
  // /admin is the most restricted namespace — members must not be admitted.
  assert.ok(!config.namespaceRoles['/admin'].includes('member'));
  assert.ok(config.namespaceRoles['/admin'].includes('admin'));
});

test('replay buffer config is internally consistent (ttl matches window)', () => {
  assert.strictEqual(typeof config.replay.maxEvents, 'number');
  assert.ok(config.replay.maxEvents > 0);
  // ttlSeconds (300) should equal windowMs (300_000) expressed in seconds.
  assert.strictEqual(config.replay.ttlSeconds * 1000, config.replay.windowMs);
});

test('rate-limit and heartbeat thresholds are positive numbers', () => {
  assert.ok(config.rateLimit.maxPerMinute > 0);
  assert.ok(config.heartbeat.intervalMs > 0);
});

test('bypassAuth is hard-disabled when NODE_ENV is production', () => {
  // Default-secure invariant: production must never honour JWT_BYPASS_AUTH.
  if (config.env === 'production') {
    assert.strictEqual(config.bypassAuth ?? config.jwt.bypassAuth, false);
  } else {
    assert.strictEqual(typeof config.jwt.bypassAuth, 'boolean');
  }
});
