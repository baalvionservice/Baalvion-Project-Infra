'use strict';

/**
 * SLA engine. computeCredit() is PURE (unit-tested). computePeriod() reads REAL
 * success-rate + latency from TimescaleDB. NOTE: true "uptime" should come from
 * synthetic/blackbox monitoring (Prometheus); here uptime is derived from the
 * served-success ratio as an availability proxy and clearly labelled as such.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const complianceAudit = require('./complianceAudit');

const Q = db.Sequelize.QueryTypes;

const DEFAULT_DEF = { uptime_target: 99.9, latency_target_ms: 1000, success_target: 99.0,
  credits_schedule: [{ belowPct: 99.9, creditPct: 10 }, { belowPct: 99.0, creditPct: 25 }, { belowPct: 95.0, creditPct: 50 }] };

/** @returns {creditPct:number, violated:boolean} */
function computeCredit(uptimePct, def = DEFAULT_DEF) {
  const violated = uptimePct < Number(def.uptime_target);
  let creditPct = 0;
  // schedule is ordered high→low thresholds; pick the worst (largest) credit met.
  for (const tier of (def.credits_schedule || [])) {
    if (uptimePct < Number(tier.belowPct)) creditPct = Math.max(creditPct, Number(tier.creditPct));
  }
  return { creditPct, violated };
}

async function getDefinition(orgId) {
  const [d] = await db.sequelize.query(`SELECT * FROM sla_definitions WHERE org_id = :org`, { replacements: { org: orgId }, type: Q.SELECT });
  return d || { ...DEFAULT_DEF, org_id: orgId };
}

async function computePeriod(orgId, start, end) {
  const [row] = await ts.query(
    `SELECT COALESCE(SUM(requests),0)::bigint AS reqs, COALESCE(SUM(failures),0)::bigint AS fails, COALESCE(AVG(avg_latency),0) AS lat
     FROM org_usage_daily WHERE org_id = $1 AND bucket >= $2 AND bucket < $3`,
    [orgId, start, end],
  ).then((r) => r.rows).catch(() => [{ reqs: 0, fails: 0, lat: 0 }]);

  const reqs = Number(row.reqs) || 0;
  const fails = Number(row.fails) || 0;
  const successRate = reqs > 0 ? (100 * (reqs - fails)) / reqs : 100;
  const uptime = successRate; // availability proxy (see module note)
  const def = await getDefinition(orgId);
  const { creditPct, violated } = computeCredit(uptime, def);

  // Estimate credit on the period's invoiced amount.
  const [inv] = await db.sequelize.query(
    `SELECT COALESCE(SUM(total),0) AS total FROM invoices WHERE org_id = :org AND issued_at >= :s AND issued_at < :e`,
    { replacements: { org: orgId, s: start, e: end }, type: Q.SELECT },
  ).catch(() => [{ total: 0 }]);
  const creditAmount = Number(inv.total || 0) * (creditPct / 100);

  await db.sequelize.query(
    `INSERT INTO sla_periods (org_id, period_start, period_end, uptime, p95_latency, success_rate, violated, credit_amount)
     VALUES (:org, :s, :e, :up, :lat, :sr, :v, :credit)
     ON CONFLICT (org_id, period_start, period_end) DO UPDATE SET
       uptime = EXCLUDED.uptime, p95_latency = EXCLUDED.p95_latency, success_rate = EXCLUDED.success_rate,
       violated = EXCLUDED.violated, credit_amount = EXCLUDED.credit_amount, computed_at = now()`,
    { replacements: { org: orgId, s: start, e: end, up: round(uptime), lat: round(Number(row.lat)), sr: round(successRate), v: violated, credit: round(creditAmount) }, type: Q.INSERT },
  );

  if (violated) {
    await complianceAudit.log({ domain: 'access', action: 'sla_violation', orgId, payload: { uptime: round(uptime), creditPct, creditAmount: round(creditAmount) } });
    try { require('./alertService').dispatch({ orgId, type: 'sla', severity: 'warning', title: 'SLA breach', message: `Uptime ${round(uptime)}% < target ${def.uptime_target}% — ${creditPct}% credit` }); } catch (_) {}
  }
  return { uptime: round(uptime), successRate: round(successRate), p95Latency: round(Number(row.lat)), violated, creditPct, creditAmount: round(creditAmount) };
}

async function listPeriods(orgId) {
  return db.sequelize.query(`SELECT * FROM sla_periods WHERE org_id = :org ORDER BY period_start DESC LIMIT 24`, { replacements: { org: orgId }, type: Q.SELECT });
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

module.exports = { computeCredit, getDefinition, computePeriod, listPeriods, DEFAULT_DEF };
