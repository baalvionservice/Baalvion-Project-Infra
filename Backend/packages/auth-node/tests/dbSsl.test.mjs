// Tests for the shared Postgres TLS helper (dbSsl.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPgSsl, buildPgPoolSsl, buildPgDialectOptions, isDbTlsEnabled } = require('../dbSsl.js');

test('dev with no DB_SSL → TLS OFF (backward compatible localhost)', () => {
  const env = { NODE_ENV: 'development' };
  assert.equal(isDbTlsEnabled(env), false);
  assert.equal(buildPgSsl(env), false);
  assert.equal(buildPgPoolSsl(env), false);
  assert.deepEqual(buildPgDialectOptions(env), { ssl: false });
});

test('production with no DB_SSL → TLS ON, verify by default', () => {
  const env = { NODE_ENV: 'production' };
  assert.equal(isDbTlsEnabled(env), true);
  assert.deepEqual(buildPgSsl(env), { require: true, rejectUnauthorized: true });
  assert.deepEqual(buildPgPoolSsl(env), { rejectUnauthorized: true });
});

test('DB_SSL=true forces TLS on even in development', () => {
  const env = { NODE_ENV: 'development', DB_SSL: 'true' };
  assert.deepEqual(buildPgSsl(env), { require: true, rejectUnauthorized: true });
});

test('DB_SSL=false forces TLS off even in production', () => {
  const env = { NODE_ENV: 'production', DB_SSL: 'false' };
  assert.equal(buildPgSsl(env), false);
  assert.equal(buildPgPoolSsl(env), false);
});

test('DB_SSL_REJECT_UNAUTHORIZED=false opts out of cert verification', () => {
  const env = { NODE_ENV: 'production', DB_SSL_REJECT_UNAUTHORIZED: 'false' };
  assert.deepEqual(buildPgSsl(env), { require: true, rejectUnauthorized: false });
});

test('DB_SSL_CA (inline PEM) is pinned into the ssl object', () => {
  const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
  const env = { NODE_ENV: 'production', DB_SSL_CA: pem };
  const ssl = buildPgSsl(env);
  assert.equal(ssl.require, true);
  assert.equal(ssl.rejectUnauthorized, true);
  assert.equal(ssl.ca, pem);
});

test('accepts require/on/1/yes as truthy and disable/off/no as falsy', () => {
  for (const v of ['require', 'on', '1', 'yes', 'TRUE']) {
    assert.equal(isDbTlsEnabled({ DB_SSL: v }), true, `expected ${v} → on`);
  }
  for (const v of ['disable', 'off', '0', 'no', 'FALSE']) {
    assert.equal(isDbTlsEnabled({ DB_SSL: v, NODE_ENV: 'production' }), false, `expected ${v} → off`);
  }
});
