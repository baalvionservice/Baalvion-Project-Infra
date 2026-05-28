'use strict';

/**
 * Usage reconciliation engine. Compares independent measurements of the same
 * quantity (customer usage vs invoiced GB; gateway-metered vs provider-reported)
 * and classifies variance as ok / mismatch / lost_events / over- / under-billing.
 * Findings are persisted to `reconciliation_runs` + `reconciliation_discrepancies`
 * and drive audit-safe adjustments (never silent edits — every correction is a
 * new, signed ledger entry). Pure classification core is unit-tested.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const pricing = require('./pricing');
const financeMetrics = require('../observability/financeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;
const DEFAULT_TOLERANCE_PCT = Number(process.env.RECON_TOLERANCE_PCT || 1);

function round4(n) { return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000; }

/**
 * PURE variance classification. `internal` = our metering (source of truth for
 * what we delivered); `external` = the other source (invoice / provider report).
 * @returns {{variance, variancePct, classification}}
 */
function classifyVariance(internal, external, dimension = 'usage', tolerancePct = DEFAULT_TOLERANCE_PCT) {
  const a = Number(internal) || 0;
  const b = Number(external) || 0;
  const variance = round4(a - b);
  const base = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  const variancePct = round4((Math.abs(variance) / base) * 100);

  if (variancePct <= tolerancePct) return { variance, variancePct, classification: 'ok' };

  // external > internal: someone counted more than we delivered.
  if (b > a) {
    // For provider dimension that's the provider charging for more than we used.
    if (dimension === 'provider') return { variance, variancePct, classification: 'overbilling' };
    // For invoice/usage that's usually metering loss (we billed/metered less).
    return { variance, variancePct, classification: 'lost_events' };
  }
  // internal > external: we delivered/metered more than was billed → revenue leak.
  return { variance, variancePct, classification: 'underbilling' };
}

/** A reconciliation is healthy when no discrepancy exceeds the hard threshold. */
function summarize(discrepancies, hardPct = 5) {
  const bad = discrepancies.filter((d) => d.classification !== 'ok');
  const maxVariance = discrepancies.reduce((m, d) => Math.max(m, d.variancePct), 0);
  return { discrepancies: bad.length, maxVariance, healthy: maxVariance <= hardPct };
}

// ── async run orchestration ────────────────────────────────────────────────────

async function openRun(kind, periodStart, periodEnd, sources) {
  const [row] = await db.sequelize.query(
    `INSERT INTO reconciliation_runs (kind, period_start, period_end, sources) VALUES (:k, :s, :e, :src::jsonb) RETURNING id`,
    { replacements: { k: kind, s: periodStart, e: periodEnd, src: JSON.stringify(sources) }, type: Q.SELECT },
  );
  return row.id;
}

async function recordDiscrepancy(runId, d) {
  await db.sequelize.query(
    `INSERT INTO reconciliation_discrepancies (run_id, dimension, dim_key, source_a, value_a, source_b, value_b, variance, variance_pct, classification)
     VALUES (:run, :dim, :key, :sa, :va, :sb, :vb, :var, :pct, :cls)`,
    { replacements: { run: runId, dim: d.dimension, key: d.dimKey, sa: d.sourceA, va: d.valueA, sb: d.sourceB, vb: d.valueB, var: d.variance, pct: d.variancePct, cls: d.classification }, type: Q.INSERT },
  ).catch((e) => logger.error('[recon] record:', e.message));
}

async function closeRun(runId, summary) {
  await db.sequelize.query(
    `UPDATE reconciliation_runs SET status = :st, discrepancies = :d, max_variance = :mv, finished_at = now() WHERE id = :id`,
    { replacements: { id: runId, st: summary.healthy ? 'clean' : 'discrepancies', d: summary.discrepancies, mv: summary.maxVariance }, type: Q.UPDATE },
  ).catch(() => {});
}

/**
 * Reconcile customer usage (Timescale) against invoiced GB (invoices) per org.
 * Detects metering loss + revenue leakage.
 */
async function reconcileUsageVsInvoices(periodStart, periodEnd) {
  const runId = await openRun('usage', periodStart, periodEnd, ['timescale.org_usage_daily', 'invoices.total_gb']);
  const metered = await ts.query(
    `SELECT org_id, SUM(bytes_total) AS bytes FROM org_usage_daily WHERE bucket >= $1 AND bucket < $2 GROUP BY org_id`,
    [periodStart, periodEnd],
  );
  const invoiced = await db.sequelize.query(
    `SELECT org_id, COALESCE(SUM(total_gb),0) AS gb FROM invoices WHERE period_start >= :s AND period_end <= :e GROUP BY org_id`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => []);
  const invMap = Object.fromEntries(invoiced.map((r) => [r.org_id, Number(r.gb)]));

  const discrepancies = [];
  for (const r of metered.rows) {
    const meteredGb = round4(Number(r.bytes) / GB);
    const invoicedGb = invMap[r.org_id] || 0;
    const c = classifyVariance(meteredGb, invoicedGb, 'usage');
    const d = { dimension: 'org', dimKey: r.org_id, sourceA: 'metered_gb', valueA: meteredGb, sourceB: 'invoiced_gb', valueB: invoicedGb, ...c };
    if (c.classification !== 'ok') { discrepancies.push(d); await recordDiscrepancy(runId, d); }
  }
  const summary = summarize(discrepancies);
  await closeRun(runId, summary);
  if (!summary.healthy) financeMetrics.incReconciliationFailure('usage');
  return { runId, ...summary, discrepancies };
}

module.exports = { classifyVariance, summarize, reconcileUsageVsInvoices, openRun, recordDiscrepancy, closeRun };
