'use strict';
// BACKEND ENFORCEMENT CONTRACT (Phase 6C) — drop this into downstream services.
// In STRICT mode, backends TRUST the gateway instead of verifying JWTs: this verifies the gateway's
// HMAC signature over the identity headers (only the gateway holds GATEWAY_SIGNING_SECRET), then
// populates req.auth from x-user-id / x-org-id / x-roles. A spoofed client header fails the signature.
const crypto = require('crypto');

module.exports = function gatewayTrust({ secret = process.env.GATEWAY_SIGNING_SECRET, required = true } = {}) {
  if (!secret) throw new Error('[gatewayTrust] GATEWAY_SIGNING_SECRET is required');
  return function (req, res, next) {
    const userId = req.headers['x-user-id'];
    const orgId = req.headers['x-org-id'] || '';
    let roles = [];
    try { roles = JSON.parse(req.headers['x-roles'] || '[]'); } catch { /* malformed → empty */ }
    const sig = req.headers['x-gateway-signature'] || '';
    if (!userId || !sig) {
      if (required) return res.status(401).json({ error: { code: 'NO_GATEWAY_IDENTITY', message: 'Missing gateway identity' } });
      return next();
    }
    const expected = crypto.createHmac('sha256', secret).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return res.status(401).json({ error: { code: 'BAD_GATEWAY_SIGNATURE', message: 'Untrusted gateway identity' } });
    }
    req.auth = { userId, orgId: orgId || null, roles, source: 'gateway' };
    return next();
  };
};
