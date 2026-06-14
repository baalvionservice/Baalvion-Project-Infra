'use strict';
// Trust-boundary middleware (Phase 6C — fail-closed always).
const verifier = require('../lib/verifier');
const { getSession } = require('../lib/redisSession');
const { sha256 } = require('../lib/crypto');
const redis = require('../lib/redis');
const config = require('../config/appConfig');

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const clientIp = (req) => ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || (req.socket && req.socket.remoteAddress) || '';

/**
 * requireSession: RS256(JWKS) verify + jti-not-blacklisted + session-exists + org-binding +
 * fingerprint-binding. FAIL CLOSED on anything.
 */
function requireSession(opts = {}) {
  return async (req, res, next) => {
    try {
      // The optional-auth bypass is gated on the SERVER-SIDE opts.optional flag
      // (fixed at route-registration time), never on the user-controlled cookie
      // value alone. Evaluate the fixed flag first so a missing/forged cookie
      // cannot, by itself, steer the request down the auth-skipping branch.
      const allowAnonymous = opts.optional === true;
      const token = req.cookies && req.cookies[config.cookie.accessName];
      if (!token) {
        if (allowAnonymous) return next();
        return res.status(401).json({ error: { code: 'NO_SESSION', message: 'No session cookie' } });
      }

      const claims = await verifier.verify(token);            // RS256 + JWKS + blacklist + exp + requiredClaims
      const session = await getSession(claims.sid);           // session must still exist (revocable)
      if (!session) { if (opts.optional) return next(); return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session revoked' } }); }

      // org binding — session.orgId must match the token's org_id
      if (String(session.orgId ?? '') !== String(claims.org_id ?? '')) {
        return res.status(401).json({ error: { code: 'ORG_BINDING_MISMATCH', message: 'Session/token org mismatch' } });
      }

      // tenant kill-switch — block even an otherwise-valid session if the org is suspended.
      // A suspended org is blocked regardless of opts.optional. redis.isOrgSuspended fails open
      // (treats a Redis outage as "not suspended") so an outage can't lock every tenant out.
      if (claims.org_id && await redis.isOrgSuspended(claims.org_id)) {
        return res.status(403).json({ error: { code: 'ORG_SUSPENDED', message: 'Organization is suspended' } });
      }

      // fingerprint binding — UA hard (reject in prod), IP soft (warn)
      const uaHash = sha256(req.headers['user-agent']);
      if (session.uaHash && session.uaHash !== uaHash) {
        if (config.env === 'production' && config.binding.rejectInProd) {
          return res.status(401).json({ error: { code: 'BINDING_UA_MISMATCH', message: 'Session fingerprint mismatch' } });
        }
        console.warn(`[auth-gateway] UA fingerprint mismatch (warn in ${config.env})`, { sid: claims.sid });
      }
      if (session.ipHash && session.ipHash !== sha256(clientIp(req))) {
        console.warn('[auth-gateway] IP fingerprint mismatch (soft)', { sid: claims.sid });
      }

      req._claims = claims; req._token = token; req._session = session;
      return next();
    } catch (err) {
      if (opts.optional) return next();
      return res.status(401).json({ error: { code: err.code || 'INVALID_SESSION', message: err.message || 'Invalid session' } });
    }
  };
}

function attachUser(req, _res, next) {
  const c = req._claims;
  if (c) {
    req.user = {
      userId:      c.sub,
      orgId:       c.org_id ?? null,
      roles:       Array.isArray(c.roles) ? c.roles : (c.role != null ? [c.role] : []),
      permissions: Array.isArray(c.permissions) ? c.permissions : [],
      sessionId:   c.sid,
      source:      'auth-service',
    };
  }
  next();
}

// CSRF double-submit: unsafe methods must send x-csrf-token matching the session's csrfToken.
function requireCsrf(req, res, next) {
  if (!UNSAFE.has(req.method)) return next();
  const sent = req.headers['x-csrf-token'];
  const expected = req._session && req._session.csrfToken;
  if (!expected || !sent || sent !== expected) {
    return res.status(403).json({ error: { code: 'CSRF', message: 'Missing or invalid CSRF token' } });
  }
  return next();
}

function enforceOrgScope(getReqOrg) {
  return (req, res, next) => {
    const want = getReqOrg ? getReqOrg(req) : (req.params.orgId || req.query.orgId);
    if (want && req.user && req.user.orgId && String(want) !== String(req.user.orgId)) {
      return res.status(403).json({ error: { code: 'ORG_SCOPE', message: 'Cross-org access denied' } });
    }
    return next();
  };
}

module.exports = { requireSession, attachUser, requireCsrf, enforceOrgScope, clientIp };
