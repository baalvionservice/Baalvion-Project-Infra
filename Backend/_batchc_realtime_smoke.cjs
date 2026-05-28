/* Batch C realtime websocket-auth smoke (scratch, NOT committed).
 * Replicates realtime-service's exact _jwksVerifier config (RS256-only, canonical
 * requiredClaims, reject HS256) and asserts the WS token verification path:
 * canonical accepted (+canonical socket context), legacy/HS256/malformed rejected. */
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

// EXACT mirror of realtime-service/index.js _jwksVerifier config (post-migration).
const verifier = authNode.createJwksVerifier({
  issuer: 'baalvion-auth', audience: 'baalvion-platform',
  staticPublicKey: publicKey,
  rejectHs256: true,
  requiredClaims: ['sub', 'org_id', 'sid', 'jti'],
  validateRolesPermissions: true,
});

const mint = (opts, payload) => authNode.createAuthServer({ issuer: 'baalvion-auth', audience: 'baalvion-platform', env: 'development', ...opts }).generateAccessToken(payload);
const canonical = mint({ claimStyle: 'canonical' }, { userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'], permissions: ['read:org'] });
const legacy    = mint({ claimStyle: 'id' },        { id: 'u1', orgId: 'o1', sessionId: 's1', role: 'admin' });
const hs        = mint({ claimStyle: 'canonical', disableRs256: true, accessSecret: 'hs', hs256IncludeIssuerAudience: true }, { userId: 'u1', organizationId: 'o1', sessionId: 's1', roles: ['admin'] });

// Mirror of the socket auth middleware's canonical context mapping.
const toSocketData = (p) => ({
  userId: p.sub, orgId: p.org_id ?? null,
  roles: Array.isArray(p.roles) ? p.roles : (p.role != null ? [p.role] : []),
  permissions: Array.isArray(p.permissions) ? p.permissions : [],
  sessionId: p.sid ?? null, jti: p.jti ?? null,
});

(async () => {
  const results = [];
  try {
    const p = await verifier.verify(canonical);
    const d = toSocketData(p);
    results.push(['canonical RS256 -> accepted + canonical socket ctx', d.userId === 'u1' && d.orgId === 'o1' && d.sessionId === 's1' && Array.isArray(d.roles) && d.roles[0] === 'admin' && !!d.jti]);
  } catch (e) { results.push(['canonical RS256 -> accepted + canonical socket ctx', false, e.message]); }

  for (const [name, tok] of [['legacy id/orgId token -> REJECTED', legacy], ['HS256 token -> REJECTED', hs], ['malformed token -> REJECTED', 'abc.def.ghi']]) {
    let rejected = false;
    try { await verifier.verify(tok); } catch { rejected = true; }
    results.push([name, rejected]);
  }

  // Namespace allow-list check is roles[]-aware (mirror of index.js:238)
  const nsCheck = (roles, allowed) => allowed.length === 0 || roles.some((r) => allowed.includes(r));
  results.push(['namespace check roles[]-aware (admin in /admin allow-list)', nsCheck(['admin'], ['admin', 'super_admin']) === true]);
  results.push(['namespace check denies non-member (viewer not in /admin)', nsCheck(['viewer'], ['admin', 'super_admin']) === false]);

  let ok = true;
  for (const [name, pass, extra] of results) { console.log((pass ? '  PASS ' : '  FAIL ') + name + (extra ? ' :: ' + extra : '')); if (!pass) ok = false; }
  console.log(ok ? 'REALTIME WS SMOKE OK' : 'REALTIME WS SMOKE FAILED');
  process.exit(ok ? 0 : 1);
})();
