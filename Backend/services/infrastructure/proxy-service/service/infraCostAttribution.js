'use strict';

/**
 * Infrastructure cost attribution. Spreads shared infra spend (K8s, bandwidth,
 * edge/PoP, compute, storage, Kafka/ClickHouse) across orgs/regions/products by
 * the usage DRIVER appropriate to each category (bandwidth → GB, compute → CPU-
 * weighted requests, storage → GB-months, …). Pure allocation core is unit-tested;
 * the async layer loads `infra_costs` + usage drivers and writes `cost_attributions`.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const pricing = require('./pricing');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

// Which usage metric drives each cost category's allocation.
const DRIVER_BY_CATEGORY = {
  bandwidth: 'gb', edge: 'gb', nat: 'gb',
  k8s: 'requests', compute: 'requests',
  storage: 'gb', clickhouse: 'gb', kafka: 'requests',
};

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

/** Allocate `amount` across entities proportional to their weights. */
function allocateProportional(amount, weights) {
  const total = Object.values(weights).reduce((s, w) => s + Math.max(0, Number(w) || 0), 0);
  const out = {};
  if (total <= 0) {
    // No usage signal → split evenly (rare; avoids dropping cost on the floor).
    const keys = Object.keys(weights);
    const each = keys.length ? amount / keys.length : 0;
    for (const k of keys) out[k] = round2(each);
    return out;
  }
  for (const [k, w] of Object.entries(weights)) out[k] = round2(amount * (Math.max(0, Number(w) || 0) / total));
  return out;
}

/**
 * Attribute a set of cost pools to entities by per-category drivers.
 * @param {Array} pools [{category, amount}]
 * @param {Object} drivers { entityId: { gb, requests, sessions } }
 * @returns {Object} { entityId: { byCategory: {cat: amount}, total } }
 */
function attributeInfraCosts(pools, drivers) {
  const result = {};
  for (const id of Object.keys(drivers)) result[id] = { byCategory: {}, total: 0 };

  for (const pool of pools) {
    const driverName = DRIVER_BY_CATEGORY[pool.category] || 'gb';
    const weights = {};
    for (const [id, d] of Object.entries(drivers)) weights[id] = Number(d[driverName] || 0);
    const alloc = allocateProportional(Number(pool.amount || 0), weights);
    for (const [id, amt] of Object.entries(alloc)) {
      result[id].byCategory[pool.category] = round2((result[id].byCategory[pool.category] || 0) + amt);
      result[id].total = round2(result[id].total + amt);
    }
  }
  return result;
}

/** Blended infra $/GB across all pools + total GB (dashboard metric). */
function infraCostPerGb(pools, totalGb) {
  const total = pools.reduce((s, p) => s + Number(p.amount || 0), 0);
  return totalGb > 0 ? round2(total / totalGb) : 0;
}

// ── async layer ─────────────────────────────────────────────────────────────

async function loadInfraCosts(periodStart, periodEnd) {
  return db.sequelize.query(
    `SELECT category, SUM(amount)::numeric AS amount FROM infra_costs
     WHERE period_start >= :s AND period_end <= :e GROUP BY category`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => []);
}

async function loadOrgDrivers(periodStart, periodEnd) {
  const res = await ts.query(
    `SELECT org_id, SUM(bytes_total) AS bytes, SUM(requests) AS requests
     FROM org_usage_daily WHERE bucket >= $1 AND bucket < $2 GROUP BY org_id`,
    [periodStart, periodEnd],
  );
  const drivers = {};
  for (const r of res.rows) drivers[r.org_id] = { gb: Number(r.bytes) / GB, requests: Number(r.requests) || 0, sessions: 0 };
  return drivers;
}

/** Attribute the period's infra costs to orgs + persist to cost_attributions. */
async function attributeForPeriod(periodStart, periodEnd) {
  const pools = (await loadInfraCosts(periodStart, periodEnd)).map((r) => ({ category: r.category, amount: Number(r.amount) }));
  if (!pools.length) return { attributed: 0, pools: 0 };
  const drivers = await loadOrgDrivers(periodStart, periodEnd);
  const attribution = attributeInfraCosts(pools, drivers);

  let n = 0;
  for (const [orgId, a] of Object.entries(attribution)) {
    await db.sequelize.query(
      `INSERT INTO cost_attributions (period_start, period_end, scope, entity_id, infra_cost, total_cost, basis)
       VALUES (:ps, :pe, 'org', :org, :infra, :infra, :basis::jsonb)
       ON CONFLICT (period_start, scope, entity_id) DO UPDATE SET infra_cost = EXCLUDED.infra_cost,
         total_cost = cost_attributions.provider_cost + EXCLUDED.infra_cost, basis = EXCLUDED.basis, computed_at = now()`,
      { replacements: { ps: periodStart, pe: periodEnd, org: orgId, infra: a.total, basis: JSON.stringify({ ...drivers[orgId], byCategory: a.byCategory }) }, type: Q.INSERT },
    ).catch((e) => logger.error('[infraAttr] persist:', e.message));
    n++;
  }
  return { attributed: n, pools: pools.length };
}

module.exports = { allocateProportional, attributeInfraCosts, infraCostPerGb, attributeForPeriod, DRIVER_BY_CATEGORY };
