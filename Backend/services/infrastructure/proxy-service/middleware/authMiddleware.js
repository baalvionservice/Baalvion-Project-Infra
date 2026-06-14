'use strict';

/**
 * User authentication middleware.
 *
 * SECURITY: organization identity is derived ONLY from the verified JWT.
 * Client-supplied tenant hints (X-Org-Id, x-org-id, orgId/tenantId headers,
 * query/body org ids) are IGNORED. This closes the cross-tenant header
 * injection vulnerability.
 *
 * After signature verification we also validate the session server-side
 * (session not revoked + tokenVersion current) so logout / password change /
 * "log out everywhere" take effect immediately.
 *
 * Exports the middleware as the default (`require('.../authMiddleware')`) for
 * backward compatibility, and as a named `{ authMiddleware }`.
 */

const jwtServer = require('../utils/jwtserver');
const sessionStore = require('../service/sessionStore');
const { expandPermissions } = require('../service/rbac');
const { AppError } = require('../utils/errors');
const logger = require('../service/logger');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return next(new AppError('UNAUTHORIZED', 'No bearer token provided', 401));

    let claims;
    try {
      claims = jwtServer.verifyAccessToken(token);
    } catch (err) {
      return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }

    // Canonical-first (Phase 2): prefer org_id, fall back to the legacy
    // organizationId alias during the migration window (normalizeClaims exposes both).
    const organizationId = claims.org_id ?? claims.organizationId;
    if (!organizationId) {
      return next(new AppError('UNAUTHORIZED', 'Token is missing organization context', 401));
    }

    // Server-side session validation applies ONLY to proxy-issued tokens (HS256),
    // whose sessions live in this service's store. Central-authority tokens (RS256
    // from auth-service — e.g. the admin console) are cryptographically verified
    // (signature + issuer + audience + expiry) and their session lifecycle is owned
    // by the central auth, which this service cannot introspect, so we trust them.
    let tokenAlg = null;
    try { tokenAlg = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString()).alg; } catch (_) { /* ignore */ }
    const isCentralRs256 = tokenAlg === 'RS256';
    if (claims.sessionId && !isCentralRs256) {
      const active = await sessionStore.isSessionActive(claims.sessionId, claims.tokenVersion, claims.userId);
      if (!active) return next(new AppError('SESSION_REVOKED', 'Session is no longer valid', 401));
    }

    const roles = Array.isArray(claims.roles) ? claims.roles : (claims.role != null ? [claims.role] : []);
    const role = roles[0] || claims.role || 'viewer';
    req.auth = {
      authType: 'user',
      userId: claims.userId,
      email: claims.email,
      organizationId,                 // token-derived ONLY
      orgId: organizationId,          // backward-compat alias (controllers read req.auth.orgId)
      role,                           // DEPRECATED scalar alias (one migration phase)
      roles,                          // canonical
      permissions: expandPermissions(role, claims.permissions || []),
      sessionId: claims.sid ?? claims.sessionId ?? null,
      jti: claims.jti ?? null,
      tokenVersion: claims.tokenVersion,
    };
    // Backward-compat shape consumed by legacy code paths:
    req.user = { id: claims.userId, role, orgId: organizationId };

    return next();
  } catch (err) {
    logger.error('[auth] unexpected failure:', err.message);
    return next(new AppError('UNAUTHORIZED', 'Authentication failed', 401));
  }
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
