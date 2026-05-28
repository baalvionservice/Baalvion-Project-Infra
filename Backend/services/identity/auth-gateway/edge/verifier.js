'use strict';
// Phase 7 — edge RS256 verifier. Uses the Web Crypto API only — no Node.js-specific modules.
// Compatible with: Cloudflare Workers, Deno Deploy, modern browsers, Node.js 19+.
// For Cloudflare Workers deployment: convert module.exports → export { verifyJwt }.
// For Node.js < 19: pass opts.subtle = require('crypto').webcrypto.subtle.

const _keyCache = new Map();

function getSubtle(opts = {}) {
  if (opts.subtle) return opts.subtle;
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto.subtle;
  // Node.js 15-18 webcrypto
  try { return require('crypto').webcrypto.subtle; } catch { /* */ }
  throw new Error('Web Crypto API unavailable — pass opts.subtle or upgrade to Node.js 19+');
}

async function fetchJwks(jwksUri) {
  const res = await globalThis.fetch(jwksUri);
  if (!res.ok) throw Object.assign(new Error(`JWKS fetch failed: ${res.status}`), { code: 'jwks_fetch_failed' });
  return res.json();
}

async function getKey(jwksUri, kid, subtle) {
  const cacheKey = `${jwksUri}::${kid || '*'}`;
  if (_keyCache.has(cacheKey)) return _keyCache.get(cacheKey);
  const jwks = await fetchJwks(jwksUri);
  const jwk = kid
    ? jwks.keys.find((k) => k.kid === kid)
    : jwks.keys.find((k) => k.alg === 'RS256' || k.use === 'sig');
  if (!jwk) throw Object.assign(new Error('No matching JWK found'), { code: 'jwk_not_found', status: 401 });
  const key = await subtle.importKey(
    'jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify'],
  );
  _keyCache.set(cacheKey, key);
  return key;
}

function b64urlDecode(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad), (c) => c.charCodeAt(0));
}

/**
 * Verify an RS256 JWT using the Web Crypto API.
 * @param {string} token    Raw JWT string.
 * @param {object} opts     { jwksUri, issuer, audience, subtle? }
 * @returns {Promise<object>}  Verified claims.
 */
async function verifyJwt(token, { jwksUri, issuer, audience, subtle: subtleOverride } = {}) {
  const subtle = getSubtle({ subtle: subtleOverride });
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw Object.assign(new Error('Malformed JWT'), { code: 'jwt_malformed', status: 401 });

  const [headerB64, payloadB64, sigB64] = parts;
  let header, claims;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlDecode(headerB64)));
    claims = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
  } catch {
    throw Object.assign(new Error('JWT decode error'), { code: 'jwt_decode', status: 401 });
  }

  if (header.alg !== 'RS256') {
    throw Object.assign(new Error(`Unsupported algorithm: ${header.alg}`), { code: 'alg_not_allowed', status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) throw Object.assign(new Error('Token expired'), { code: 'token_expired', status: 401 });
  if (claims.nbf && claims.nbf > now + 5) throw Object.assign(new Error('Token not yet valid'), { code: 'token_nbf', status: 401 });
  if (issuer && claims.iss !== issuer) throw Object.assign(new Error(`iss mismatch: ${claims.iss}`), { code: 'iss_mismatch', status: 401 });
  if (audience) {
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(audience)) throw Object.assign(new Error('aud mismatch'), { code: 'aud_mismatch', status: 401 });
  }

  const key = await getKey(jwksUri, header.kid, subtle);
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature    = b64urlDecode(sigB64);
  const valid = await subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);
  if (!valid) throw Object.assign(new Error('Signature verification failed'), { code: 'sig_invalid', status: 401 });

  return claims;
}

// Clear cached keys (e.g., on JWKS rotation)
function clearKeyCache() { _keyCache.clear(); }

module.exports = { verifyJwt, clearKeyCache };
