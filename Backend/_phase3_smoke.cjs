/* Phase 3 middleware-level smoke (scratch, NOT committed).
 * Usage: node Backend/_phase3_smoke.cjs <abs path to service middleware/authMiddleware.js>
 * Mints real RS256/HS256/legacy tokens via auth-node and drives the service's
 * canonical middleware, asserting req.auth + RBAC + rejection of bad tokens. */
'use strict';
const crypto = require('crypto');
const path = require('path');
const AUTHNODE = path.resolve(__dirname, 'packages/auth-node');
const mwPath = process.argv[2];

// Local workspace symlinks aren't installed in this working tree (Docker bundles
// them via `pnpm deploy`). Shim the bare specifier so the service's
// require('@baalvion/auth-node') resolves to the local package for this smoke.
const Module = require('module');
const _origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === '@baalvion/auth-node') return _origResolve.call(this, AUTHNODE, ...rest);
  return _origResolve.call(this, request, ...rest);
};

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
// Set env BEFORE requiring the service config (dotenv won't override set vars).
Object.assign(process.env, {
  NODE_ENV: 'development',
  JWT_PUBLIC_KEY: publicKey, JWT_PRIVATE_KEY: privateKey,
  JWT_ISSUER: 'baalvion-auth', JWT_AUDIENCE: 'baalvion-platform',
  JWT_ACCESS_SECRET: 'smoke-access', JWT_REFRESH_SECRET: 'smoke-refresh',
  INTERNAL_SERVICE_SECRET: 'smoke-internal',
});

const authNode = require(AUTHNODE);
const mint = (opts, payload) => authNode.createAuthServer({ issuer: 'baalvion-auth', audience: 'baalvion-platform', env: 'development', ...opts }).generateAccessToken(payload);

const valid  = mint({ claimStyle: 'canonical' }, { userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'], permissions: ['read:org'] });
const legacy = mint({ claimStyle: 'id' },        { id: 'u1', orgId: 'o1', sessionId: 's1', role: 'admin' });
const hs     = mint({ claimStyle: 'canonical', disableRs256: true, accessSecret: 'hs', hs256IncludeIssuerAudience: true }, { userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'] });

const { authMiddleware } = require(mwPath);
const run = (tok) => new Promise((r) => {
  const req = { headers: tok ? { authorization: 'Bearer ' + tok } : {} };
  authMiddleware(req, {}, (e) => r({ e, auth: req.auth }));
});

(async () => {
  const results = [];
  const v = await run(valid);
  results.push(['valid canonical -> req.auth populated', !v.e && v.auth && v.auth.userId === 'u1' && v.auth.orgId === 'o1' && v.auth.sessionId === 's1' && Array.isArray(v.auth.roles) && v.auth.roles[0] === 'admin']);
  const n = await run(null);
  results.push(['no bearer -> 401', !!n.e && (n.e.status === 401 || n.e.statusCode === 401)]);
  const l = await run(legacy);
  results.push(['legacy id/orgId token -> rejected', !!l.e]);
  const h = await run(hs);
  results.push(['HS256 token -> rejected', !!h.e]);
  // RBAC (hierarchical) on the populated req.auth
  if (v.auth) {
    let lower = '?', higher = '?';
    authNode.requireRole('member')({ auth: v.auth }, {}, (e) => { lower = e ? 'deny' : 'pass'; });
    authNode.requireRole('super_admin')({ auth: v.auth }, {}, (e) => { higher = e ? 'deny' : 'pass'; });
    results.push(['RBAC admin >= member -> pass', lower === 'pass']);
    results.push(['RBAC admin < super_admin -> deny', higher === 'deny']);
  }
  let ok = true;
  for (const [name, pass] of results) { console.log((pass ? '  PASS ' : '  FAIL ') + name); if (!pass) ok = false; }
  console.log(ok ? 'SMOKE OK' : 'SMOKE FAILED');
  process.exit(ok ? 0 : 1);
})();
