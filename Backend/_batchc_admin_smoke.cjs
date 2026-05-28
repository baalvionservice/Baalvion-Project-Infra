/* Batch C admin impersonation-isolation smoke (scratch, NOT committed).
 * Proves: admin verifies ONLY canonical iss='baalvion-auth'; an impersonation
 * token (iss='baalvion-auth-impersonation') is REJECTED by normal auth (isolated);
 * impersonation TTL <= 15m and issuer config is the distinct value. */
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
  JWT_PUBLIC_KEY: publicKey, JWT_PRIVATE_KEY: privateKey,
  JWT_ISSUER: 'baalvion-auth', JWT_AUDIENCE: 'baalvion-platform',
});

const authNode = require(AUTHNODE);
const mkServer = (issuer) => authNode.createAuthServer({ issuer, audience: 'baalvion-platform', env: 'development', claimStyle: 'canonical' });
const normal = mkServer('baalvion-auth').generateAccessToken({ userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'] });
const imper  = mkServer('baalvion-auth-impersonation').generateAccessToken({ userId: 'u9', organizationId: 'o1', sessionId: 'imp1', roles: ['member'] });

const adminBase = path.resolve(__dirname, 'services/platform/admin-service');
const { authMiddleware } = require(path.join(adminBase, 'middleware/authMiddleware.js'));
const config = require(path.join(adminBase, 'config/appConfig.js'));

const run = (tok) => new Promise((r) => {
  const req = { headers: { authorization: 'Bearer ' + tok } };
  authMiddleware(req, {}, (e) => r({ e, auth: req.auth }));
});

(async () => {
  const results = [];
  const n = await run(normal);
  results.push(['normal canonical (iss=baalvion-auth) -> accepted', !n.e && n.auth && n.auth.userId === 'u1']);
  const i = await run(imper);
  results.push(['impersonation token (iss=baalvion-auth-impersonation) -> REJECTED by normal auth (isolated)', !!i.e]);
  results.push(['impersonation issuer config is distinct', config.jwt.impersonationIssuer === 'baalvion-auth-impersonation']);
  results.push(['impersonation TTL <= 15m', config.impersonationTtl <= 15 * 60]);
  let ok = true;
  for (const [name, pass] of results) { console.log((pass ? '  PASS ' : '  FAIL ') + name); if (!pass) ok = false; }
  console.log(ok ? 'ADMIN IMPERSONATION SMOKE OK' : 'ADMIN IMPERSONATION SMOKE FAILED');
  process.exit(ok ? 0 : 1);
})();
