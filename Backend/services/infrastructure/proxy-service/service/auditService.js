'use strict';

/**
 * Immutable audit logging.
 *
 * Writes to the append-only `audit_logs` table (UPDATE/DELETE are blocked by a
 * DB trigger — see migration 017). Supports both human (user) and machine
 * (API key) actors, and preserves UUID entity identifiers that the legacy
 * BIGINT `entity_id` column could not.
 *
 * Audit writes must NEVER break the request they describe, so failures are
 * logged and swallowed.
 */

const db = require('../models');
const logger = require('./logger');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function actorFrom(req) {
  const auth = req && req.auth ? req.auth : {};
  if (auth.authType === 'api_key') {
    return { actor_type: 'api_key', actor_api_key_id: auth.apiKeyId || null, actor_user_id: null, admin_id: null };
  }
  const uid = auth.userId != null ? Number(auth.userId) : null;
  return { actor_type: 'user', actor_user_id: uid, actor_api_key_id: null, admin_id: uid };
}

/**
 * @param {object} opts
 * @param {object} [opts.req]        Express request (actor + IP + UA derived from it)
 * @param {string} [opts.orgId]      Explicit org id (defaults to req context)
 * @param {string} opts.action      e.g. 'proxy.created', 'auth.login'
 * @param {string} [opts.entityType]
 * @param {string|number} [opts.entityId]
 * @param {object} [opts.details]
 */
async function log({ req, orgId, action, entityType = 'system', entityId = null, details = {} }) {
  try {
    const resolvedOrg = orgId || (req && req.organization && req.organization.id) || (req && req.auth && req.auth.organizationId) || null;
    if (!resolvedOrg) {
      // org-less events (e.g. failed login before org resolution) still recorded with logger
      logger.info('[audit]', action, JSON.stringify(details));
      return;
    }

    const actor = actorFrom(req || {});
    const idStr = entityId == null ? null : String(entityId);
    const isUuid = idStr && UUID_RE.test(idStr);

    await db.audit_logs.create({
      org_id: resolvedOrg,
      action,
      entity_type: entityType,
      entity_id: !isUuid && idStr && /^\d+$/.test(idStr) ? Number(idStr) : null,
      entity_uuid: isUuid ? idStr : null,
      ip_address: req ? (req.ip || null) : null,
      user_agent: req ? (req.headers && req.headers['user-agent']) || null : null,
      details: details || {},
      ...actor,
    });
  } catch (err) {
    logger.error('[audit] write failed:', err.message);
  }
}

/** Convenience for auth lifecycle events. */
async function logAuth(action, { req, orgId, userId, details = {} }) {
  return log({ req, orgId, action, entityType: 'auth', entityId: userId, details });
}

module.exports = { log, logAuth };
