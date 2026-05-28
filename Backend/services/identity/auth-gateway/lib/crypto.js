'use strict';
// Gateway identity signing + fingerprint hashing.
// The gateway HMAC-signs the trusted identity (x-user-id/x-org-id/x-roles) so downstream
// backends can verify it ORIGINATED from the gateway (not a spoofed client header).
const crypto = require('crypto');
const config = require('../config/appConfig');

const SECRET = config.gatewaySigningSecret;

const _msg = (userId, orgId, roles) => `${userId}.${orgId || ''}.${(roles || []).join(',')}`;

function signIdentity(user) {
  return crypto.createHmac('sha256', SECRET).update(_msg(user.userId, user.orgId, user.roles)).digest('hex');
}

// Used by downstream backends (gatewayTrust). Returns the trusted identity or null.
function verifyIdentity(headers) {
  const userId = headers['x-user-id'];
  const orgId = headers['x-org-id'] || '';
  let roles = [];
  try { roles = JSON.parse(headers['x-roles'] || '[]'); } catch { /* malformed */ }
  const got = headers['x-gateway-signature'] || '';
  const expected = crypto.createHmac('sha256', SECRET).update(_msg(userId, orgId, roles)).digest('hex');
  if (!userId || got.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected)) ? { userId, orgId: orgId || null, roles } : null;
}

const sha256 = (v) => crypto.createHash('sha256').update(String(v || '')).digest('hex').slice(0, 32);
const genToken = () => crypto.randomBytes(24).toString('base64url');

module.exports = { signIdentity, verifyIdentity, sha256, genToken };
