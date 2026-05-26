'use strict';

/**
 * Developer/programmatic API (authenticated by API key or JWT).
 * Issues proxy session credentials, exposes usage, and rotates keys.
 */

const db = require('../models');
const analyticsService = require('../service/analyticsService');
const apiKeyService = require('../service/apiKeyService');
const rateLimiter = require('../service/rateLimiter');
const usageAttribution = require('../service/usageAttribution');
const domainEvents = require('../service/domainEvents');
const metrics = require('../observability/authMetrics');
const { generateToken } = require('../utils/crypto');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const GATEWAY_HOST = process.env.PROXY_GATEWAY_HOST || 'gw.baalvion.net';
const GATEWAY_PORT = Number(process.env.PROXY_GATEWAY_PORT || 8000);

const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res, next); } catch (err) { next(err); }
};

// Build the structured proxy username the gateway will parse (Bright Data style).
function buildProxyUsername(orgId, { zone, country, sessionToken, rotation }) {
  const parts = [`customer-${String(orgId).slice(0, 8)}`];
  if (zone) parts.push(`zone-${zone}`);
  if (country) parts.push(`country-${country}`);
  if (rotation === 'sticky') parts.push(`session-${sessionToken}`);
  parts.push(`rotation-${rotation}`);
  return parts.join('-');
}

function sessionResponse(orgId, session) {
  return {
    id: session.id,
    sessionToken: session.session_token,
    rotation: session.rotation,
    country: session.country || null,
    zone: session.zone || null,
    status: session.status,
    connection: {
      host: GATEWAY_HOST,
      port: GATEWAY_PORT,
      username: buildProxyUsername(orgId, {
        zone: session.zone, country: session.country,
        sessionToken: session.session_token, rotation: session.rotation,
      }),
      passwordHint: 'use your bvl_proxy_ key as the password',
    },
  };
}

module.exports = {
  me: wrap(async (req, res) => sendSuccess(req, res, {
    type: req.auth.type,
    organizationId: req.auth.organizationId,
    plan: req.organization && req.organization.plan,
    scopes: req.auth.scopes,
    permissions: req.auth.permissions,
  })),

  usage: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getUsageSummary(req.auth))),

  createProxySession: wrap(async (req, res) => {
    const orgId = req.auth.organizationId;
    const plan = req.organization && req.organization.plan;
    const limits = rateLimiter.planLimits(plan);
    const { country, zone, rotation, sessionId } = req.body || {};
    const desiredRotation = rotation || (sessionId ? 'sticky' : 'rotating');

    // Sticky reuse: return the existing live session if one matches.
    if (desiredRotation === 'sticky' && sessionId) {
      const existing = await db.proxy_sessions.findOne({ where: { org_id: orgId, session_token: sessionId, status: 'active' } });
      if (existing) return sendSuccess(req, res, sessionResponse(orgId, existing));
    }

    const slot = await rateLimiter.acquireConcurrency(`org:${orgId}`, limits.concurrency);
    if (!slot.allowed) {
      throw new AppError('CONCURRENCY_LIMIT', `Concurrent proxy session limit reached (${limits.concurrency})`, 429);
    }

    const token = sessionId || generateToken(8);
    let session;
    try {
      session = await db.proxy_sessions.create({
        org_id: orgId,
        api_key_id: req.auth.apiKeyId || null,
        session_token: token,
        zone: zone || null,
        country: country ? String(country).toLowerCase() : null,
        rotation: desiredRotation,
        status: 'active',
        ip_address: req.ip || null,
        started_at: new Date(),
        last_seen_at: new Date(),
      });
    } catch (err) {
      await rateLimiter.releaseConcurrency(`org:${orgId}`);
      throw err;
    }

    metrics.incActiveProxySessions();
    usageAttribution.emit(req, { kind: 'proxy.session.created', sessionToken: token, country }).catch(() => {});
    // Cross-division domain event onto the enterprise bus (consumed by analytics,
    // metering and abuse contexts). Best-effort, never blocks the response.
    domainEvents.emit.proxySessionStarted({
      sessionId: token, orgId, apiKeyId: req.auth.apiKeyId || null,
      provider: session.provider || 'auto', country: country ? String(country).toLowerCase() : null,
      rotation: desiredRotation, kind: zone || 'residential', startedAt: new Date().toISOString(),
    });
    return sendSuccess(req, res, sessionResponse(orgId, session), 201);
  }),

  listProxySessions: wrap(async (req, res) => {
    const rows = await db.proxy_sessions.findAll({
      where: { org_id: req.auth.organizationId, status: 'active' },
      order: [['started_at', 'DESC']],
      limit: 200,
    });
    sendSuccess(req, res, rows.map((s) => sessionResponse(req.auth.organizationId, s)));
  }),

  closeProxySession: wrap(async (req, res) => {
    const orgId = req.auth.organizationId;
    const session = await db.proxy_sessions.findOne({ where: { id: req.params.id, org_id: orgId } });
    if (!session) throw new AppError('SESSION_NOT_FOUND', 'Proxy session not found', 404);
    if (session.status === 'active') {
      await session.update({ status: 'closed', closed_at: new Date() });
      await rateLimiter.releaseConcurrency(`org:${orgId}`);
      metrics.decActiveProxySessions();
    }
    sendSuccess(req, res, null, 200);
  }),

  rotateApiKey: wrap(async (req, res) => {
    const result = await apiKeyService.rotateKey(req.params.id, req.auth.organizationId);
    if (!result) throw new AppError('KEY_NOT_FOUND', 'API key not found', 404);
    sendSuccess(req, res, { id: result.apiKeyId, key: result.rawKey, message: 'Store this key now — it will not be shown again' });
  }),
};
