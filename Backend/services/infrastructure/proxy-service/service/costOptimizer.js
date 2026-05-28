'use strict';

/**
 * Autonomous cost / margin optimization. Computes per-provider margin efficiency
 * from the feature store + pricing, recommends dynamic provider weights that
 * favour high-margin healthy providers, and flags low-margin customers and
 * offload opportunities. Pure math is exported for tests; the AI routing engine
 * consumes recommendProviderWeights() and publishes the weights to the gateway.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const pricing = require('./pricing');
const mlMath = require('./mlMath');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

/** Margin per GB = blended sell price − provider cost. */
function marginPerGb({ sellPerGb, costPerGb }) {
  return Number(sellPerGb || 0) - Number(costPerGb || 0);
}

/** Margin-aware provider score: reward success + margin, penalise bans + latency. */
function providerMarginScore({ successRate = 1, banRate = 0, p95Latency = 0, costPerGb = 0.5, sellPerGb = 3 }) {
  const margin = Math.max(0, marginPerGb({ sellPerGb, costPerGb }));
  const marginRatio = sellPerGb > 0 ? margin / sellPerGb : 0; // 0..1
  const latScore = 1 / (1 + Math.max(0, p95Latency) / 2000);
  const succ = mlMath.clamp(successRate, 0, 1);
  const ban = mlMath.clamp(banRate, 0, 1);
  return mlMath.clamp(succ * (1 - ban) * latScore * (0.4 + 0.6 * marginRatio), 0, 1);
}

/**
 * Normalise a set of provider scores to weights in [floor, 1]. Keeps a minimum
 * floor so a temporarily-degraded provider isn't starved to zero (still probed).
 */
function recommendWeightsFromScores(scoreMap, floor = 0.05) {
  const entries = Object.entries(scoreMap);
  if (!entries.length) return {};
  const max = Math.max(...entries.map(([, s]) => s), 1e-9);
  const out = {};
  for (const [name, s] of entries) out[name] = round(mlMath.clamp(s / max, floor, 1));
  return out;
}

// ── I/O ──────────────────────────────────────────────────────────────────────
/** Blended sell price/GB across active plans (overage rate). */
function blendedSellPerGb() {
  const plans = Object.values(pricing.PLAN_PRICING);
  return mlMath.mean(plans.map((p) => p.overagePerGb));
}

/** Latest provider feature row per provider. */
async function latestProviderFeatures() {
  const rows = await db.sequelize.query(
    `SELECT DISTINCT ON (provider) provider, success_rate, ban_rate, p95_latency, cost_per_gb, efficiency, throughput_gb
     FROM provider_features ORDER BY provider, bucket DESC`,
    { type: Q.SELECT },
  ).catch(() => []);
  return rows;
}

/** Recommend provider weights from current features (consumed by aiRoutingEngine). */
async function recommendProviderWeights() {
  const features = await latestProviderFeatures();
  const sellPerGb = blendedSellPerGb();
  const scores = {};
  const detail = [];
  for (const f of features) {
    const score = providerMarginScore({
      successRate: Number(f.success_rate), banRate: Number(f.ban_rate),
      p95Latency: Number(f.p95_latency), costPerGb: Number(f.cost_per_gb), sellPerGb,
    });
    scores[f.provider] = score;
    detail.push({ provider: f.provider, score: round(score), costPerGb: Number(f.cost_per_gb), margin: round(marginPerGb({ sellPerGb, costPerGb: Number(f.cost_per_gb) })) });
  }
  return { weights: recommendWeightsFromScores(scores), detail, sellPerGb: round(sellPerGb) };
}

/**
 * Low-margin customers: orgs whose effective revenue/GB this period is below the
 * blended provider cost × the margin floor (default 1.3× = 30% margin target).
 */
async function lowMarginCustomers(marginFloor = 1.3) {
  const features = await latestProviderFeatures();
  const blendedCost = features.length ? mlMath.mean(features.map((f) => Number(f.cost_per_gb) || 0.5)) : 0.5;
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const usage = await ts.query(
    `SELECT org_id, SUM(bytes_total) AS bytes FROM org_usage_daily WHERE bucket >= $1 GROUP BY org_id HAVING SUM(bytes_total) > 0`,
    [start],
  );
  const out = [];
  for (const u of usage.rows) {
    const gb = Number(u.bytes) / GB;
    const org = await db.organizations.findByPk(u.org_id).catch(() => null);
    const plan = pricing.planPricing(org?.plan || org?.tier || 'starter');
    // Approximate realised revenue/GB: overage rate when over allowance, else amortised plan.
    const overGb = Math.max(0, gb - plan.includedGb);
    const revenue = overGb * plan.overagePerGb; // conservative (ignores base subscription)
    const revPerGb = gb > 0 ? revenue / gb : 0;
    const breakeven = blendedCost * marginFloor;
    if (revPerGb < breakeven) {
      out.push({ orgId: u.org_id, gb: round(gb), revPerGb: round(revPerGb), breakeven: round(breakeven), plan: org?.plan || org?.tier || 'starter' });
    }
  }
  return out.sort((a, b) => b.gb - a.gb).slice(0, 100);
}

/** Offload recommendations: high-cost providers carrying volume that cheaper, healthy providers could absorb. */
async function offloadRecommendations() {
  const features = await latestProviderFeatures();
  if (features.length < 2) return [];
  const healthy = features.filter((f) => Number(f.success_rate) >= 0.9 && Number(f.ban_rate) <= 0.1);
  const cheapest = healthy.slice().sort((a, b) => Number(a.cost_per_gb) - Number(b.cost_per_gb))[0];
  if (!cheapest) return [];
  const recs = [];
  for (const f of features) {
    if (f.provider === cheapest.provider) continue;
    const delta = Number(f.cost_per_gb) - Number(cheapest.cost_per_gb);
    if (delta > 0.2 && Number(f.throughput_gb) > 0) {
      const monthlySaving = delta * Number(f.throughput_gb) * 30; // 24h throughput → ~monthly
      recs.push({ from: f.provider, to: cheapest.provider, costDelta: round(delta), estMonthlySaving: round(monthlySaving) });
    }
  }
  return recs.sort((a, b) => b.estMonthlySaving - a.estMonthlySaving);
}

function round(n) { return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000; }

module.exports = {
  marginPerGb, providerMarginScore, recommendWeightsFromScores,
  recommendProviderWeights, lowMarginCustomers, offloadRecommendations, blendedSellPerGb,
};
