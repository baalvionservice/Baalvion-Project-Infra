'use strict';

/**
 * HTTP proxy authentication middleware.
 *
 * Reads `Proxy-Authorization: Basic <b64(username:password)>`, parses the
 * structured username for routing directives and authenticates the password as
 * a bvl_proxy_ key. On success it attaches the auth + directive context for the
 * forwarder (the data-plane gateway will consume this). Responds with 407 +
 * `Proxy-Authenticate` on failure, per RFC 7235.
 *
 * NOTE: this performs authentication only — it does not forward traffic. The
 * SOCKS5 / HTTPS-CONNECT data plane consumes service/proxyAuth.js directly.
 */

const proxyAuth = require('../service/proxyAuth');
const rateLimiter = require('../service/rateLimiter');
const metrics = require('../observability/authMetrics');
const db = require('../models');
const logger = require('../service/logger');

function parseBasic(headerValue) {
  if (!headerValue || !headerValue.startsWith('Basic ')) return null;
  const decoded = Buffer.from(headerValue.slice(6).trim(), 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  if (idx < 0) return null;
  return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
}

function deny(res, reason) {
  metrics.incAuthFailure('proxy', reason);
  res.set('Proxy-Authenticate', 'Basic realm="Baalvion Proxy"');
  return res.status(407).json({ success: false, error: { code: 'PROXY_AUTH_REQUIRED', message: 'Proxy authentication required' } });
}

async function proxyAuthMiddleware(req, res, next) {
  const ip = req.ip;
  const creds = parseBasic(req.headers['proxy-authorization']);
  if (!creds) return deny(res, 'no_credentials');

  if (await rateLimiter.isLockedOut(`proxyip:${ip}`)) return deny(res, 'locked_out');

  const result = await proxyAuth.authenticateProxy({ username: creds.username, password: creds.password, ip });

  if (!result.ok) {
    await rateLimiter.recordFailure(`proxyip:${ip}`);
    db.failed_auth_attempts.create({ identifier: `proxyip:${ip}`, auth_type: 'proxy', reason: result.reason, ip_address: ip }).catch(() => {});
    db.auth_audit_logs.create({ auth_type: 'proxy', outcome: 'failure', reason: result.reason, ip_address: ip }).catch(() => {});
    logger.warn(`[proxyauth] failure reason=${result.reason} ip=${ip}`);
    return deny(res, result.reason);
  }

  await rateLimiter.clearFailures(`proxyip:${ip}`);
  metrics.incAuthSuccess('proxy');
  db.auth_audit_logs.create({
    auth_type: 'proxy', outcome: 'success', org_id: result.organizationId,
    api_key_id: result.apiKeyId, ip_address: ip,
  }).catch(() => {});

  req.auth = {
    type: 'proxy',
    organizationId: result.organizationId,
    orgId: result.organizationId,
    apiKeyId: result.apiKeyId,
    scopes: result.scopes,
    permissions: result.permissions,
  };
  req.proxyDirectives = result.directives;
  return next();
}

module.exports = proxyAuthMiddleware;
module.exports.proxyAuthMiddleware = proxyAuthMiddleware;
