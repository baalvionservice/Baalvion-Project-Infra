'use strict';
/**
 * War-room security E2E.
 *  P7: malformed JSON must return 400 (not 500).
 *  P3: a token whose JTI is revoked (auth:blacklist:<jti>) must be rejected at the resource service.
 *
 * Portable: drives Redis via `docker exec <container> redis-cli` (no ioredis dependency, no
 * absolute paths). Override the container with $REDIS_CONTAINER (default baalvion-redis).
 */
const http = require('http');
const { execFileSync } = require('child_process');
const { mintToken, STORE } = require('./mint.cjs');

const OS = Number(process.env.OS_PORT) || 3013;
const RB = Number(process.env.RBAC_PORT) || 3055;
const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'baalvion-redis';

function redisCli(...args) {
  return execFileSync('docker', ['exec', REDIS_CONTAINER, 'redis-cli', ...args], { encoding: 'utf8' }).trim();
}

function send({ port, method, path, token, raw, json }) {
  return new Promise((res) => {
    const body = raw !== undefined ? raw : (json !== undefined ? JSON.stringify(json) : null);
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: {
      'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(body != null ? { 'content-length': Buffer.byteLength(body) } : {}) } }, (r) => {
      let d = ''; r.on('data', (c) => (d += c));
      r.on('end', () => { let p; try { p = JSON.parse(d); } catch { p = d; } res({ status: r.statusCode, data: p }); });
    });
    req.on('error', (e) => res({ status: 0, data: e.message }));
    if (body != null) req.write(body); req.end();
  });
}
const pass = (c) => (c ? 'PASS ✅' : 'FAIL ❌');

(async () => {
  console.log('=== P7: malformed JSON -> 400 (not 500) ===');
  const o = await send({ port: OS, method: 'POST', path: `/api/v1/orders/stores/${STORE}/carts`, raw: '{ bad json,,,' });
  console.log('  order-service malformed body ->', o.status, o.data?.error?.code, pass(o.status === 400));
  const r = await send({ port: RB, method: 'POST', path: '/v1/tenants', raw: '{ bad json,,,' });
  console.log('  rbac-service  malformed body ->', r.status, r.data?.error?.code, pass(r.status === 400));

  console.log('\n=== P3: revoked JTI is rejected at the resource service ===');
  const tok = mintToken({ sub: '9000001', roles: ['end_user'] });
  const jti = JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).jti;
  const nonExistent = `/api/v1/orders/stores/${STORE}/orders/00000000-0000-4000-8000-000000000000`;
  const before = await send({ port: OS, method: 'GET', path: nonExistent, token: tok });
  console.log('  valid token (pre-revoke)  ->', before.status, '(404 = accepted+reached handler)', pass(before.status === 404));
  redisCli('SET', 'auth:blacklist:' + jti, '1', 'EX', '3600');
  console.log('  revoked jti', jti, 'in Redis (auth:blacklist:*)');
  const after = await send({ port: OS, method: 'GET', path: nonExistent, token: tok });
  console.log('  same token (post-revoke)  ->', after.status, after.data?.error?.code, pass(after.status === 401));
  redisCli('DEL', 'auth:blacklist:' + jti);
  console.log('\n=== DONE ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
