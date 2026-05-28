'use strict';

/**
 * ASN intelligence: reputation, residential/mobile/datacenter classification,
 * ban rates, provider/geo mappings, per-target compatibility. computeReputation
 * is PURE (unit-tested). Reputation is published to Redis (`asn:rep:{asn}`) and
 * banned ASNs to `asn:banned` for routing decisions + dedicated-pool allocation.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const edgeMetrics = require('../observability/edgeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const BAN_THRESHOLD = Number(process.env.ASN_BAN_THRESHOLD || 0.6);

/** Reputation 0–100 from ban rate + success rate (lower ban + higher success = better). */
function computeReputation({ banRate = 0, successRate = 100 } = {}) {
  const ban = Math.max(0, Math.min(1, Number(banRate)));
  const succ = Math.max(0, Math.min(100, Number(successRate)));
  const rep = Math.round((1 - ban) * 60 + (succ / 100) * 40);
  return Math.max(0, Math.min(100, rep));
}

async function upsert(asn, data = {}) {
  const reputation = data.reputation != null ? data.reputation : computeReputation(data);
  await db.sequelize.query(
    `INSERT INTO asn_intelligence (asn, name, country, type, reputation, ban_rate, success_rate, providers, target_compat, updated_at)
     VALUES (:asn, :name, :country, :type, :rep, :ban, :succ, :providers::jsonb, :tc::jsonb, now())
     ON CONFLICT (asn) DO UPDATE SET name=COALESCE(EXCLUDED.name, asn_intelligence.name), country=COALESCE(EXCLUDED.country, asn_intelligence.country),
       type=COALESCE(EXCLUDED.type, asn_intelligence.type), reputation=EXCLUDED.reputation, ban_rate=EXCLUDED.ban_rate,
       success_rate=EXCLUDED.success_rate, providers=EXCLUDED.providers, target_compat=EXCLUDED.target_compat, updated_at=now()`,
    { replacements: { asn, name: data.name || null, country: data.country || null, type: data.type || null,
        rep: reputation, ban: data.banRate || 0, succ: data.successRate || null,
        providers: JSON.stringify(data.providers || []), tc: JSON.stringify(data.targetCompat || {}) }, type: Q.INSERT },
  );
  await publish(asn, reputation);
  return { asn, reputation };
}

async function publish(asn, reputation) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`asn:rep:${asn}`, String(reputation), 'EX', 7 * 86400);
    if (reputation < BAN_THRESHOLD * 100) await redis.sadd('asn:banned', String(asn));
    else await redis.srem('asn:banned', String(asn));
  } catch (err) { logger.error('[asn] publish failed:', err.message); }
  edgeMetrics.setAsnReputation(asn, reputation);
}

async function get(asn) {
  const [r] = await db.sequelize.query(`SELECT * FROM asn_intelligence WHERE asn = :asn`, { replacements: { asn }, type: Q.SELECT });
  return r || null;
}

async function list({ type, limit = 200 } = {}) {
  return db.sequelize.query(
    `SELECT asn, name, country, type, reputation, ban_rate, success_rate FROM asn_intelligence
     ${type ? 'WHERE type = :type' : ''} ORDER BY reputation DESC LIMIT :limit`,
    { replacements: { type, limit: Number(limit) }, type: Q.SELECT },
  );
}

/** Recompute reputation from stored ban/success + republish (cron). */
async function refresh() {
  const rows = await db.sequelize.query(`SELECT asn, ban_rate, success_rate FROM asn_intelligence`, { type: Q.SELECT });
  let banned = 0;
  for (const r of rows) {
    const rep = computeReputation({ banRate: Number(r.ban_rate), successRate: r.success_rate != null ? Number(r.success_rate) : 100 });
    if (rep < BAN_THRESHOLD * 100) banned += 1;
    await db.sequelize.query(`UPDATE asn_intelligence SET reputation = :rep, updated_at = now() WHERE asn = :asn`, { replacements: { rep, asn: r.asn }, type: Q.UPDATE });
    await publish(r.asn, rep);
  }
  edgeMetrics.setAsnBanned(banned);
  return { refreshed: rows.length, banned };
}

module.exports = { computeReputation, upsert, get, list, refresh, publish };
