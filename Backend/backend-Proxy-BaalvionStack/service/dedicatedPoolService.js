'use strict';

/**
 * Dedicated / owned-IP pool management. Allocates exclusive owned IPs to orgs
 * and publishes the per-org IP set to Redis (`dedipool:org:{id}`) which the GO
 * GATEWAY's dedicated provider reads to bind egress source addresses. Provides
 * customer isolation, reserved subnets, and geo-exclusive pools.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const complianceAudit = require('./complianceAudit');
const edgeMetrics = require('../observability/edgeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

async function createPool({ name, type = 'datacenter', ipVersion = 4, regionCode, provider = 'owned', asn, subnet, rotation = 'static' }) {
  const [p] = await db.sequelize.query(
    `INSERT INTO ip_pools (name, type, ip_version, region_code, provider, asn, subnet, rotation)
     VALUES (:name, :type, :v, :region, :provider, :asn, NULLIF(:subnet,'')::cidr, :rotation) RETURNING id`,
    { replacements: { name, type, v: ipVersion, region: regionCode || null, provider, asn: asn || null, subnet: subnet || '', rotation }, type: Q.SELECT },
  );
  return { id: p.id };
}

async function addIPs(poolId, ips, { asn, country, regionCode } = {}) {
  for (const ip of ips) {
    await db.sequelize.query(
      `INSERT INTO dedicated_ips (pool_id, ip, asn, country, region_code) VALUES (:pool, :ip::inet, :asn, :country, :region)
       ON CONFLICT (ip) DO NOTHING`,
      { replacements: { pool: poolId, ip, asn: asn || null, country: country || null, region: regionCode || null }, type: Q.INSERT },
    );
  }
  return { added: ips.length };
}

/** Allocate `count` available IPs from a pool exclusively to an org. */
async function allocate({ orgId, poolId, count = 1, exclusive = true, geo, slaTier, expiresAt = null, actorId }) {
  return db.sequelize.transaction(async (tx) => {
    const avail = await db.sequelize.query(
      `SELECT id, ip FROM dedicated_ips WHERE pool_id = :pool AND status = 'available'
       ORDER BY reputation DESC LIMIT :count FOR UPDATE SKIP LOCKED`,
      { replacements: { pool: poolId, count: Number(count) }, type: Q.SELECT, transaction: tx },
    );
    if (avail.length < count) throw new Error(`only ${avail.length} IPs available in pool`);
    const ids = avail.map((r) => r.id);
    await db.sequelize.query(
      `UPDATE dedicated_ips SET status = 'allocated', allocated_org_id = :org WHERE id IN (:ids)`,
      { replacements: { org: orgId, ids }, type: Q.UPDATE, transaction: tx },
    );
    await db.sequelize.query(
      `INSERT INTO ip_allocations (org_id, pool_id, exclusive, ip_count, geo, sla_tier, expires_at)
       VALUES (:org, :pool, :exc, :n, :geo, :sla, :exp)`,
      { replacements: { org: orgId, pool: poolId, exc: exclusive, n: avail.length, geo: geo || null, sla: slaTier || null, exp: expiresAt }, type: Q.INSERT, transaction: tx },
    );
    return avail.map((r) => r.ip);
  }).then(async (ips) => {
    await publishOrgPool(orgId);
    await complianceAudit.log({ domain: 'access', action: 'ip_allocate', orgId, actorId, payload: { poolId, count: ips.length } });
    edgeMetrics.incIpAllocation('allocate');
    return { allocated: ips };
  });
}

async function deallocate({ orgId, ip, actorId }) {
  await db.sequelize.query(
    `UPDATE dedicated_ips SET status = 'available', allocated_org_id = NULL WHERE ip = :ip::inet AND allocated_org_id = :org`,
    { replacements: { ip, org: orgId }, type: Q.UPDATE },
  );
  await publishOrgPool(orgId);
  await complianceAudit.log({ domain: 'access', action: 'ip_deallocate', orgId, actorId, payload: { ip } });
  edgeMetrics.incIpAllocation('deallocate');
  return { ok: true };
}

/** Rebuild the org's Redis IP set (consumed by the gateway dedicated provider). */
async function publishOrgPool(orgId) {
  const redis = getRedis();
  if (!redis) return;
  const rows = await db.sequelize.query(
    `SELECT host(ip) AS ip FROM dedicated_ips WHERE allocated_org_id = :org AND status = 'allocated'`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  const key = `dedipool:org:${orgId}`;
  try {
    await redis.del(key);
    if (rows.length) await redis.sadd(key, ...rows.map((r) => r.ip));
  } catch (err) { logger.error('[dedipool] publish failed:', err.message); }
  return rows.length;
}

async function listPools() {
  return db.sequelize.query(
    `SELECT p.*, COUNT(d.id) FILTER (WHERE d.status='available') AS available, COUNT(d.id) AS total
     FROM ip_pools p LEFT JOIN dedicated_ips d ON d.pool_id = p.id GROUP BY p.id ORDER BY p.created_at DESC`,
    { type: Q.SELECT },
  );
}

async function orgPool(orgId) {
  return db.sequelize.query(
    `SELECT host(ip) AS ip, asn, country, region_code, status FROM dedicated_ips WHERE allocated_org_id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
}

module.exports = { createPool, addIPs, allocate, deallocate, publishOrgPool, listPools, orgPool };
