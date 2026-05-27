import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createAuthMiddleware } = require('../index.js');
const jwt = require('jsonwebtoken');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const sign = (claims, iss) => jwt.sign(
  { sub: '42', org_id: 'o1', sid: 'imp1', roles: ['member'], jti: 'j1', ...claims },
  privateKey, { algorithm: 'RS256', issuer: iss, audience: 'baalvion-platform', expiresIn: '15m' },
);
// A consumer that opts in to honor the impersonation issuer (issuer accepts an array).
const mw = createAuthMiddleware({
  staticPublicKey: publicKey, issuer: ['baalvion-auth', 'baalvion-auth-impersonation'],
  audience: 'baalvion-platform', logger: { warn() {}, error() {} },
});
const run = (tok) => new Promise((resolve) => {
  const headers = {};
  const req = { headers: { authorization: 'Bearer ' + tok } };
  const res = { setHeader: (k, v) => { headers[k] = v; } };
  mw(req, res, (e) => resolve({ e, auth: req.auth, headers }));
});

test('impersonation token -> req.auth.isImpersonation + impersonatedBy + banner header', async () => {
  const { e, auth, headers } = await run(sign({ impersonation: true, impersonated_by: '7' }, 'baalvion-auth-impersonation'));
  assert.ok(!e, 'should verify');
  assert.equal(auth.isImpersonation, true);
  assert.equal(auth.impersonatedBy, '7');
  assert.equal(headers['x-baalvion-impersonation'], 'true');
});

test('normal canonical token -> isImpersonation false, no banner header', async () => {
  const { e, auth, headers } = await run(sign({}, 'baalvion-auth'));
  assert.ok(!e, 'should verify');
  assert.equal(auth.isImpersonation, false);
  assert.equal(auth.impersonatedBy, null);
  assert.equal(headers['x-baalvion-impersonation'], undefined);
});
