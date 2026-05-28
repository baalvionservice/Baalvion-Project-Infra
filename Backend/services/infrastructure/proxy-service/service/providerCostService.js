'use strict';

/**
 * Provider cost reconciliation + margin analytics.
 *
 *   gross margin = customer revenue − provider bandwidth cost − infra cost − tax
 *
 * Provider costs are configured in provider_costs ($/GB, optionally per country)
 * and reconciled against REAL provider_usage_daily from TimescaleDB.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const pricing = require('./pricing');
const metrics = require('../observability/meteringMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;
const INFRA_COST_PER_GB = Number(process.env.INFRA_COST_PER_GB || 0.01);

async function getCostPerGb(provider, country) {
  const rows = await db.sequelize.query(
    `SELECT cost_per_gb FROM provider_costs
     WHERE provider = :p AND (country = :c OR country = '' OR country IS NULL)
     ORDER BY (country = :c) DESC, effective_from DESC LIMIT 1`,
    { replacements: { p: provider, c: (country || '').toLowerCase() }, type: Q.SELECT },
  );
  return rows.length ? Number(rows[0].cost_per_gb) : 0;
}

/** Per-provider bytes + cost for a period (from the time-series store). */
async function providerCostForPeriod(start, end) {
  const res = await ts.query(
    `SELECT provider, COALESCE(SUM(bytes_total),0)::bigint AS bytes
     FROM provider_usage_daily WHERE bucket >= $1 AND bucket < $2 GROUP BY provider`,
    [start, end],
  );
  const out = [];
  for (const r of res.rows) {
    const gb = Number(r.bytes) / GB;
    const costPerGb = await getCostPerGb(r.provider, '');
    out.push({ provider: r.provider, gb: round2(gb), costPerGb, cost: round2(gb * costPerGb) });
  }
  return out;
}

async function revenueForPeriod(start, end) {
  const [row] = await db.sequelize.query(
    `SELECT COALESCE(SUM(total),0) AS revenue FROM invoices
     WHERE issued_at >= :s AND issued_at < :e AND status IN ('paid','pending')`,
    { replacements: { s: start, e: end }, type: Q.SELECT },
  );
  return Number(row.revenue || 0);
}

/** Full reconciliation: revenue, provider cost, infra, margin (+ Prometheus). */
async function reconcile(start, end) {
  const providers = await providerCostForPeriod(start, end);
  const revenue = await revenueForPeriod(start, end);

  let totalGb = 0;
  let providerCost = 0;
  for (const p of providers) {
    totalGb += p.gb;
    providerCost += p.cost;
    const provRevShare = revenue * (p.gb / (totalGb || 1));
    const ratio = provRevShare > 0 ? (provRevShare - p.cost) / provRevShare : 0;
    metrics.setProviderMargin(p.provider, ratio);
  }
  const infraCost = round2(totalGb * INFRA_COST_PER_GB);
  const grossMargin = round2(revenue - providerCost - infraCost);
  const marginRatio = revenue > 0 ? round2(grossMargin / revenue) : 0;

  logger.info(`[margin] revenue=${revenue} providerCost=${providerCost} infra=${infraCost} gross=${grossMargin} (${Math.round(marginRatio * 100)}%)`);
  return { revenue, providerCost, infraCost, grossMargin, marginRatio, providers, totalGb: round2(totalGb) };
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = { getCostPerGb, providerCostForPeriod, revenueForPeriod, reconcile };
