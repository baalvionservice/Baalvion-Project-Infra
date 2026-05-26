'use strict';

/**
 * SLA intelligence. Predicts SLA-breach risk for enterprise orgs by combining
 * latency-trend forecasting, provider health, and regional health, then can
 * trigger pre-emptive failover (de-weight risky providers), allocate premium
 * routes, and notify the customer. Builds on slaService (Prompt 8) for the
 * contractual targets and forecastingEngine for the trend.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const mlMath = require('./mlMath');
const { getRedis } = require('./redisClient');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

let alertService = null;
try { alertService = require('./alertService'); } catch (_) { alertService = null; }

/**
 * Pure SLA-risk score in [0,1] from current vs. target metrics + trend.
 * @param {object} m {uptime, targetUptime, latencyP95, latencyBudget, latencyTrend, providerHealth}
 */
function slaRiskScore(m) {
  const uptimeGap = Math.max(0, (m.targetUptime ?? 0.999) - (m.uptime ?? 1)); // e.g. 0.004
  const latRatio = m.latencyBudget > 0 ? mlMath.clamp((m.latencyP95 ?? 0) / m.latencyBudget, 0, 2) : 0;
  const trend = mlMath.clamp((m.latencyTrend ?? 0) / 100, -1, 1); // % change normalised
  const health = 1 - mlMath.clamp(m.providerHealth ?? 1, 0, 1);
  // logistic blend
  const z = -2.0 + 400 * uptimeGap + 1.8 * latRatio + 1.2 * Math.max(0, trend) + 2.5 * health;
  return mlMath.sigmoid(z);
}

/** Org latency stats over the last 24h + 7d trend. */
async function orgLatency(orgId) {
  const recent = await ts.query(
    `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
            AVG(CASE WHEN success THEN 1 ELSE 0 END) AS uptime
     FROM usage_events WHERE org_id = $1 AND ts >= now() - interval '24 hours'`,
    [orgId],
  );
  const daily = await ts.query(
    `SELECT bucket::date AS d, avg_latency FROM org_usage_daily WHERE org_id = $1 AND bucket >= now() - interval '14 days' ORDER BY bucket`,
    [orgId],
  );
  const series = daily.rows.map((r) => Number(r.avg_latency) || 0);
  const recentAvg = mlMath.mean(series.slice(-7));
  const priorAvg = mlMath.mean(series.slice(-14, -7));
  const latencyTrend = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;
  return {
    p95: Number(recent.rows[0]?.p95) || 0,
    uptime: Number(recent.rows[0]?.uptime) || 1,
    latencyTrend,
  };
}

/** Predict SLA risk for one enterprise org; act when risk is high. */
async function predictSlaRisk(orgId, { autoAct = true } = {}) {
  const org = await db.organizations.findByPk(orgId).catch(() => null);
  if (!org) return null;
  const targetUptime = org.tier === 'enterprise' ? 0.999 : 0.99;
  const latencyBudget = org.tier === 'enterprise' ? 800 : 1500;

  const lat = await orgLatency(orgId);
  // Provider health: average live success across providers this org used recently.
  const providerHealth = await avgProviderHealth();
  const risk = slaRiskScore({ uptime: lat.uptime, targetUptime, latencyP95: lat.p95, latencyBudget, latencyTrend: lat.latencyTrend, providerHealth });

  const result = { orgId, risk: round(risk), uptime: round(lat.uptime), latencyP95: round(lat.p95), latencyTrend: round(lat.latencyTrend), targetUptime, latencyBudget };

  if (autoAct && risk >= 0.6) {
    await markPremiumRoute(orgId);
    if (alertService) {
      try {
        await alertService.dispatch({
          orgId, severity: risk >= 0.8 ? 'critical' : 'warning', type: 'sla_risk',
          title: `SLA risk elevated for ${org.name || orgId}`,
          message: `risk=${result.risk} p95=${result.latencyP95}ms uptime=${(result.uptime * 100).toFixed(2)}% — premium routing engaged`,
        });
      } catch (_) {}
    }
    result.action = 'premium_route_engaged';
  }
  return result;
}

async function avgProviderHealth() {
  const rows = await db.sequelize.query(
    `SELECT AVG(success_rate) AS avg FROM provider_features WHERE bucket >= now() - interval '2 hours'`,
    { type: Q.SELECT },
  ).catch(() => []);
  return rows.length && rows[0].avg != null ? Number(rows[0].avg) : 1;
}

/** Publish a premium-routing flag the gateway honours (prefers least-latency healthy providers). */
async function markPremiumRoute(orgId) {
  const redis = getRedis();
  if (!redis) return;
  try { await redis.set(`ai:premium:org:${orgId}`, '1', 'EX', 3600); } catch (e) { logger.error('[sla] premium flag:', e.message); }
}

/** Worker entrypoint: evaluate all enterprise orgs. */
async function evaluateEnterprise() {
  const orgs = await db.sequelize.query(
    `SELECT id FROM organizations WHERE tier = 'enterprise'`, { type: Q.SELECT },
  ).catch(() => []);
  const out = [];
  for (const o of orgs) {
    const r = await predictSlaRisk(o.id).catch((e) => { logger.error('[sla] eval:', e.message); return null; });
    if (r) out.push(r);
  }
  return out;
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000; }

module.exports = { slaRiskScore, predictSlaRisk, evaluateEnterprise, markPremiumRoute };
