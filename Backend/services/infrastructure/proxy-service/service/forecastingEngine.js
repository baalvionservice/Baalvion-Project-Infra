'use strict';

/**
 * Forecasting engine. REAL time-series forecasting (Holt-Winters exponential
 * smoothing + OLS trend from mlMath) over TimescaleDB daily aggregates, plus a
 * logistic churn-risk model and a deterministic quota-exhaustion projection.
 * Results are written to the `forecasts` table for the analytics platform and
 * autoscaling/pricing/provider-negotiation use.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const mlMath = require('./mlMath');
const pricing = require('./pricing');
const logger = require('./logger');
const intelMetrics = require('../observability/intelligenceMetrics');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

async function saveForecast({ entityType, entityId, metric, horizonDays, pointValue, forecast, model }) {
  await db.sequelize.query(
    `INSERT INTO forecasts (entity_type, entity_id, metric, horizon_days, point_value, forecast, model)
     VALUES (:et, :eid, :metric, :h, :pv, :fc::jsonb, :model)`,
    { replacements: { et: entityType, eid: String(entityId), metric, h: horizonDays, pv: pointValue ?? null, fc: JSON.stringify(forecast || []), model }, type: Q.INSERT },
  );
}

/** Build [{date, yhat, lower, upper}] from a HW result starting tomorrow. */
function toPoints(hw, startDate = new Date()) {
  return hw.forecast.map((y, i) => {
    const d = new Date(startDate.getTime() + (i + 1) * 86400000);
    return { date: d.toISOString().slice(0, 10), yhat: round(y), lower: round(hw.lower[i]), upper: round(hw.upper[i]) };
  });
}

/** Daily bandwidth series (GB) for an org over `days`. */
async function orgDailyGb(orgId, days = 60) {
  const res = await ts.query(
    `SELECT bucket::date AS d, bytes_total FROM org_usage_daily
     WHERE org_id = $1 AND bucket >= now() - ($2 || ' days')::interval ORDER BY bucket`,
    [orgId, days],
  );
  return res.rows.map((r) => Number(r.bytes_total) / GB);
}

/** Forecast an org's bandwidth (GB/day) `horizon` days ahead. */
async function forecastBandwidth(orgId, horizon = 30) {
  const series = await orgDailyGb(orgId, 90);
  if (series.length < 4) return { entityId: orgId, points: [], total: 0, insufficientData: true };
  const hw = mlMath.holtWinters(series, { horizon, period: 7 });
  const total = hw.forecast.reduce((s, v) => s + v, 0);
  const points = toPoints(hw);
  await saveForecast({ entityType: 'org', entityId: orgId, metric: 'bandwidth_gb', horizonDays: horizon, pointValue: round(total), forecast: points, model: hw.seasonal ? 'holt_winters_seasonal' : 'holt_linear' });
  return { entityId: orgId, points, total: round(total), seasonal: hw.seasonal };
}

/** Platform-wide bandwidth forecast (capacity planning / autoscaling). */
async function forecastPlatformBandwidth(horizon = 30) {
  const res = await ts.query(
    `SELECT bucket::date AS d, SUM(bytes_total) AS bytes FROM org_usage_daily
     WHERE bucket >= now() - interval '120 days' GROUP BY bucket ORDER BY bucket`,
  );
  const series = res.rows.map((r) => Number(r.bytes) / GB);
  if (series.length < 7) return { points: [], total: 0, insufficientData: true };
  const hw = mlMath.holtWinters(series, { horizon, period: 7 });
  const points = toPoints(hw);
  const total = hw.forecast.reduce((s, v) => s + v, 0);
  await saveForecast({ entityType: 'platform', entityId: 'global', metric: 'bandwidth_gb', horizonDays: horizon, pointValue: round(total), forecast: points, model: 'holt_winters_seasonal' });
  intelMetrics.setForecastHorizonGb(total);
  return { points, total: round(total), seasonal: hw.seasonal };
}

/** Provider cost forecast from provider_usage_daily × cost_per_gb. */
async function forecastProviderCost(horizon = 30) {
  const res = await ts.query(
    `SELECT provider, bucket::date AS d, SUM(bytes_total) AS bytes FROM provider_usage_daily
     WHERE bucket >= now() - interval '90 days' GROUP BY provider, bucket ORDER BY provider, bucket`,
  );
  const costs = await providerCostMap();
  const byProv = new Map();
  for (const r of res.rows) {
    if (!byProv.has(r.provider)) byProv.set(r.provider, []);
    byProv.get(r.provider).push(Number(r.bytes) / GB);
  }
  const out = [];
  for (const [provider, gbSeries] of byProv) {
    if (gbSeries.length < 4) continue;
    const hw = mlMath.holtWinters(gbSeries, { horizon, period: 7 });
    const cpg = costs[provider] ?? 0.5;
    const costPoints = hw.forecast.map((g, i) => {
      const d = new Date(Date.now() + (i + 1) * 86400000);
      return { date: d.toISOString().slice(0, 10), yhat: round(g * cpg) };
    });
    const totalCost = round(hw.forecast.reduce((s, g) => s + g * cpg, 0));
    await saveForecast({ entityType: 'provider', entityId: provider, metric: 'cost_usd', horizonDays: horizon, pointValue: totalCost, forecast: costPoints, model: 'holt_winters' });
    out.push({ provider, projectedCost: totalCost });
  }
  return out;
}

async function providerCostMap() {
  try {
    const rows = await db.sequelize.query(`SELECT name, cost_per_gb FROM providers`, { type: Q.SELECT });
    const m = {};
    for (const r of rows) m[r.name] = Number(r.cost_per_gb) || 0.5;
    return m;
  } catch (_) { return {}; }
}

/**
 * Quota-exhaustion projection: given current period usage + the trend, when does
 * the org cross its included allowance and its hard ceiling? Deterministic
 * (linear run-rate from the last 7 days), not a guess.
 */
async function forecastQuotaExhaustion(orgId) {
  const org = await db.organizations.findByPk(orgId).catch(() => null);
  const plan = pricing.planPricing(org?.plan || org?.tier || 'starter');
  const includedGb = Number(org?.bandwidth_limit_gb || plan.includedGb);
  const ceilingGb = plan.hardCeilingGb;

  const series = await orgDailyGb(orgId, 14);
  if (!series.length) return { orgId, insufficientData: true };
  const usedThisPeriod = await currentPeriodGb(orgId);
  const recent = series.slice(-7);
  const dailyRate = mlMath.ewma(recent, 0.4);
  const daysToIncluded = dailyRate > 0 ? Math.max(0, (includedGb - usedThisPeriod) / dailyRate) : Infinity;
  const daysToCeiling = dailyRate > 0 ? Math.max(0, (ceilingGb - usedThisPeriod) / dailyRate) : Infinity;

  const point = Number.isFinite(daysToIncluded) ? round(daysToIncluded) : null;
  await saveForecast({ entityType: 'org', entityId: orgId, metric: 'quota_exhaustion', horizonDays: 30, pointValue: point, forecast: [], model: 'run_rate' });
  return {
    orgId, includedGb, ceilingGb, usedGb: round(usedThisPeriod), dailyRateGb: round(dailyRate),
    daysToIncluded: Number.isFinite(daysToIncluded) ? round(daysToIncluded) : null,
    daysToCeiling: Number.isFinite(daysToCeiling) ? round(daysToCeiling) : null,
  };
}

async function currentPeriodGb(orgId) {
  const start = new Date();
  start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const res = await ts.query(
    `SELECT COALESCE(SUM(bytes_total),0) AS bytes FROM org_usage_daily WHERE org_id = $1 AND bucket >= $2`,
    [orgId, start],
  );
  return Number(res.rows[0]?.bytes || 0) / GB;
}

// ── churn risk (logistic on engagement features) ──────────────────────────────
/** Pure churn-risk score from engagement signals. 0..1 (higher = likelier churn). */
function churnRiskScore({ daysSinceLastUse = 0, usageTrendPct = 0, failedPayments = 0, supportTickets = 0, tenureDays = 30 }) {
  // Hand-set logistic coefficients (interpretable cold-start model; replaced by a
  // trained model once labelled churn events exist).
  const z =
    -2.0 +
    0.08 * mlMath.clamp(daysSinceLastUse, 0, 60) +
    -0.015 * mlMath.clamp(usageTrendPct, -100, 100) + // declining usage (negative pct) raises risk
    0.6 * mlMath.clamp(failedPayments, 0, 5) +
    0.2 * mlMath.clamp(supportTickets, 0, 10) +
    -0.005 * mlMath.clamp(tenureDays, 0, 365);
  return mlMath.sigmoid(z);
}

/** Compute churn risk for an org from its recent activity. */
async function forecastChurn(orgId) {
  const series = await orgDailyGb(orgId, 30);
  const recent = series.slice(-7);
  const prior = series.slice(-14, -7);
  const recentAvg = mlMath.mean(recent);
  const priorAvg = mlMath.mean(prior);
  const usageTrendPct = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;
  let daysSinceLastUse = 0;
  for (let i = series.length - 1; i >= 0; i--) { if (series[i] > 0) break; daysSinceLastUse++; }

  let failedPayments = 0;
  try {
    const r = await db.sequelize.query(
      `SELECT COUNT(*) AS n FROM invoices WHERE organization_id = :org AND status IN ('failed','past_due') AND created_at >= now() - interval '60 days'`,
      { replacements: { org: orgId }, type: Q.SELECT },
    );
    failedPayments = Number(r[0]?.n || 0);
  } catch (_) { /* table/col variance tolerated */ }

  const risk = churnRiskScore({ daysSinceLastUse, usageTrendPct, failedPayments });
  await saveForecast({ entityType: 'org', entityId: orgId, metric: 'churn_risk', horizonDays: 30, pointValue: round(risk), forecast: [], model: 'logistic_churn' });
  return { orgId, churnRisk: round(risk), usageTrendPct: round(usageTrendPct), daysSinceLastUse, failedPayments };
}

/** Worker entrypoint: platform + provider forecasts + churn for active orgs. */
async function runForecasts() {
  await forecastPlatformBandwidth().catch((e) => logger.error('[forecast] platform:', e.message));
  await forecastProviderCost().catch((e) => logger.error('[forecast] provider cost:', e.message));
  const orgs = await db.sequelize.query(
    `SELECT DISTINCT org_id FROM org_usage_daily WHERE bucket >= now() - interval '14 days'`,
    { type: Q.SELECT },
  ).catch(() => []);
  let n = 0;
  for (const o of orgs) {
    await forecastBandwidth(o.org_id).catch(() => {});
    await forecastQuotaExhaustion(o.org_id).catch(() => {});
    await forecastChurn(o.org_id).catch(() => {});
    n++;
  }
  return { orgsForecasted: n };
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

module.exports = {
  forecastBandwidth, forecastPlatformBandwidth, forecastProviderCost,
  forecastQuotaExhaustion, forecastChurn, churnRiskScore, runForecasts, toPoints,
};
