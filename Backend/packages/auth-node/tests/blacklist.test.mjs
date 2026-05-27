import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const authNode = require('../index.js');
const jwt = require('jsonwebtoken');

const { createJwksVerifier, blacklistKey, ttlFromExp, revokeJti, BLACKLIST_PREFIX } = authNode;

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const mint = (claims = {}) => jwt.sign(
  { sub: 'u1', org_id: 'o1', sid: 's1', jti: 'jti-123', roles: ['admin'], ...claims },
  privateKey, { algorithm: 'RS256', issuer: 'baalvion-auth', audience: 'baalvion-platform', expiresIn: '15m' },
);
const silent = { warn() {}, error() {}, log() {} };
const mkVerifier = (redis) => createJwksVerifier({
  staticPublicKey: publicKey, issuer: 'baalvion-auth', audience: 'baalvion-platform',
  rejectHs256: true, requiredClaims: ['sub', 'org_id', 'sid', 'jti'], redis, logger: silent,
});
// ioredis-style in-memory mock
const mockRedis = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return { store, async get(k) { return store.has(k) ? store.get(k) : null; }, async set(k, v) { store.set(k, v); return 'OK'; } };
};

test('canonical namespace + key', () => {
  assert.equal(BLACKLIST_PREFIX, 'auth:blacklist:');
  assert.equal(blacklistKey('abc'), 'auth:blacklist:abc');
});

test('ttlFromExp = token expiry delta (floored at 1)', () => {
  assert.equal(ttlFromExp(1300, 1000), 300);
  assert.equal(ttlFromExp(1000, 1000), 1);
  assert.equal(ttlFromExp(undefined), 900);
});

test('active token accepted', async () => {
  const p = await mkVerifier(mockRedis()).verify(mint({ jti: 'active-1' }));
  assert.equal(p.sub, 'u1');
});

test('blacklisted token rejected with reason "blacklisted"', async () => {
  const redis = mockRedis({ 'auth:blacklist:revoked-1': '1' });
  await assert.rejects(() => mkVerifier(redis).verify(mint({ jti: 'revoked-1' })), (e) => e.code === 'blacklisted');
});

test('revokeJti writes the canonical key (auth:blacklist:<jti>)', async () => {
  const redis = mockRedis();
  await revokeJti(redis, 'tok-9', ttlFromExp(Math.floor(Date.now() / 1000) + 600));
  assert.equal(redis.store.get('auth:blacklist:tok-9'), '1');
});

test('blacklist expiry: once the key is gone the token verifies again', async () => {
  const redis = mockRedis({ 'auth:blacklist:exp-1': '1' });
  await assert.rejects(() => mkVerifier(redis).verify(mint({ jti: 'exp-1' })), (e) => e.code === 'blacklisted');
  redis.store.delete('auth:blacklist:exp-1'); // simulate TTL expiry
  const p = await mkVerifier(redis).verify(mint({ jti: 'exp-1' }));
  assert.equal(p.sub, 'u1');
});

test('Redis outage fails CLOSED (blacklist_unavailable)', async () => {
  const downRedis = { async get() { throw new Error('ECONNREFUSED'); } };
  await assert.rejects(() => mkVerifier(downRedis).verify(mint({ jti: 'x' })), (e) => e.code === 'blacklist_unavailable');
});
