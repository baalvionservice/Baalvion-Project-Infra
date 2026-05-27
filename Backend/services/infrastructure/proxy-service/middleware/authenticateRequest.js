'use strict';

/**
 * Unified authentication for the developer/programmatic API surface.
 *
 * Detects and validates, in priority order:
 *   1. API key      — `x-api-key: <key>` or `Authorization: Bearer bvl_…`
 *   2. JWT          — `Authorization: Bearer <jwt>` (RS256, session-validated)
 *   3. Basic        — `Authorization: Basic <b64>` (password treated as API key)
 *
 * Proxy gateway credentials (`Proxy-Authorization`) are handled by the
 * dedicated proxyAuthMiddleware. Organization MEMBERSHIP validation for JWT
 * users is still delegated to requireOrganizationAccess (compose after this).
 *
 * Attaches:
 *   req.auth = { type, organizationId, orgId, userId, apiKeyId, scopes,
 *                permissions, sessionId, plan }
 *   req.organization = { id, slug, plan, status }
 */

const jwtServer = require('../utils/jwtserver');
const sessionStore = require('../service/sessionStore');
const apiKeyService = require('../service/apiKeyService');
const { expandPermissions } = require('../service/rbac');
const rateLimiter = require('../service/rateLimiter');
const metrics = require('../observability/authMetrics');
const db = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../service/logger');

function writeAuthAudit(outcome, f) {
  db.auth_audit_logs.create({
    org_id: f.organizationId || null,
    auth_type: f.type || 'unknown',
    outcome,
    reason: f.reason || null,
    api_key_id: f.apiKeyId || null,
    user_id: f.userId != null && /^\d+$/.test(String(f.userId)) ? Number(f.userId) : null,
    ip_address: f.ip || null,
    user_agent: f.userAgent || null,
  }).catch((err) => logger.error('[authaudit] write failed:', err.message));
}

function persistFailure(identifier, f) {
  db.failed_auth_attempts.create({
    identifier,
    auth_type: f.type || 'unknown',
    reason: f.reason || null,
    ip_address: f.ip || null,
    org_id: f.organizationId || null,
  }).catch(() => {});
}

function detect(req) {
  const xApiKey = req.headers['x-api-key'];
  if (xApiKey) return { type: 'api_key', credential: String(xApiKey).trim() };

  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (apiKeyService.detectPrefix(token)) return { type: 'api_key', credential: token };
    return { type: 'jwt', credential: token };
  }
  if (auth && auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6).trim(), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const password = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    return { type: 'basic', credential: password };
  }
  return null;
}

async function loadOrg(orgId) {
  const org = await db.organizations.findByPk(orgId);
  if (!org) return null;
  return { id: org.id, slug: org.slug, plan: org.plan_slug, status: org.status };
}

async function authenticateRequest(req, res, next) {
  const started = Date.now();
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const detected = detect(req);
  if (!detected) {
    metrics.incAuthFailure('none', 'no_credentials');
    return next(new AppError('UNAUTHORIZED', 'No credentials provided', 401));
  }
  const type = detected.type === 'basic' ? 'api_key' : detected.type;

  // Brute-force lockout (per IP).
  if (await rateLimiter.isLockedOut(`ip:${ip}`)) {
    metrics.incAuthFailure(type, 'locked_out');
    writeAuthAudit('failure', { type, ip, userAgent, reason: 'locked_out' });
    return next(new AppError('LOCKED_OUT', 'Too many failed attempts — try again later', 429));
  }

  try {
    let ctx = null;

    if (type === 'jwt') {
      let claims;
      try { claims = jwtServer.verifyAccessToken(detected.credential); }
      catch (_) { return await fail('jwt', 'invalid_token'); }
      if (!claims.organizationId) return await fail('jwt', 'no_org_claim');
      if (claims.sessionId) {
        const active = await sessionStore.isSessionActive(claims.sessionId, claims.tokenVersion, claims.userId);
        if (!active) return await fail('jwt', 'session_revoked');
      }
      const role = claims.role || 'viewer';
      ctx = {
        type: 'jwt',
        organizationId: claims.organizationId,
        userId: claims.userId,
        apiKeyId: null,
        sessionId: claims.sessionId || null,
        scopes: [],
        permissions: expandPermissions(role, claims.permissions || []),
        role,
      };
    } else {
      const verified = await apiKeyService.verifyKey(detected.credential, { ip });
      if (!verified) return await fail('api_key', 'invalid_key');
      ctx = {
        type: 'api_key',
        organizationId: verified.organizationId,
        userId: null,
        apiKeyId: verified.apiKeyId,
        sessionId: null,
        scopes: verified.scopes,
        permissions: verified.permissions,
        role: 'api',
        environment: verified.environment,
      };
      metrics.incApiKeyUsage(verified.environment);
    }

    const org = await loadOrg(ctx.organizationId);
    if (!org) return await fail(ctx.type, 'org_not_found', ctx.organizationId);
    if (org.status && org.status !== 'active') return await fail(ctx.type, 'org_suspended', ctx.organizationId);

    req.auth = {
      type: ctx.type,
      authType: ctx.type === 'jwt' ? 'user' : ctx.type, // for requireOrganizationAccess
      organizationId: ctx.organizationId,
      orgId: ctx.organizationId,        // backward-compat alias
      userId: ctx.userId,
      apiKeyId: ctx.apiKeyId,
      scopes: ctx.scopes,
      permissions: ctx.permissions,
      sessionId: ctx.sessionId,
      role: ctx.role,                          // DEPRECATED scalar alias (DB-authoritative, single role)
      roles: ctx.role ? [ctx.role] : [],       // canonical roles[]
      plan: org.plan,
    };
    req.user = { id: ctx.userId, role: ctx.role, orgId: ctx.organizationId };
    req.organization = org;

    await rateLimiter.clearFailures(`ip:${ip}`);
    metrics.incAuthSuccess(ctx.type);
    metrics.observeAuthLatency(ctx.type, Date.now() - started);
    writeAuthAudit('success', { type: ctx.type, organizationId: ctx.organizationId, userId: ctx.userId, apiKeyId: ctx.apiKeyId, ip, userAgent });
    return next();
  } catch (err) {
    logger.error('[auth] unexpected error:', err.message);
    return next(new AppError('UNAUTHORIZED', 'Authentication failed', 401));
  }

  async function fail(t, reason, organizationId = null) {
    const n = await rateLimiter.recordFailure(`ip:${ip}`);
    persistFailure(`ip:${ip}`, { type: t, reason, ip, organizationId });
    writeAuthAudit('failure', { type: t, reason, ip, userAgent, organizationId });
    metrics.incAuthFailure(t, reason);
    const status = reason === 'org_suspended' ? 403 : 401;
    const code = reason === 'org_suspended' ? 'ORG_SUSPENDED' : 'UNAUTHORIZED';
    logger.warn(`[auth] failure type=${t} reason=${reason} ip=${ip} attempts=${n}`);
    return next(new AppError(code, reason === 'org_suspended' ? 'Organization is suspended' : 'Authentication failed', status));
  }
}

module.exports = authenticateRequest;
module.exports.authenticateRequest = authenticateRequest;
