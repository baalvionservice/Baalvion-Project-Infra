'use strict';

/**
 * Real-time quota evaluation + enforcement publishing.
 *
 * The metering worker calls evaluate() as usage accrues. evaluate() publishes a
 * fast enforcement snapshot to Redis that the GO GATEWAY reads BEFORE opening an
 * upstream connection:
 *   quota:block:{org} = "1"      → hard-blocked (gateway refuses)
 *   quota:cap:{org}   = <bytes>  → absolute ceiling (informational)
 *
 * Soft limits (allowance exceeded but overage billing enabled) do NOT block;
 * they accrue overage and fire threshold alerts. Hard limits (no overage, or the
 * absolute ceiling) block.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const pricing = require('./pricing');
const logger = require('./logger');

const GB = pricing.BYTES_PER_GB;
const blockKey = (org) => `quota:block:${org}`;
const capKey = (org) => `quota:cap:${org}`;
const alertKey = (org, lvl) => `quota:alert:${org}:${lvl}`;

async function orgConfig(orgId) {
  const org = await db.organizations.findByPk(orgId);
  if (!org) return null;
  const plan = pricing.planPricing(org.plan_slug);
  const includedGb = Number(org.bandwidth_limit_gb) > 0 ? Number(org.bandwidth_limit_gb) : plan.includedGb;
  return {
    plan: org.plan_slug,
    includedBytes: includedGb * GB,
    ceilingBytes: plan.hardCeilingGb * GB,
    overageEnabled: plan.overagePerGb > 0,
    includedGb,
  };
}

/**
 * @param {string} orgId
 * @param {number} usedBytes   bytes used in the current billing period
 * @returns {Promise<{blocked:boolean, pct:number, includedGb:number, usedGb:number}>}
 */
async function evaluate(orgId, usedBytes) {
  const cfg = await orgConfig(orgId);
  if (!cfg) return { blocked: false, pct: 0, includedGb: 0, usedGb: 0 };

  const redis = getRedis();
  const overCeiling = usedBytes >= cfg.ceilingBytes;
  const overIncluded = usedBytes >= cfg.includedBytes;
  const blocked = overCeiling || (!cfg.overageEnabled && overIncluded);
  const pct = cfg.includedBytes > 0 ? usedBytes / cfg.includedBytes : 0;

  if (redis) {
    try {
      await redis.set(capKey(orgId), String(cfg.ceilingBytes), 'EX', 90 * 86400);
      if (blocked) {
        await redis.set(blockKey(orgId), '1', 'EX', 90 * 86400);
      } else {
        await redis.del(blockKey(orgId));
      }
    } catch (err) {
      logger.error('[quota] redis publish failed:', err.message);
    }
  }

  await fireThresholdAlerts(orgId, pct, blocked);
  return { blocked, pct, includedGb: cfg.includedGb, usedGb: usedBytes / GB };
}

async function fireThresholdAlerts(orgId, pct, blocked) {
  const redis = getRedis();
  if (!redis) return;
  const levels = [];
  if (blocked) levels.push('blocked');
  else if (pct >= 1.0) levels.push('100');
  else if (pct >= 0.9) levels.push('90');
  else if (pct >= 0.8) levels.push('80');

  for (const lvl of levels) {
    // De-dupe: fire each level once per period (28-day TTL).
    const set = await redis.set(alertKey(orgId, lvl), '1', 'EX', 28 * 86400, 'NX');
    if (set === 'OK') {
      try {
        require('./alertService').quotaAlert(orgId, lvl, pct);
      } catch (_) { /* alerting is best-effort */ }
    }
  }
}

/** Republish enforcement state without new traffic (period reset, plan change, top-up). */
async function refresh(orgId, usedBytes) {
  return evaluate(orgId, usedBytes);
}

/** Clear all enforcement + alert state for an org (e.g. billing period rollover). */
async function reset(orgId) {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(blockKey(orgId));
  for (const lvl of ['80', '90', '100', 'blocked']) await redis.del(alertKey(orgId, lvl));
}

module.exports = { evaluate, refresh, reset, orgConfig };
