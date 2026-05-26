'use strict';

/**
 * Anomaly detection engine. Uses REAL robust statistics (median + MAD modified
 * z-score, resistant to the spikes it detects) plus EWMA baselines over recent
 * history. Detects bandwidth spikes, provider instability, success-rate
 * collapse, and target fan-out (scraping/abuse). Writes anomaly_events, raises
 * alerts, and triggers automated mitigation (provider de-weighting / quota
 * flags) for high-severity events.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const mlMath = require('./mlMath');
const logger = require('./logger');
const intelMetrics = require('../observability/intelligenceMetrics');

const Q = db.Sequelize.QueryTypes;

let alertService = null;
try { alertService = require('./alertService'); } catch (_) { alertService = null; }

/** Score one observed value against a historical series → {score, severity}. */
function scoreAnomaly(value, history) {
  const z = mlMath.robustZScore(value, history);
  return { score: z, severity: mlMath.severityFromZ(z), isAnomaly: Math.abs(z) >= 3.5 };
}

async function record({ scope, entityId, metric, observed, expected, score, severity, mitigation = {} }) {
  const [row] = await db.sequelize.query(
    `INSERT INTO anomaly_events (scope, entity_id, metric, observed, expected, score, severity, mitigation)
     VALUES (:scope, :eid, :metric, :obs, :exp, :score, :sev, :mit::jsonb) RETURNING id`,
    { replacements: { scope, eid: String(entityId), metric, obs: observed, exp: expected, score, sev: severity, mit: JSON.stringify(mitigation) }, type: Q.SELECT },
  );
  intelMetrics.incAnomaly(scope, severity);
  if ((severity === 'high' || severity === 'critical') && alertService) {
    try {
      await alertService.dispatch({
        orgId: scope === 'org' ? entityId : null,
        severity: severity === 'critical' ? 'critical' : 'warning',
        type: 'anomaly',
        title: `Anomaly: ${metric} on ${scope} ${entityId}`,
        message: `observed=${round(observed)} expected=${round(expected)} z=${round(score)}`,
      });
    } catch (e) { logger.error('[anomaly] alert failed:', e.message); }
  }
  return { id: row.id, severity };
}

/**
 * Detect per-org bandwidth anomalies. Compares the latest hour against the
 * trailing baseline of the same org. Triggers a quota-review flag on critical.
 */
async function detectBandwidthAnomalies(lookbackHours = 48) {
  const res = await ts.query(
    `SELECT org_id, bucket, bytes_total FROM org_usage_hourly
     WHERE bucket >= now() - ($1 || ' hours')::interval ORDER BY org_id, bucket`,
    [lookbackHours],
  );
  const byOrg = new Map();
  for (const r of res.rows) {
    if (!byOrg.has(r.org_id)) byOrg.set(r.org_id, []);
    byOrg.get(r.org_id).push(Number(r.bytes_total) || 0);
  }
  const found = [];
  for (const [orgId, series] of byOrg) {
    if (series.length < 6) continue;
    const latest = series[series.length - 1];
    const history = series.slice(0, -1);
    const { score, severity, isAnomaly } = scoreAnomaly(latest, history);
    if (isAnomaly && score > 0) { // only spikes up (down-spikes handled by SLA intel)
      const baseline = mlMath.ewma(history, 0.3);
      const mitigation = severity === 'critical' ? { action: 'quota_review', flag: `anomaly:review:${orgId}` } : {};
      await record({ scope: 'org', entityId: orgId, metric: 'bandwidth', observed: latest, expected: baseline, score, severity, mitigation });
      found.push({ orgId, score, severity });
    }
  }
  return found;
}

/**
 * Detect provider instability: success-rate collapse vs. the provider's own
 * recent baseline (from the feature store). High/critical de-weights the provider
 * by publishing a reduced AI weight (the gateway honours ai:provider:weight:*).
 */
async function detectProviderInstability() {
  const rows = await db.sequelize.query(
    `SELECT provider, array_agg(success_rate ORDER BY bucket) AS rates,
            array_agg(ban_rate ORDER BY bucket) AS bans
     FROM provider_features WHERE bucket >= now() - interval '48 hours' GROUP BY provider`,
    { type: Q.SELECT },
  ).catch(() => []);
  const found = [];
  for (const r of rows) {
    const rates = (r.rates || []).map(Number).filter(Number.isFinite);
    if (rates.length < 6) continue;
    const latest = rates[rates.length - 1];
    const history = rates.slice(0, -1);
    const { score, severity, isAnomaly } = scoreAnomaly(latest, history);
    // success-rate anomaly that is a DROP (negative z) is the dangerous one.
    if (isAnomaly && score < 0) {
      const expected = mlMath.ewma(history, 0.3);
      let mitigation = {};
      if (severity === 'high' || severity === 'critical') {
        const factor = severity === 'critical' ? 0.2 : 0.5;
        mitigation = { action: 'deweight', provider: r.provider, factor };
        await deweightProvider(r.provider, factor);
      }
      await record({ scope: 'provider', entityId: r.provider, metric: 'success_rate', observed: latest, expected, score, severity, mitigation });
      found.push({ provider: r.provider, score, severity });
    }
  }
  return found;
}

/** Publish a temporary AI weight cap for a provider (consumed by the Go gateway). */
async function deweightProvider(provider, factor) {
  const { getRedis } = require('./redisClient');
  const redis = getRedis();
  if (!redis) return;
  try { await redis.set(`ai:provider:weight:${provider}`, String(factor), 'EX', 600); } catch (e) { logger.error('[anomaly] deweight failed:', e.message); }
}

/** Detect target fan-out abuse: one org hitting an unusual number of distinct hosts. */
async function detectFanoutAbuse(windowHours = 1) {
  const res = await ts.query(
    `SELECT org_id, COUNT(DISTINCT dest_host) AS hosts, COUNT(*) AS reqs
     FROM usage_events WHERE ts >= now() - ($1 || ' hours')::interval AND dest_host IS NOT NULL
     GROUP BY org_id HAVING COUNT(*) > 100`,
    [windowHours],
  );
  const hostsArr = res.rows.map((r) => Number(r.hosts));
  const found = [];
  for (const r of res.rows) {
    const { score, severity, isAnomaly } = scoreAnomaly(Number(r.hosts), hostsArr);
    if (isAnomaly && score > 0) {
      await record({ scope: 'org', entityId: r.org_id, metric: 'fanout', observed: Number(r.hosts), expected: mlMath.median(hostsArr), score, severity, mitigation: {} });
      found.push({ orgId: r.org_id, hosts: Number(r.hosts), severity });
    }
  }
  return found;
}

/** Full sweep (called by the worker on a short cadence). */
async function sweep() {
  const [bw, prov, fan] = await Promise.all([
    detectBandwidthAnomalies().catch((e) => { logger.error('[anomaly] bw:', e.message); return []; }),
    detectProviderInstability().catch((e) => { logger.error('[anomaly] prov:', e.message); return []; }),
    detectFanoutAbuse().catch((e) => { logger.error('[anomaly] fanout:', e.message); return []; }),
  ]);
  return { bandwidth: bw.length, providerInstability: prov.length, fanout: fan.length };
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

module.exports = { scoreAnomaly, detectBandwidthAnomalies, detectProviderInstability, detectFanoutAbuse, deweightProvider, sweep, record };
