'use strict';

/**
 * Real-time enforcement. Persists sanctions and publishes a compact decision to
 * Redis (`enforce:org:{id}`) that the GO GATEWAY reads BEFORE opening upstreams,
 * plus reuses `quota:block:{org}` (the Prompt-4 gate) for hard blocks.
 *
 * Actions: suspend | ban | throttle | geo_restrict | bandwidth_limit | provider_isolate
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const complianceAudit = require('./complianceAudit');
const domainEvents = require('./domainEvents');
const logger = require('./logger');

const SEVERITY_BY_ACTION = { warn: 'low', throttle: 'medium', block_destination: 'medium', quarantine_ip: 'high', suspend: 'critical', ban: 'critical' };

const Q = db.Sequelize.QueryTypes;
const enforceKey = (org) => `enforce:org:${org}`;
const blockKey = (org) => `quota:block:${org}`;

async function apply({ orgId, action, reason = '', params = {}, createdBy = null, caseId = null, expiresAt = null, autoBy = null }) {
  await db.sequelize.query(
    `INSERT INTO enforcement_actions (org_id, action, reason, params, created_by, case_id, expires_at)
     VALUES (:org, :action, :reason, :params::jsonb, :by, NULLIF(:caseId,'')::uuid, :exp)`,
    { replacements: { org: orgId, action, reason, params: JSON.stringify(params), by: createdBy && /^\d+$/.test(String(createdBy)) ? Number(createdBy) : null, caseId: caseId || '', exp: expiresAt }, type: Q.INSERT },
  );

  if (action === 'suspend' || action === 'ban') {
    await db.organizations.update({ status: 'suspended' }, { where: { id: orgId } });
  }

  await rebuildOrgFlag(orgId);
  await complianceAudit.log({ domain: 'enforcement', action: `apply:${action}`, orgId, actorId: createdBy, payload: { reason, params, autoBy } });
  try { require('./alertService').dispatch({ orgId, type: 'enforcement', severity: 'critical', title: `Enforcement: ${action}`, message: reason }); } catch (_) {}
  // Cross-division domain event — consumed by trust/audit/notifications + analytics.
  domainEvents.emit.abuseActionTriggered({
    orgId, action, reason, severity: SEVERITY_BY_ACTION[action] || 'medium', caseId: caseId || undefined, actorId: createdBy,
  });
  return { orgId, action, applied: true };
}

async function revoke(actionId, actorId = null) {
  const [row] = await db.sequelize.query(
    `UPDATE enforcement_actions SET active = false, revoked_at = now()
     WHERE id = :id AND active = true RETURNING org_id, action`,
    { replacements: { id: actionId }, type: Q.SELECT },
  ).then((r) => r).catch(() => [null]);
  if (!row) return { revoked: false };
  await rebuildOrgFlag(row.org_id);
  await complianceAudit.log({ domain: 'enforcement', action: `revoke:${row.action}`, orgId: row.org_id, actorId });
  return { revoked: true };
}

// Recompose the live Redis decision from all currently-active actions for an org.
async function rebuildOrgFlag(orgId) {
  const rows = await db.sequelize.query(
    `SELECT action, params FROM enforcement_actions
     WHERE org_id = :org AND active = true AND (expires_at IS NULL OR expires_at > now())`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  const decision = { blocked: false, geoDeny: [], geoAllow: [], throttleRpm: null, bandwidthCapGb: null, isolateProviders: [] };
  for (const r of rows) {
    const p = r.params || {};
    switch (r.action) {
      case 'suspend': case 'ban': decision.blocked = true; break;
      case 'geo_restrict':
        if (Array.isArray(p.geoDeny)) decision.geoDeny.push(...p.geoDeny);
        if (Array.isArray(p.geoAllow)) decision.geoAllow.push(...p.geoAllow);
        break;
      case 'throttle': decision.throttleRpm = p.rpm || 30; break;
      case 'bandwidth_limit': decision.bandwidthCapGb = p.gb || null; break;
      case 'provider_isolate': if (Array.isArray(p.providers)) decision.isolateProviders.push(...p.providers); break;
    }
  }

  const redis = getRedis();
  if (!redis) return decision;
  try {
    const hasAny = decision.blocked || decision.geoDeny.length || decision.geoAllow.length ||
      decision.throttleRpm || decision.bandwidthCapGb || decision.isolateProviders.length;
    if (hasAny) {
      await redis.set(enforceKey(orgId), JSON.stringify(decision), 'EX', 30 * 86400);
    } else {
      await redis.del(enforceKey(orgId));
    }
    if (decision.blocked) await redis.set(blockKey(orgId), '1', 'EX', 30 * 86400);
    else await redis.del(blockKey(orgId));
  } catch (err) {
    logger.error('[enforce] redis publish failed:', err.message);
  }
  return decision;
}

async function listForOrg(orgId) {
  return db.sequelize.query(
    `SELECT id, action, reason, params, active, created_at, expires_at, revoked_at
     FROM enforcement_actions WHERE org_id = :org ORDER BY created_at DESC LIMIT 100`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
}

module.exports = { apply, revoke, rebuildOrgFlag, listForOrg };
