'use strict';

/**
 * @baalvion/auth-node — canonical backend JWT authority.
 *
 * This is the ONLY module in the monorepo permitted to import `jsonwebtoken`
 * (enforced by catalog/enforce.mjs, condition C3 "no auth duplication"). Every
 * backend service consumes token verification / issuance through here via a
 * thin `utils/jwtserver.js` adapter that injects its own config.
 *
 * It supports the full union of behaviours that previously lived in ~20 copied
 * `jwtserver.js` files, selectable per service so each adapter is byte-for-byte
 * behaviour-preserving:
 *
 *   - verify-only services        → createAuthServer({ accessSecret })
 *   - verify + raw sign passthrough → ... + signAccessToken(payload, ttl)
 *   - legacy HS256 issuer (auth)  → claimStyle:'id'
 *   - modern RS256/JWKS issuer    → claimStyle:'sub', normalizeClaims:true, keys
 *
 * RS256 + JWKS is the target scheme: access tokens are signed RS256 with a `kid`
 * so any service can verify via the public JWKS without sharing a secret. HS256
 * remains as a bounded migration fallback. A service that configures no RS256
 * keys transparently stays on HS256 — identical to its old behaviour — but gains
 * the ability to verify RS256 tokens the moment keys are present.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { requireEnv } = require('./requireEnv');
const rbac = require('./rbac');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; }
}

function normalizePem(value) {
  if (!value) return null;
  return value.includes('-----BEGIN') ? value.replace(/\\n/g, '\n') : readFileSafe(value);
}

/**
 * Classified verification error. `code` lets callers/middleware distinguish
 * failure modes (alg_not_allowed, missing_claim, revoked, …) without string-matching.
 */
class VerifyError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'VerifyError';
    this.code = code;
  }
}

/** Express-friendly auth error: carries an HTTP status + a machine code. */
function makeAuthError(status, code, message) {
  const err = new Error(message || code);
  err.name = 'AuthError';
  err.status = status;
  err.statusCode = status;
  err.code = code;
  return err;
}

/**
 * @param {object} opts
 * @param {string}  [opts.accessSecret]        HS256 shared secret
 * @param {string}  [opts.refreshSecret]       HS256 refresh secret
 * @param {string|number} [opts.accessExpiresIn='24h']
 * @param {string|number} [opts.refreshExpiresIn='7d']
 * @param {string}  [opts.env=process.env.NODE_ENV]
 * @param {string}  [opts.keysDir]             dir holding <kid>.key / *.pub PEMs
 * @param {string}  [opts.activeKid]
 * @param {string}  [opts.issuer]
 * @param {string}  [opts.audience]
 * @param {boolean} [opts.allowHs256Fallback]  default: env !== 'production'
 * @param {boolean} [opts.requireRs256InProduction=false]
 * @param {boolean} [opts.normalizeClaims=false] add userId/organizationId to decoded
 * @param {'sub'|'id'} [opts.claimStyle='sub']   claim shape for generateAccessToken
 * @param {object}  [opts.logger=console]
 */
function createAuthServer(opts = {}) {
  const {
    accessSecret,
    refreshSecret,
    accessExpiresIn = '24h',
    refreshExpiresIn = '7d',
    env = process.env.NODE_ENV,
    normalizeClaims = false,
    claimStyle = 'sub',
    requireRs256InProduction = false,
    logger = console,
  } = opts;

  const KEYS_DIR = opts.keysDir || process.env.JWT_KEYS_DIR;
  const ACTIVE_KID = opts.activeKid || process.env.JWT_ACTIVE_KID || 'baalvion-key-1';
  const ISSUER = opts.issuer || process.env.JWT_ISSUER || 'baalvion-auth';
  const AUDIENCE = opts.audience || process.env.JWT_AUDIENCE || 'baalvion-platform';
  // Verification enforces iss/aud ONLY when explicitly configured (no hardcoded
  // default), matching hand-rolled verifiers that pass undefined when unset.
  const verifyIssuer = opts.issuer || process.env.JWT_ISSUER || null;
  const verifyAudience = opts.audience || process.env.JWT_AUDIENCE || null;
  const hs256FallbackDefault = env !== 'production';
  const allowHs256Fallback =
    opts.allowHs256Fallback != null
      ? opts.allowHs256Fallback
      : (process.env.JWT_ALLOW_HS256_FALLBACK
          ? process.env.JWT_ALLOW_HS256_FALLBACK === 'true'
          : hs256FallbackDefault);

  // ── key material ───────────────────────────────────────────────────────────
  function loadPrivate() {
    return (
      normalizePem(process.env.JWT_PRIVATE_KEY) ||
      (KEYS_DIR && readFileSafe(path.join(KEYS_DIR, `${ACTIVE_KID}.key`))) ||
      (KEYS_DIR && readFileSafe(path.join(KEYS_DIR, 'private.pem'))) ||
      null
    );
  }
  function loadPublicKeys() {
    const map = {};
    if (process.env.JWT_PUBLIC_KEYS) {
      try {
        const parsed = JSON.parse(process.env.JWT_PUBLIC_KEYS);
        for (const [kid, pem] of Object.entries(parsed)) map[kid] = String(pem).replace(/\\n/g, '\n');
      } catch (err) { logger.error('[auth-node] bad JWT_PUBLIC_KEYS:', err.message); }
    }
    const single = normalizePem(process.env.JWT_PUBLIC_KEY);
    if (single) map[ACTIVE_KID] = single;
    if (KEYS_DIR) {
      try {
        for (const f of fs.readdirSync(KEYS_DIR)) {
          if (f.endsWith('.pub')) map[f.replace(/\.pub$/, '')] = fs.readFileSync(path.join(KEYS_DIR, f), 'utf8');
        }
      } catch (_) { /* keys dir optional */ }
    }
    return map;
  }

  const disableRs256 = opts.disableRs256 === true; // force legacy HS256 regardless of ambient keys
  function applyStaticKey(map) {
    // A verify-only service may inject its resolved RS256 public PEM directly.
    const staticPub = normalizePem(opts.publicKey);
    if (staticPub) map[ACTIVE_KID] = staticPub;
    return map;
  }
  let privatePem = disableRs256 ? null : loadPrivate();
  let publicKeys = disableRs256 ? {} : applyStaticKey(loadPublicKeys());
  // Verifying RS256 needs only a public key; issuing RS256 needs the private key too.
  let canVerifyRs256 = Object.keys(publicKeys).length > 0;
  let canIssueRs256 = Boolean(privatePem && canVerifyRs256);

  if (!canIssueRs256 && env === 'production' && requireRs256InProduction && !allowHs256Fallback) {
    throw new Error('[auth-node] RS256 keys missing and HS256 fallback disabled — refusing to start in production');
  }

  // HS256 is the only path when no RS256 verify key is present; otherwise it is a gated fallback.
  const hs256Allowed = () => !canVerifyRs256 || allowHs256Fallback;

  function reloadKeys() {
    privatePem = disableRs256 ? null : loadPrivate();
    publicKeys = disableRs256 ? {} : applyStaticKey(loadPublicKeys());
    canVerifyRs256 = Object.keys(publicKeys).length > 0;
    canIssueRs256 = Boolean(privatePem && canVerifyRs256);
    return canIssueRs256;
  }

  // ── claims ───────────────────────────────────────────────────────────────
  function buildClaims(p) {
    if (claimStyle === 'id') {
      return {
        jti: crypto.randomUUID(),
        id: p.id,
        email: p.email,
        orgId: p.orgId ?? p.organizationId,
        role: p.role,
        permissions: p.permissions || [],
        sessionId: p.sessionId,
      };
    }
    if (claimStyle === 'canonical') {
      // The Phase 2 canonical contract: RS256, sub/org_id/sid/roles[]/permissions[]/jti.
      // `role` (scalar) is emitted ONLY as a deprecated one-phase compat alias.
      const roles = Array.isArray(p.roles) ? p.roles : (p.role != null ? [p.role] : []);
      return {
        sub: String(p.userId ?? p.id ?? p.sub),
        email: p.email,
        org_id: p.org_id ?? p.organizationId ?? p.orgId ?? null,
        sid: p.sid ?? p.sessionId ?? null,
        roles,
        role: roles[0] ?? null,                                   // DEPRECATED compat
        permissions: Array.isArray(p.permissions) ? p.permissions : [],
        tokenVersion: Number.isInteger(p.tokenVersion) ? p.tokenVersion : 0,
        jti: crypto.randomUUID(),
      };
    }
    return {
      sub: String(p.userId ?? p.id ?? p.sub),
      email: p.email,
      organizationId: p.organizationId ?? p.orgId ?? null,
      role: p.role,
      permissions: p.permissions || [],
      sessionId: p.sessionId || null,
      tokenVersion: Number.isInteger(p.tokenVersion) ? p.tokenVersion : 0,
      jti: crypto.randomUUID(),
    };
  }
  function normalize(decoded) {
    if (!normalizeClaims) return decoded;
    // Canonical-aware: read canonical (org_id/sid/roles) first, fall back to the
    // legacy aliases, and expose BOTH names during the migration window so
    // existing consumers (which read organizationId/sessionId) keep working.
    const orgId = decoded.org_id ?? decoded.organizationId ?? decoded.orgId ?? null;
    const sid   = decoded.sid ?? decoded.sessionId ?? null;
    const roles = Array.isArray(decoded.roles) ? decoded.roles : (decoded.role != null ? [decoded.role] : []);
    return {
      ...decoded,
      userId:         decoded.sub ?? decoded.id,
      org_id:         orgId,
      organizationId: orgId,
      sid,
      sessionId:      sid,
      roles,
      tokenVersion:   Number.isInteger(decoded.tokenVersion) ? decoded.tokenVersion : 0,
    };
  }

  // ── issue ──────────────────────────────────────────────────────────────────
  function generateAccessToken(payload) {
    const claims = buildClaims(payload);
    if (canIssueRs256) {
      return jwt.sign(claims, privatePem, {
        algorithm: 'RS256', keyid: ACTIVE_KID, expiresIn: accessExpiresIn, issuer: ISSUER, audience: AUDIENCE,
      });
    }
    const hsOpts = { algorithm: 'HS256', expiresIn: accessExpiresIn };
    if (opts.hs256IncludeIssuerAudience) { hsOpts.issuer = ISSUER; hsOpts.audience = AUDIENCE; }
    return jwt.sign(claims, accessSecret, hsOpts);
  }

  // Raw passthrough sign — preserves the legacy signAccessToken(payload, ttl) API.
  function signAccessToken(payload, expiresIn = accessExpiresIn) {
    return jwt.sign(payload, accessSecret, { expiresIn });
  }

  function generateRefreshToken(user) {
    const base = { id: user.id, orgId: user.orgId ?? user.organizationId, sessionId: user.sessionId };
    // jti included by default (auth-service legacy); opt out for issuers that omit it (proxy).
    const claims = opts.refreshIncludeJti === false ? base : { jti: crypto.randomUUID(), ...base };
    return jwt.sign(claims, refreshSecret, { expiresIn: refreshExpiresIn });
  }

  // ── verify ───────────────────────────────────────────────────────────────
  function verifyAccessToken(token) {
    const header = (jwt.decode(token, { complete: true }) || {}).header || {};
    if (canVerifyRs256 && header.alg === 'RS256') {
      const pem = publicKeys[header.kid] || publicKeys[ACTIVE_KID];
      if (!pem) throw new Error('Unknown token key id');
      const vo = { algorithms: ['RS256'] };
      if (verifyIssuer) vo.issuer = verifyIssuer;
      if (verifyAudience) vo.audience = verifyAudience;
      return normalize(jwt.verify(token, pem, vo));
    }
    if (hs256Allowed() && (!header.alg || header.alg === 'HS256')) {
      return normalize(jwt.verify(token, accessSecret, { algorithms: ['HS256'] }));
    }
    throw new Error('Unsupported or untrusted token algorithm');
  }

  function verifyRefreshToken(token) {
    // Refresh tokens are HS256 (signed with refreshSecret) — pin the algorithm
    // so a caller can never be tricked into accepting another alg.
    return jwt.verify(token, refreshSecret, { algorithms: ['HS256'] });
  }

  // ── JWKS ─────────────────────────────────────────────────────────────────
  function getJwks() {
    const keys = [];
    for (const [kid, pem] of Object.entries(publicKeys)) {
      try {
        const jwk = crypto.createPublicKey(pem).export({ format: 'jwk' });
        keys.push({ ...jwk, kid, use: 'sig', alg: 'RS256' });
      } catch (err) { logger.error('[auth-node] could not export JWK for', kid, err.message); }
    }
    return { keys };
  }

  return {
    generateAccessToken,
    signAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getJwks,
    reloadKeys,
    isRs256Enabled: () => canIssueRs256,
  };
}

/**
 * Remote-JWKS verifier for edge services that verify against the issuer's public
 * JWKS endpoint rather than holding key material. Async. Cascade (preserving the
 * realtime-service behaviour): JWKS (cached) → static RSA public key → HS256 secret.
 *
 * @param {object} opts
 * @param {string}  [opts.jwksUri]            issuer JWKS endpoint
 * @param {number}  [opts.jwksTtlMs=300000]   cache TTL
 * @param {string}  [opts.issuer] [opts.audience]   enforced only when set
 * @param {string}  [opts.staticPublicKey] [opts.staticPublicKeyB64]   RSA fallback
 * @param {string}  [opts.hs256Secret]        shared-secret fallback
 */
function createJwksVerifier(opts = {}) {
  const {
    jwksUri, jwksTtlMs = 300000, issuer, audience,
    staticPublicKey, staticPublicKeyB64, hs256Secret,
    requiredClaims = [], isBlacklisted, rejectHs256 = false,
    validateRolesPermissions = false, logger = console,
  } = opts;
  let _keys = null, _at = 0;

  function fetchJwks() {
    if (!jwksUri) return Promise.reject(new Error('No JWKS URI configured'));
    if (_keys && (Date.now() - _at) < jwksTtlMs) return Promise.resolve(_keys);
    return new Promise((resolve, reject) => {
      const mod = jwksUri.startsWith('https') ? https : http;
      const req = mod.get(jwksUri, { timeout: 5000 }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`JWKS fetch HTTP ${res.statusCode}`));
          try { _keys = JSON.parse(body).keys; _at = Date.now(); resolve(_keys); }
          catch { reject(new Error('Invalid JWKS JSON')); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('JWKS fetch timeout')); });
    });
  }
  const jwkToPem = (jwk) => crypto.createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  const rsaOpts = () => { const o = { algorithms: ['RS256'] }; if (issuer) o.issuer = issuer; if (audience) o.audience = audience; return o; };

  // Canonical-contract enforcement. Opt-in via opts — default is a no-op so
  // existing legacy callers (e.g. realtime-service) are byte-for-byte unaffected.
  async function assertValid(payload) {
    for (const claim of requiredClaims) {
      const v = payload[claim];
      if (v === undefined || v === null || v === '') {
        throw new VerifyError('missing_claim', `Required claim '${claim}' is missing`);
      }
    }
    if (validateRolesPermissions) {
      if (payload.roles !== undefined && !Array.isArray(payload.roles)) {
        throw new VerifyError('malformed_roles', 'Claim "roles" must be an array');
      }
      if (payload.permissions !== undefined && !Array.isArray(payload.permissions)) {
        throw new VerifyError('malformed_permissions', 'Claim "permissions" must be an array');
      }
    }
    if (typeof isBlacklisted === 'function' && payload.jti) {
      let revoked;
      try {
        revoked = await isBlacklisted(payload.jti);
      } catch (e) {
        // Fail CLOSED: a revocation-store outage must not let tokens through.
        logger.error('[auth-node] blacklist lookup failed:', e.message);
        throw new VerifyError('blacklist_unavailable', 'Revocation check failed');
      }
      if (revoked) throw new VerifyError('revoked', 'Token has been revoked (jti blacklisted)');
    }
    return payload;
  }

  async function verify(token) {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new VerifyError('malformed', 'Malformed token');
    const kid = decoded.header?.kid;
    const alg = decoded.header?.alg;

    // RS256-only mode rejects any non-RS256 alg before attempting verification.
    if (rejectHs256 && alg && alg !== 'RS256') {
      throw new VerifyError('alg_not_allowed', `Algorithm '${alg}' is not allowed (RS256 only)`);
    }

    let payload;
    if (alg === 'RS256' || !alg) {
      try {
        const keys = await fetchJwks();
        const jwk = kid ? keys.find((k) => k.kid === kid) : keys[0];
        if (!jwk) throw new VerifyError('unknown_kid', `No JWKS key for kid=${kid}`);
        payload = jwt.verify(token, jwkToPem(jwk), rsaOpts());
      } catch (jwksErr) {
        const raw = staticPublicKey || (staticPublicKeyB64 ? Buffer.from(staticPublicKeyB64, 'base64').toString('utf8') : null);
        if (raw) { try { payload = jwt.verify(token, raw, rsaOpts()); } catch { /* fall through */ } }
        if (payload === undefined && (!hs256Secret || rejectHs256)) throw jwksErr;
      }
    }
    if (payload === undefined) {
      if (!hs256Secret || rejectHs256) throw new VerifyError('no_method', 'No valid JWT verification method available');
      payload = jwt.verify(token, hs256Secret, { algorithms: ['HS256'] });
    }
    return assertValid(payload);
  }

  return { verify, fetchJwks, resetCache() { _keys = null; _at = 0; } };
}

/**
 * Canonical Express auth middleware — Phase 2 "One True Middleware".
 *
 * Verifies an RS256 token against the issuer's JWKS, enforces the canonical
 * claim contract (sub/org_id/sid/jti + array roles/permissions), checks the JTI
 * blacklist, then populates req.auth. Invalid tokens FAIL HARD — there is no
 * legacy id/orgId/sessionId coercion in canonical mode.
 *
 * @param {object} opts
 * @param {string}   opts.jwksUri
 * @param {string}   [opts.issuer]
 * @param {string}   [opts.audience]
 * @param {string[]} [opts.requiredClaims=['sub','org_id','sid','jti']]
 * @param {(jti:string)=>Promise<boolean>} [opts.isBlacklisted]
 * @param {number}   [opts.jwksTtlMs]
 * @param {string}   [opts.staticPublicKey] [opts.staticPublicKeyB64]
 */
function createAuthMiddleware(opts = {}) {
  const {
    jwksUri, issuer, audience,
    requiredClaims = ['sub', 'org_id', 'sid', 'jti'],
    isBlacklisted, jwksTtlMs, staticPublicKey, staticPublicKeyB64,
  } = opts;

  const verifier = createJwksVerifier({
    jwksUri, issuer, audience, jwksTtlMs, staticPublicKey, staticPublicKeyB64,
    requiredClaims, isBlacklisted,
    rejectHs256: true,
    validateRolesPermissions: true,
  });

  async function canonicalAuth(req, res, next) {
    const header = (req.headers && req.headers.authorization) || '';
    if (!header.startsWith('Bearer ')) {
      return next(makeAuthError(401, 'unauthorized', 'Bearer token required'));
    }
    try {
      const c = await verifier.verify(header.slice(7).trim());
      const roles = Array.isArray(c.roles) ? c.roles : (c.role != null ? [c.role] : []);
      req.auth = {
        userId:      c.sub,
        orgId:       c.org_id,
        sessionId:   c.sid,
        roles,
        permissions: Array.isArray(c.permissions) ? c.permissions : [],
        jti:         c.jti,
        issuer:      c.iss,
        audience:    c.aud,
      };
      return next();
    } catch (err) {
      return next(makeAuthError(401, err.code || 'invalid_token', err.message || 'Invalid or expired token'));
    }
  }
  // Expose the verifier for tests / non-Express callers.
  canonicalAuth.verifier = verifier;
  return canonicalAuth;
}

module.exports = {
  createAuthServer, createJwksVerifier, createAuthMiddleware, requireEnv, VerifyError,
  // Hierarchical, roles[]-aware RBAC guards (see ./rbac.js)
  ...rbac,
};
