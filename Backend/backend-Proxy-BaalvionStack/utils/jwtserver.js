'use strict';

/**
 * JWT issuer / verifier.
 *
 * Access tokens are signed with RS256 using a key identified by `kid`, which
 * lets us rotate keys and expose a public JWKS endpoint so every other service
 * can verify Baalvion tokens without sharing a secret.
 *
 * During the migration away from the legacy HS256 shared-secret scheme,
 * verification can optionally accept HS256 tokens (JWT_ALLOW_HS256_FALLBACK).
 * This is enabled by default OUTSIDE production and disabled in production
 * unless explicitly turned on, so legacy tokens keep working for a bounded
 * cut-over window only.
 *
 * Refresh tokens are NOT JWTs — they are opaque, server-side and rotating;
 * see service/sessionStore.js. The legacy generate/verifyRefreshToken helpers
 * remain only for backward compatibility and are deprecated.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const logger = require('../service/logger');

const KEYS_DIR = process.env.JWT_KEYS_DIR || path.resolve(__dirname, '../config/keys');
const ACTIVE_KID = process.env.JWT_ACTIVE_KID || 'baalvion-key-1';
const ISSUER = process.env.JWT_ISSUER || 'baalvion-auth';
const AUDIENCE = process.env.JWT_AUDIENCE || 'baalvion-platform';
const HS256_FALLBACK =
  (process.env.JWT_ALLOW_HS256_FALLBACK || (config.env !== 'production' ? 'true' : 'false')) === 'true';

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; }
}

function normalizePem(value) {
  if (!value) return null;
  return value.includes('-----BEGIN') ? value.replace(/\\n/g, '\n') : readFileSafe(value);
}

// ── Private (signing) key ─────────────────────────────────────────────────────
let privatePem =
  normalizePem(process.env.JWT_PRIVATE_KEY) ||
  readFileSafe(path.join(KEYS_DIR, `${ACTIVE_KID}.key`)) ||
  readFileSafe(path.join(KEYS_DIR, 'private.pem'));

// ── Public (verification) keys: { kid: pem } ──────────────────────────────────
function loadPublicKeys() {
  const map = {};

  if (process.env.JWT_PUBLIC_KEYS) {
    try {
      const parsed = JSON.parse(process.env.JWT_PUBLIC_KEYS);
      for (const [kid, pem] of Object.entries(parsed)) map[kid] = String(pem).replace(/\\n/g, '\n');
    } catch (err) {
      logger.error('[jwt] failed to parse JWT_PUBLIC_KEYS:', err.message);
    }
  }

  const single = normalizePem(process.env.JWT_PUBLIC_KEY);
  if (single) map[ACTIVE_KID] = single;

  try {
    for (const file of fs.readdirSync(KEYS_DIR)) {
      if (file.endsWith('.pub')) map[file.replace(/\.pub$/, '')] = fs.readFileSync(path.join(KEYS_DIR, file), 'utf8');
    }
  } catch (_) { /* keys dir optional */ }

  return map;
}

let publicKeys = loadPublicKeys();
let RS256_ENABLED = Boolean(privatePem && Object.keys(publicKeys).length);

if (!RS256_ENABLED) {
  if (config.env === 'production' && !HS256_FALLBACK) {
    throw new Error('[jwt] RS256 keys missing and HS256 fallback disabled — refusing to start in production');
  }
  logger.error('[jwt] RS256 keys not found — using HS256 fallback. Run scripts/generateKeys.js and set JWT_* env for production.');
}

function reloadKeys() {
  privatePem =
    normalizePem(process.env.JWT_PRIVATE_KEY) ||
    readFileSafe(path.join(KEYS_DIR, `${ACTIVE_KID}.key`)) ||
    readFileSafe(path.join(KEYS_DIR, 'private.pem'));
  publicKeys = loadPublicKeys();
  RS256_ENABLED = Boolean(privatePem && Object.keys(publicKeys).length);
  return RS256_ENABLED;
}

function buildClaims(p) {
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
  return {
    ...decoded,
    userId: decoded.sub ?? decoded.id,
    organizationId: decoded.organizationId ?? decoded.orgId ?? null,
    tokenVersion: Number.isInteger(decoded.tokenVersion) ? decoded.tokenVersion : 0,
  };
}

function generateAccessToken(payload) {
  const claims = buildClaims(payload);
  if (RS256_ENABLED) {
    return jwt.sign(claims, privatePem, {
      algorithm: 'RS256',
      keyid: ACTIVE_KID,
      expiresIn: config.jwt.accessExpiresIn,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  }
  return jwt.sign(claims, config.jwt.accessSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessExpiresIn,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

function verifyAccessToken(token) {
  const header = (jwt.decode(token, { complete: true }) || {}).header || {};

  if (RS256_ENABLED && header.alg === 'RS256') {
    const pem = publicKeys[header.kid] || publicKeys[ACTIVE_KID];
    if (!pem) throw new Error('Unknown token key id');
    return normalize(jwt.verify(token, pem, { algorithms: ['RS256'], issuer: ISSUER, audience: AUDIENCE }));
  }

  if (HS256_FALLBACK && (!header.alg || header.alg === 'HS256')) {
    // Legacy tokens may lack issuer/audience — verify signature + expiry only.
    return normalize(jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] }));
  }

  throw new Error('Unsupported or untrusted token algorithm');
}

/** RFC 7517 JWKS document for /.well-known/jwks.json */
function getJwks() {
  const keys = [];
  for (const [kid, pem] of Object.entries(publicKeys)) {
    try {
      const jwk = crypto.createPublicKey(pem).export({ format: 'jwk' });
      keys.push({ ...jwk, kid, use: 'sig', alg: 'RS256' });
    } catch (err) {
      logger.error('[jwt] could not export JWK for kid', kid, err.message);
    }
  }
  return { keys };
}

// ── Deprecated legacy refresh helpers (kept for backward compatibility) ───────
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, orgId: user.orgId ?? user.organizationId, sessionId: user.sessionId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn },
  );
}
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  getJwks,
  reloadKeys,
  isRs256Enabled: () => RS256_ENABLED,
  // deprecated:
  generateRefreshToken,
  verifyRefreshToken,
};
