'use strict';

/**
 * API-key authentication middleware (programmatic clients).
 *
 * Thin wrapper over apiKeyService (single source of truth for key
 * verification). Accepts `x-api-key`, `Authorization: Bearer bvl_…/bns_…`, or
 * `Proxy-Authorization`. Populates the standard req.auth contract so downstream
 * guards (requireOrganizationAccess / requirePermissions / requireScopes) work
 * uniformly. For richer auth (JWT + key + Basic + lockout + metrics) use
 * middleware/authenticateRequest.js instead.
 */

const apiKeyService = require('../service/apiKeyService');
const { AppError } = require('../utils/errors');
const logger = require('../service/logger');

function extractKey(req) {
  if (req.headers['x-api-key']) return String(req.headers['x-api-key']).trim();
  for (const raw of [req.headers['authorization'], req.headers['proxy-authorization']]) {
    if (!raw) continue;
    const value = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
    if (apiKeyService.detectPrefix(value)) return value;
  }
  return null;
}

async function authenticateApiKey(req, res, next) {
  try {
    const rawKey = extractKey(req);
    if (!rawKey) return next(new AppError('UNAUTHORIZED', 'API key required', 401));

    const ctx = await apiKeyService.verifyKey(rawKey, { ip: req.ip });
    if (!ctx) return next(new AppError('UNAUTHORIZED', 'Invalid or expired API key', 401));

    req.auth = {
      authType: 'api_key',
      type: 'api_key',
      apiKeyId: ctx.apiKeyId,
      userId: null,
      organizationId: ctx.organizationId,
      orgId: ctx.organizationId,
      role: 'api',
      scopes: ctx.scopes,
      permissions: ctx.permissions,
    };
    req.user = { id: null, role: 'api', orgId: ctx.organizationId };
    return next();
  } catch (err) {
    logger.error('[apikey] auth failure:', err.message);
    return next(new AppError('UNAUTHORIZED', 'API key authentication failed', 401));
  }
}

module.exports = authenticateApiKey;
module.exports.authenticateApiKey = authenticateApiKey;
