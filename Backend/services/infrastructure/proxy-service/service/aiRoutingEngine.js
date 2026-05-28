'use strict';

/**
 * AI routing engine — the autonomous routing brain. Blends provider health
 * (feature store + live Redis state), ban probability, margin efficiency and
 * forecast/anomaly signals into a single 0..1 routing weight per provider, then
 * publishes it to Redis (`ai:provider:weight:{name}`) where the Go gateway's
 * orchestrator multiplies it into its own score. Also runs predictive failover:
 * de-weighting + prewarming alternates BEFORE a provider actually fails.
 *
 * Control loop: featureEngineering → (banPrediction, costOptimizer, forecasting,
 * anomalyDetection) → aiRoutingEngine.publishRouteWeights → gateway.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const costOptimizer = require('./costOptimizer');
const mlMath = require('./mlMath');
const logger = require('./logger');
const registry = require('./mlRegistry');
const intelMetrics = require('../observability/intelligenceMetrics');

const Q = db.Sequelize.QueryTypes;

// Blend weights for the composite score (sum need not be 1; normalised later).
const W = {
  success: 0.30, latency: 0.15, banAvoid: 0.25, margin: 0.20, stability: 0.10,
};

/**
 * Pure composite provider score in [0,1] from normalised signals.
 * @param {object} s {successRate, latencyScore, banProb, marginScore, stability}
 */
function scoreProvider(s) {
  const success = mlMath.clamp(s.successRate ?? 1, 0, 1);
  const latency = mlMath.clamp(s.latencyScore ?? 0.5, 0, 1);
  const banAvoid = 1 - mlMath.clamp(s.banProb ?? 0, 0, 1);
  const margin = mlMath.clamp(s.marginScore ?? 0.5, 0, 1);
  const stability = mlMath.clamp(s.stability ?? 1, 0, 1);
  const raw = W.success * success + W.latency * latency + W.banAvoid * banAvoid + W.margin * margin + W.stability * stability;
  return mlMath.clamp(raw, 0, 1);
}

function latencyScore(p95) {
  return 1 / (1 + Math.max(0, p95 || 0) / 2000); // 2s p95 → 0.5
}

/** Read live provider state JSON published by the gateway orchestrator. */
async function liveProviderState(redis, name) {
  if (!redis) return null;
  try {
    const raw = await redis.get(`provider:state:${name}`);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/** Average ban probability for a provider across its scored routes. */
async function providerBanProb(provider) {
  const rows = await db.sequelize.query(
    `SELECT AVG(ban_probability) AS avg FROM ban_probability_models WHERE provider = :p AND computed_at >= now() - interval '6 hours'`,
    { replacements: { p: provider }, type: Q.SELECT },
  ).catch(() => []);
  return rows.length ? Number(rows[0].avg) || 0 : 0;
}

/**
 * Compute + publish per-provider routing weights. Returns the published map.
 * Honours an anomaly-set hard cap: if anomalyDetection has set a temporary
 * `ai:provider:weight:{name}` cap, we never publish above it.
 */
async function publishRouteWeights() {
  const redis = getRedis();
  const features = await db.sequelize.query(
    `SELECT DISTINCT ON (provider) provider, success_rate, ban_rate, p95_latency, cost_per_gb, efficiency
     FROM provider_features ORDER BY provider, bucket DESC`,
    { type: Q.SELECT },
  ).catch(() => []);

  const { weights: marginWeights } = await costOptimizer.recommendProviderWeights();
  const scores = {};
  const detail = [];

  for (const f of features) {
    const live = await liveProviderState(redis, f.provider);
    const successRate = live?.successRate != null ? Number(live.successRate) : Number(f.success_rate);
    const p95 = Number(f.p95_latency) || (live?.latencyMs ? Number(live.latencyMs) : 0);
    const banProb = await providerBanProb(f.provider);
    const stability = live?.state === 'OFFLINE' ? 0 : live?.state === 'UNHEALTHY' ? 0.3 : live?.state === 'DEGRADED' ? 0.6 : 1;

    const score = scoreProvider({
      successRate, latencyScore: latencyScore(p95), banProb,
      marginScore: marginWeights[f.provider] ?? 0.5, stability,
    });
    scores[f.provider] = score;
    detail.push({ provider: f.provider, score: round(score), banProb: round(banProb), p95, state: live?.state || 'UNKNOWN' });
  }

  // Normalise to weights (max → 1) with a small floor.
  const max = Math.max(...Object.values(scores), 1e-9);
  const published = {};
  for (const [name, s] of Object.entries(scores)) {
    let weight = mlMath.clamp(s / max, 0.05, 1);
    // Respect an anomaly-imposed cap if present.
    if (redis) {
      try {
        const cap = await redis.get(`ai:provider:weight:${name}`);
        // Only treat as a cap when it's clearly a reduction set by the anomaly engine.
        if (cap != null && Number(cap) < weight && Number(cap) <= 0.6) weight = Number(cap);
      } catch (_) {}
    }
    published[name] = round(weight);
    if (redis) {
      try { await redis.set(`ai:provider:weight:${name}`, String(published[name]), 'EX', 300); } catch (_) {}
    }
    intelMetrics.setProviderWeight(name, published[name]);
  }
  if (redis) {
    try { await redis.set('ai:route:weights', JSON.stringify({ weights: published, ts: Date.now() }), 'EX', 300); } catch (_) {}
  }
  await registry.logInference({ modelName: 'route_scorer', source: 'node', features: { providers: features.length }, output: published }).catch(() => {});
  return { published, detail };
}

/**
 * Predictive failover: scan recent forecasts + open anomalies; for providers
 * trending toward degradation, pre-emptively cut their weight and prewarm the
 * top healthy alternate (publish a prewarm hint the gateway can honour).
 */
async function predictiveFailover() {
  const redis = getRedis();
  if (!redis) return { actions: [] };
  // Providers with an open success-rate anomaly in the last hour.
  const atRisk = await db.sequelize.query(
    `SELECT DISTINCT entity_id AS provider FROM anomaly_events
     WHERE scope = 'provider' AND metric = 'success_rate' AND status = 'open' AND detected_at >= now() - interval '1 hour'`,
    { type: Q.SELECT },
  ).catch(() => []);

  const healthy = await db.sequelize.query(
    `SELECT DISTINCT ON (provider) provider, success_rate FROM provider_features
     WHERE success_rate >= 0.9 ORDER BY provider, bucket DESC`,
    { type: Q.SELECT },
  ).catch(() => []);
  const alternate = healthy.sort((a, b) => Number(b.success_rate) - Number(a.success_rate))[0];

  const actions = [];
  for (const r of atRisk) {
    try {
      await redis.set(`ai:provider:weight:${r.provider}`, '0.2', 'EX', 600);
      if (alternate && alternate.provider !== r.provider) {
        await redis.set(`ai:prewarm:${alternate.provider}`, '1', 'EX', 600);
      }
      actions.push({ provider: r.provider, action: 'predictive_deweight', prewarm: alternate?.provider || null });
      intelMetrics.incPredictiveFailover();
    } catch (e) { logger.error('[ai-routing] predictive failover:', e.message); }
  }
  return { actions };
}

/** Read the latest published weights (for the admin UI). */
async function currentWeights() {
  const redis = getRedis();
  if (!redis) return {};
  try {
    const raw = await redis.get('ai:route:weights');
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000; }

module.exports = { scoreProvider, latencyScore, publishRouteWeights, predictiveFailover, currentWeights, W };
