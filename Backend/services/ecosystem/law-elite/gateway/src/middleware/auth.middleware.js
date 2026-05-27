'use strict';
// Canonical auth (Phase 4 A4): verify RS256 tokens against auth-service's JWKS via
// @baalvion/auth-node. HS256 verification REMOVED. law-elite is a dead-demo sub-stack with no
// real users/issuer (user-service is an in-memory array); this swaps the one HS256 verify site
// to the canonical verifier for consistency. Tokens are issued ONLY by auth-service.
const { createJwksVerifier } = require('@baalvion/auth-node');

const verifier = createJwksVerifier({
  jwksUri:                  process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json',
  issuer:                   process.env.JWT_ISSUER   || 'baalvion-auth',
  audience:                 process.env.JWT_AUDIENCE || 'baalvion-platform',
  rejectHs256:              true,
  requiredClaims:           ['sub', 'org_id', 'sid', 'jti'],
  validateRolesPermissions: true,
});

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED: Credentials required' });
  const token = authHeader.split(' ')[1] || '';
  try {
    const claims = await verifier.verify(token);
    // Canonical context forwarded to proxied services.
    req.user = {
      userId:    claims.sub,
      orgId:     claims.org_id ?? null,
      roles:     Array.isArray(claims.roles) ? claims.roles : (claims.role != null ? [claims.role] : []),
      sessionId: claims.sid ?? null,
    };
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'FORBIDDEN: Invalid or non-canonical token' });
  }
};
