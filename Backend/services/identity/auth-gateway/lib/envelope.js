'use strict';
// Phase 7 — v2 signed identity envelope.
// Replaces v1 per-header identity (x-user-id / x-org-id / x-roles / x-gateway-signature).
// Transport: x-identity-envelope (base64url JSON payload) + x-envelope-sig (HMAC-SHA256 hex).
// Replay protection: default 30-second TTL in expires_at.
const crypto = require('crypto');

const DEFAULT_TTL = 30;

/**
 * Build a signed v2 identity envelope.
 * @param {object} user  { userId|id, orgId, roles[], sessionId, permissions[] }
 * @param {object} opts  { secret, region, workloadId, geo: { country, source }, ttlSeconds }
 * @returns {{ payload: string, signature: string }}
 *   payload   = base64url(JSON.stringify(envelope))
 *   signature = HMAC-SHA256(secret, payload) hex
 */
function build(user, { secret, region = 'local', workloadId = 'auth-gateway', geo = null, ttlSeconds = DEFAULT_TTL } = {}) {
  if (!secret) throw new Error('envelope.build: secret required');
  const now = Math.floor(Date.now() / 1000);
  const envelope = {
    v: 2,
    user: {
      id:          String(user.userId || user.id || ''),
      orgId:       user.orgId != null ? String(user.orgId) : null,
      roles:       Array.isArray(user.roles) ? user.roles : [],
      sessionId:   user.sessionId != null ? String(user.sessionId) : null,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    },
    workload: { id: workloadId, region },
    geo: {
      country: (geo && geo.country) || 'unknown',
      source:  (geo && geo.source)  || 'none',
    },
    issued_at:  now,
    expires_at: now + ttlSeconds,
  };
  const payload   = Buffer.from(JSON.stringify(envelope)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { payload, signature };
}

/**
 * Verify a signed v2 identity envelope.
 * @param {string} payload    base64url(JSON)
 * @param {string} signature  HMAC-SHA256 hex
 * @param {object} opts       { secret, clockSkewSeconds }
 * @returns {object}  parsed envelope (throws on any failure)
 */
function verify(payload, signature, { secret, clockSkewSeconds = 5 } = {}) {
  if (!payload || !signature || !secret) {
    throw Object.assign(new Error('envelope_invalid: missing required fields'), { code: 'envelope_invalid', status: 401 });
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw Object.assign(new Error('envelope_signature: HMAC mismatch'), { code: 'envelope_signature', status: 401 });
  }
  let envelope;
  try {
    envelope = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw Object.assign(new Error('envelope_parse: malformed JSON'), { code: 'envelope_parse', status: 401 });
  }
  if (envelope.v !== 2) {
    throw Object.assign(new Error(`envelope_version: unsupported v${envelope.v}`), { code: 'envelope_version', status: 401 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (envelope.expires_at < now - clockSkewSeconds) {
    throw Object.assign(new Error('envelope_expired: replay window exceeded'), { code: 'envelope_expired', status: 401 });
  }
  if (envelope.issued_at > now + clockSkewSeconds) {
    throw Object.assign(new Error('envelope_future: issued_at in the future'), { code: 'envelope_future', status: 401 });
  }
  return envelope;
}

module.exports = { build, verify, DEFAULT_TTL };
