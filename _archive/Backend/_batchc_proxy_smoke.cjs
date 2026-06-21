/* Batch C proxy issuer/verifier smoke (scratch, NOT committed).
 * proxy is a sanctioned self-issuer. Asserts: it issues + verifies its own canonical
 * RS256 tokens; emitted claims are canonical (org_id/sid, NO organizationId/sessionId);
 * HS256 tokens are REJECTED (allowHs256Fallback:false). */
'use strict';
const crypto = require('crypto');
const path = require('path');
const AUTHNODE = path.resolve(__dirname, 'packages/auth-node');
const Module = require('module');
const _r = Module._resolveFilename;
Module._resolveFilename = function (req, ...rest) {
  if (req === '@baalvion/auth-node') return _r.call(this, AUTHNODE, ...rest);
  return _r.call(this, req, ...rest);
};
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
Object.assign(process.env, {
  NODE_ENV: 'development',
  JWT_ACCESS_SECRET: 'smoke-access', JWT_REFRESH_SECRET: 'smoke-refresh',
  JWT_PUBLIC_KEY: publicKey, JWT_PRIVATE_KEY: privateKey,
  JWT_ISSUER: 'baalvion-auth', JWT_AUDIENCE: 'baalvion-platform',
  JWT_KEYS_DIR: path.resolve(__dirname, '_nonexistent_keys_dir'), // force env-key-only
});
const proxyBase = path.resolve(__dirname, 'services/infrastructure/proxy-service');
const jwtServer = require(path.join(proxyBase, 'utils/jwtserver.js'));
const authNode = require(AUTHNODE);
const jwt = require(path.join(AUTHNODE, 'node_modules', 'jsonwebtoken'));

const token = jwtServer.generateAccessToken({ userId: 'u1', email: 'u@x.io', organizationId: 'o1', sessionId: 's1', roles: ['admin'], permissions: ['read:org'] });
const hs = authNode.createAuthServer({ issuer: 'baalvion-auth', audience: 'baalvion-platform', env: 'development', claimStyle: 'canonical', disableRs256: true, accessSecret: 'smoke-access', hs256IncludeIssuerAudience: true }).generateAccessToken({ userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'] });

const results = [];
try {
  const c = jwtServer.verifyAccessToken(token);
  results.push(['proxy issues + verifies its own canonical RS256', c.sub === 'u1' && c.org_id === 'o1' && c.sid === 's1' && Array.isArray(c.roles) && c.roles[0] === 'admin' && !!c.jti]);
} catch (e) { results.push(['proxy issues + verifies its own canonical RS256', false, e.message]); }

const d = jwt.decode(token);
results.push(['emitted claims canonical (org_id/sid present; organizationId/sessionId ABSENT)', d.org_id !== undefined && d.sid !== undefined && d.organizationId === undefined && d.sessionId === undefined && Array.isArray(d.roles)]);

let hsRejected = false;
try { jwtServer.verifyAccessToken(hs); } catch { hsRejected = true; }
results.push(['HS256 token -> REJECTED (RS256-only)', hsRejected]);

let ok = true;
for (const [name, pass, extra] of results) { console.log((pass ? '  PASS ' : '  FAIL ') + name + (extra ? ' :: ' + extra : '')); if (!pass) ok = false; }
console.log(ok ? 'PROXY SMOKE OK' : 'PROXY SMOKE FAILED');
process.exit(ok ? 0 : 1);
