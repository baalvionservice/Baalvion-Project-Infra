'use strict';
/**
 * Single source of truth for the server-to-server internal secret used to authenticate
 * JVM payment-service ↔ proxy-service calls (x-internal-secret header).
 *
 * Two guarantees this module centralizes:
 *  1. No silent use of a publicly-known default in a DEPLOYED environment. A committed
 *     fallback only ever applies to local dev/test; any named deployed NODE_ENV
 *     (production, staging, preprod, …) fails fast at boot rather than authenticating
 *     real cross-service traffic with a string anyone with repo access knows.
 *  2. Constant-time, length-blind comparison. A raw `a.length !== b.length` early-exit
 *     leaks the secret's byte length via timing; hashing both sides to fixed 32-byte
 *     digests removes that channel entirely.
 */
const crypto = require('crypto');

const DEV_DEFAULT = 'baalvion-internal-dev-secret';
const env = String(process.env.NODE_ENV || '').toLowerCase();
// "Deployed" = NODE_ENV is set to something other than a local/dev/test marker. Unset
// NODE_ENV is treated as local (so `node --test` and bare `node index.js` dev runs work).
const isDeployed = env !== '' && env !== 'development' && env !== 'dev' && env !== 'test';

const raw = process.env.INTERNAL_SERVICE_SECRET || '';
const usingDefault = !raw || raw === DEV_DEFAULT;

if (usingDefault && isDeployed) {
  throw new Error(
    `INTERNAL_SERVICE_SECRET must be set to a non-default value (NODE_ENV=${env}). ` +
    'Refusing to authenticate server-to-server calls with the committed dev secret.'
  );
}

const SECRET = raw || DEV_DEFAULT;
const SECRET_DIGEST = crypto.createHash('sha256').update(SECRET).digest();

/**
 * Constant-time match of a provided header value against the configured secret.
 * Both sides are SHA-256'd first → equal-length (32-byte) buffers, so neither the
 * comparison time nor the early return reveals anything about the real secret.
 * @param {unknown} provided
 * @returns {boolean}
 */
function timingSafeMatch(provided) {
  const candidate = crypto.createHash('sha256').update(String(provided == null ? '' : provided)).digest();
  return crypto.timingSafeEqual(candidate, SECRET_DIGEST);
}

module.exports = { SECRET, timingSafeMatch };
