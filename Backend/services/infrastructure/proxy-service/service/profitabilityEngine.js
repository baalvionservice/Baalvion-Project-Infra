'use strict';

/**
 * Profitability engine — the margin truth across the business.
 *
 *   revenue (ex-tax) − providerCost − infraCost = net margin
 *
 * Computes per-org / per-region / per-provider profitability from real revenue
 * (invoices), real provider cost (providerCostEngine) and real attributed infra
 * cost (cost_attributions), writes `profitability_snapshots`, surfaces a margin
 * heatmap, and detects negative / thin-margin accounts. Pure core unit-tested.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const providerCostEngine = require('./providerCostEngine');
const pricing = require('./pricing');
const financeMetrics = require('../observability/financeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

/** Classify a net-margin ratio. */
function classifyMargin(ratio) {
  if (ratio < 0) return 'negative';
  if (ratio < 0.2) return 'thin';
  if (ratio < 0.5) return 'healthy';
  return 'strong';
}

/**
 * PURE profitability computation. Revenue is invoice total (tax-inclusive); tax
 * is pass-through and excluded from margin.
 */
function computeProfitability({ revenue = 0, providerCost = 0, infraCost = 0, tax = 0 }) {
  const revenueExTax = Math.max(0, Number(revenue) - Number(tax));
  const grossMargin = round2(revenueExTax - providerCost);              // after COGS (provider)
  const netMargin = round2(revenueExTax - providerCost - infraCost);    // after infra too
  const marginRatio = revenueExTax > 0 ? round2(netMargin / revenueExTax) : (netMargin < 0 ? -1 : 0);
  return {
    revenue: round2(revenue), revenueExTax: round2(revenueExTax), tax: round2(tax),
    providerCost: round2(providerCost), infraCost: round2(infraCost),
    grossMargin, netMargin, marginRatio, classification: classifyMargin(marginRatio),
  };
}

// ── async snapshots ─────────────────────────────────────────────────────────

async function orgRevenue(periodStart, periodEnd) {
  const rows = await db.sequelize.query(
    `SELECT org_id, COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(tax),0) AS tax
     FROM invoices WHERE issued_at >= :s AND issued_at < :e AND status IN ('paid','pending')
     GROUP BY org_id`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => []);
  const m = {};
  for (const r of rows) m[r.org_id] = { revenue: Number(r.revenue), tax: Number(r.tax) };
  return m;
}

async function orgAttributedCost(periodStart) {
  const rows = await db.sequelize.query(
    `SELECT entity_id, provider_cost, infra_cost FROM cost_attributions
     WHERE scope = 'org' AND period_start = :ps`,
    { replacements: { ps: periodStart }, type: Q.SELECT },
  ).catch(() => []);
  const m = {};
  for (const r of rows) m[r.entity_id] = { providerCost: Number(r.provider_cost), infraCost: Number(r.infra_cost) };
  return m;
}

/** Snapshot per-org profitability for a period; returns negative/thin-margin orgs. */
async function snapshotOrgProfitability(periodStart, periodEnd) {
  const revenue = await orgRevenue(periodStart, periodEnd);
  const costs = await orgAttributedCost(periodStart);
  const orgIds = new Set([...Object.keys(revenue), ...Object.keys(costs)]);
  const flagged = [];

  for (const orgId of orgIds) {
    const r = revenue[orgId] || { revenue: 0, tax: 0 };
    const c = costs[orgId] || { providerCost: 0, infraCost: 0 };
    const p = computeProfitability({ revenue: r.revenue, tax: r.tax, providerCost: c.providerCost, infraCost: c.infraCost });
    await db.sequelize.query(
      `INSERT INTO profitability_snapshots (period_start, period_end, scope, entity_id, revenue, provider_cost, infra_cost, tax, gross_margin, net_margin, margin_ratio)
       VALUES (:ps, :pe, 'org', :org, :rev, :pc, :ic, :tax, :gm, :nm, :mr)
       ON CONFLICT (period_start, scope, entity_id) DO UPDATE SET revenue=EXCLUDED.revenue, provider_cost=EXCLUDED.provider_cost,
         infra_cost=EXCLUDED.infra_cost, tax=EXCLUDED.tax, gross_margin=EXCLUDED.gross_margin, net_margin=EXCLUDED.net_margin,
         margin_ratio=EXCLUDED.margin_ratio, computed_at=now()`,
      { replacements: { ps: periodStart, pe: periodEnd, org: orgId, rev: p.revenue, pc: p.providerCost, ic: p.infraCost, tax: p.tax, gm: p.grossMargin, nm: p.netMargin, mr: p.marginRatio }, type: Q.INSERT },
    ).catch((e) => logger.error('[profitability] persist:', e.message));
    if (p.classification === 'negative' || p.classification === 'thin') flagged.push({ orgId, ...p });
  }
  financeMetrics.setNegativeMarginAccounts(flagged.filter((f) => f.classification === 'negative').length);
  return { snapshots: orgIds.size, flagged };
}

/** Per-provider profitability: revenue share by GB − real provider cost. */
async function snapshotProviderProfitability(periodStart, periodEnd) {
  const usage = await ts.query(
    `SELECT provider, SUM(bytes_total) AS bytes FROM provider_usage_daily
     WHERE bucket >= $1 AND bucket < $2 GROUP BY provider`,
    [periodStart, periodEnd],
  );
  const totalGb = usage.rows.reduce((s, r) => s + Number(r.bytes) / GB, 0) || 1;
  const [{ revenue } = { revenue: 0 }] = await db.sequelize.query(
    `SELECT COALESCE(SUM(total - tax),0) AS revenue FROM invoices WHERE issued_at >= :s AND issued_at < :e AND status IN ('paid','pending')`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => [{ revenue: 0 }]);

  const out = [];
  for (const r of usage.rows) {
    const gb = Number(r.bytes) / GB;
    const cost = await providerCostEngine.costForProvider(r.provider, { gb });
    const revShare = Number(revenue) * (gb / totalGb);
    const p = computeProfitability({ revenue: revShare, providerCost: cost.cost, infraCost: 0 });
    financeMetrics.setProviderMargin(r.provider, p.marginRatio);
    await db.sequelize.query(
      `INSERT INTO profitability_snapshots (period_start, period_end, scope, entity_id, revenue, provider_cost, infra_cost, tax, gross_margin, net_margin, margin_ratio)
       VALUES (:ps, :pe, 'provider', :prov, :rev, :pc, 0, 0, :gm, :nm, :mr)
       ON CONFLICT (period_start, scope, entity_id) DO UPDATE SET revenue=EXCLUDED.revenue, provider_cost=EXCLUDED.provider_cost,
         gross_margin=EXCLUDED.gross_margin, net_margin=EXCLUDED.net_margin, margin_ratio=EXCLUDED.margin_ratio, computed_at=now()`,
      { replacements: { ps: periodStart, pe: periodEnd, prov: r.provider, rev: p.revenue, pc: p.providerCost, gm: p.grossMargin, nm: p.netMargin, mr: p.marginRatio }, type: Q.INSERT },
    ).catch(() => {});
    out.push({ provider: r.provider, gb: round2(gb), ...p });
  }
  return out;
}

/** Margin heatmap for the latest snapshots of a scope (for the dashboard). */
async function marginHeatmap(scope = 'org', limit = 200) {
  return db.sequelize.query(
    `SELECT DISTINCT ON (entity_id) entity_id, revenue, provider_cost, infra_cost, net_margin, margin_ratio, period_start
     FROM profitability_snapshots WHERE scope = :scope ORDER BY entity_id, period_start DESC LIMIT :limit`,
    { replacements: { scope, limit }, type: Q.SELECT },
  ).catch(() => []);
}

module.exports = { classifyMargin, computeProfitability, snapshotOrgProfitability, snapshotProviderProfitability, marginHeatmap };
