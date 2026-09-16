'use strict';
/**
 * @baalvion/gateway-bridge — verify an identity injected by auth-gateway.
 *
 * The gateway is the platform's trust boundary: it authenticates the session, then STRIPS the
 * Authorization header and injects signed identity headers instead. A backend behind it therefore
 * cannot verify a bearer token — it has to verify the gateway's signature. That logic was
 * copy-pasted into trade-service and insiders-service; a third copy in marketplace-service would
 * be three independent implementations of the same security check, which is how they drift.
 *
 * Extracted verbatim from trade-service/middleware/bffBridge.js (the more evolved of the two),
 * with lib/islandSessionNormalizer.js's normalizeGateway inlined so the package stands alone.
 * The existing two copies are intentionally left untouched — they work, and swapping a live auth
 * path is a separate, independently verifiable change.
 *
 *   ISLAND_AUTH_MODE  legacy | hybrid (default) | strict | rs256_only
 *   GATEWAY_SIGNING_SECRET  shared with auth-gateway; without it nothing verifies.
 */
const crypto = require('crypto');
function normalizeGateway({ userId, orgId, roles, sessionId } = {}) {
  return {
    userId:      userId != null ? String(userId) : '',
    orgId:       orgId || null,
    roles:       Array.isArray(roles) ? roles : [],
    permissions: [],                 // not carried in headers (hybrid: the injected JWT still has them)
    sessionId:   sessionId || null,
    email:       null,
    source:      'gateway',          // 6E-5 contract
    algorithm:   'RS256-gateway',
  };
}

const mode   = () => (process.env.ISLAND_AUTH_MODE || 'hybrid').toLowerCase();
const secret = () => process.env.GATEWAY_SIGNING_SECRET || '';

// v2 envelope detection
const hasEnvelope = (req) => !!(req.headers['x-identity-envelope'] && req.headers['x-envelope-sig']);
// v1 header detection
const hasV1 = (req) => !!(req.headers['x-gateway-signature'] || req.headers['x-user-id']);
// Either gateway format present
const hasGatewayHeaders = (req) => hasEnvelope(req) || hasV1(req);

function verifyEnvelope(headers) {
  const sec = secret();
  if (!sec) return null;
  const payload = headers['x-identity-envelope'] || '';
  const sig     = headers['x-envelope-sig']      || '';
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', sec).update(payload).digest('hex');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let envelope;
  try { envelope = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (envelope.v !== 2) return null;
  const now = Math.floor(Date.now() / 1000);
  if (envelope.expires_at < now - 5) return null;  // replay window exceeded
  if (envelope.issued_at  > now + 5) return null;  // issued in the future
  return envelope;
}

function verifyGatewayIdentity(headers) {
  const sec = secret();
  if (!sec) return null;
  const userId = headers['x-user-id'];
  const orgId  = headers['x-org-id'] || '';
  let roles = [];
  try { roles = JSON.parse(headers['x-roles'] || '[]'); } catch { /* malformed → [] */ }
  const sig = headers['x-gateway-signature'] || '';
  if (!userId || !sig) return null;
  const expected = crypto.createHmac('sha256', sec).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return normalizeGateway({ userId, orgId, roles, sessionId: headers['x-session-id'] });
}

/**
 * bffBridge(req) → exactly one of:
 *   { identity }            verified gateway identity (canonical req.auth shape)
 *   { reject:true, code }   gateway headers present but INVALID, or strict-mode with none
 *   null                    no gateway identity → caller uses the legacy bearer path
 */
function bffBridge(req) {
  const m = mode();
  if (m === 'legacy') return null;

  if (hasEnvelope(req)) {
    // v2 path: NEVER fall through to v1 if envelope header is present
    const envelope = verifyEnvelope(req.headers);
    if (!envelope) return { reject: true, code: 'BAD_ENVELOPE_SIGNATURE' };
    const identity = normalizeGateway({
      userId:    envelope.user.id,
      orgId:     envelope.user.orgId,
      roles:     envelope.user.roles,
      sessionId: envelope.user.sessionId,
    });
    identity.permissions = envelope.user.permissions || [];
    identity.geo         = envelope.geo              || null;
    return { identity };
  }

  if (hasV1(req)) {
    const identity = verifyGatewayIdentity(req.headers);
    if (identity) return { identity };
    return { reject: true, code: 'BAD_GATEWAY_SIGNATURE' };
  }

  if (m === 'strict') return { reject: true, code: 'NO_GATEWAY_IDENTITY' };
  return null;  // hybrid / rs256_only + no gateway headers → bearer fallback
}

module.exports = { bffBridge, hasGatewayHeaders, verifyGatewayIdentity, mode };
