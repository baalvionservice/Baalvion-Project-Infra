'use strict';

// Network-intelligence pure-logic tests — `npm test` (node --test), no DB/Redis.
// These exercise the REAL model math: logistic regression, robust-z anomaly,
// Holt-Winters forecasting, PSI drift, routing/margin scoring.

const { test } = require('node:test');
const assert = require('node:assert');

require('../_env'); // dummy auth/billing secrets so the fail-loud config boots under CI (no .env)
const ml = require('../service/mlMath');
const ai = require('../service/aiRoutingEngine');
const cost = require('../service/costOptimizer');
const forecasting = require('../service/forecastingEngine');
const features = require('../service/featureEngineering');
const ban = require('../service/banPrediction');

// ── logistic regression learns a separable boundary ───────────────────────────
test('mlMath: logistic regression separates a linearly-separable set', () => {
  const X = [];
  const y = [];
  for (let i = 0; i < 100; i++) {
    const positive = i % 2 === 0;
    // feature strongly correlated with the label + noise.
    X.push([positive ? 3 + Math.random() : -3 + Math.random(), Math.random()]);
    y.push(positive ? 1 : 0);
  }
  const model = ml.trainLogisticRegression(X, y, { epochs: 400, lr: 0.3 });
  const pPos = ml.logisticPredict(model, [3, 0.5]);
  const pNeg = ml.logisticPredict(model, [-3, 0.5]);
  assert.ok(pPos > 0.8, `positive prob ${pPos}`);
  assert.ok(pNeg < 0.2, `negative prob ${pNeg}`);
  const preds = X.map((r) => ml.logisticPredict(model, r));
  assert.ok(ml.rocAuc(y, preds) > 0.9, 'AUC should be high on separable data');
});

test('mlMath: sigmoid + logLoss are well-behaved', () => {
  assert.strictEqual(ml.sigmoid(0), 0.5);
  assert.ok(ml.sigmoid(100) > 0.999 && ml.sigmoid(-100) < 0.001);
  const perfect = ml.logLoss([1, 0], [0.999, 0.001]);
  const wrong = ml.logLoss([1, 0], [0.001, 0.999]);
  assert.ok(wrong > perfect, 'wrong predictions have higher loss');
});

// ── robust anomaly z-score ─────────────────────────────────────────────────────
test('mlMath: robust z-score flags spikes, ignores normal variation', () => {
  const hist = [10, 11, 9, 10, 12, 10, 11, 9, 10, 10];
  assert.ok(Math.abs(ml.robustZScore(10, hist)) < 1, 'normal point ~0');
  assert.ok(Math.abs(ml.robustZScore(100, hist)) >= 3.5, 'spike is an anomaly');
  assert.strictEqual(ml.severityFromZ(7), 'critical');
  assert.strictEqual(ml.severityFromZ(4), 'medium');
});

test('mlMath: MAD/median resist outliers', () => {
  assert.strictEqual(ml.median([1, 2, 3, 4, 5]), 3);
  assert.strictEqual(ml.median([1, 2, 3, 4]), 2.5);
  // one huge outlier barely moves the median.
  assert.strictEqual(ml.median([1, 2, 3, 4, 1000]), 3);
});

// ── forecasting ─────────────────────────────────────────────────────────────────
test('mlMath: Holt-Winters continues a linear trend', () => {
  const series = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20
  const hw = ml.holtWinters(series, { horizon: 5, period: 7 });
  assert.strictEqual(hw.forecast.length, 5);
  assert.ok(hw.forecast[0] >= 19, `next point should continue upward, got ${hw.forecast[0]}`);
  // prediction interval ordering holds.
  hw.forecast.forEach((f, i) => {
    assert.ok(hw.lower[i] <= f && f <= hw.upper[i], 'interval brackets the point');
  });
});

test('mlMath: linearRegression recovers slope', () => {
  const ys = [2, 4, 6, 8, 10]; // slope 2, intercept 2
  const { slope, intercept, r2 } = ml.linearRegression(ys);
  assert.ok(Math.abs(slope - 2) < 1e-6);
  assert.ok(Math.abs(intercept - 2) < 1e-6);
  assert.ok(r2 > 0.999);
});

test('forecasting: churn risk rises with disengagement', () => {
  const low = forecasting.churnRiskScore({ daysSinceLastUse: 0, usageTrendPct: 20, failedPayments: 0, tenureDays: 300 });
  const high = forecasting.churnRiskScore({ daysSinceLastUse: 30, usageTrendPct: -80, failedPayments: 3, tenureDays: 10 });
  assert.ok(high > low, `${high} should exceed ${low}`);
  assert.ok(low >= 0 && low <= 1 && high >= 0 && high <= 1);
});

// ── drift ───────────────────────────────────────────────────────────────────────
test('mlMath: PSI ~0 for same dist, large for shifted', () => {
  const base = Array.from({ length: 200 }, (_, i) => i % 10);
  assert.ok(ml.psi(base, base) < 0.05);
  assert.ok(ml.psi(base, base.map((v) => v + 50)) > 0.2);
});

// ── routing brain scoring ───────────────────────────────────────────────────────
test('aiRoutingEngine: scoreProvider rewards health, penalises bans', () => {
  const good = ai.scoreProvider({ successRate: 0.99, latencyScore: 0.9, banProb: 0.02, marginScore: 0.9, stability: 1 });
  const banned = ai.scoreProvider({ successRate: 0.99, latencyScore: 0.9, banProb: 0.95, marginScore: 0.9, stability: 1 });
  const dead = ai.scoreProvider({ successRate: 0.2, latencyScore: 0.1, banProb: 0.5, marginScore: 0.2, stability: 0 });
  assert.ok(good > banned, 'high ban prob lowers the score');
  assert.ok(banned > dead, 'a totally unhealthy provider scores lowest');
  assert.ok(good <= 1 && dead >= 0);
});

test('aiRoutingEngine: latencyScore is monotonic decreasing', () => {
  assert.ok(ai.latencyScore(100) > ai.latencyScore(2000));
  assert.ok(ai.latencyScore(2000) > ai.latencyScore(10000));
});

// ── cost / margin optimization ────────────────────────────────────────────────
test('costOptimizer: margin score prefers cheaper, healthier providers', () => {
  const cheapHealthy = cost.providerMarginScore({ successRate: 0.98, banRate: 0.02, p95Latency: 400, costPerGb: 1, sellPerGb: 4 });
  const expensiveHealthy = cost.providerMarginScore({ successRate: 0.98, banRate: 0.02, p95Latency: 400, costPerGb: 3.5, sellPerGb: 4 });
  assert.ok(cheapHealthy > expensiveHealthy, 'lower cost → higher margin score');
});

test('costOptimizer: weights normalise to a floor..1 range', () => {
  const w = cost.recommendWeightsFromScores({ a: 0.9, b: 0.45, c: 0.0 });
  assert.strictEqual(w.a, 1); // best → 1
  assert.ok(w.b > 0 && w.b < 1);
  assert.ok(w.c >= 0.05, 'floor prevents starvation');
});

// ── feature engineering pure helpers ───────────────────────────────────────────
test('featureEngineering: target classification + efficiency', () => {
  assert.strictEqual(features.targetClass('www.amazon.com'), 'ecommerce');
  assert.strictEqual(features.targetClass('instagram.com'), 'social');
  assert.strictEqual(features.targetClass('example.org'), 'generic');
  const eff = features.providerEfficiency({ successRate: 1, costPerGb: 1, p95Latency: 0 });
  const effExpensive = features.providerEfficiency({ successRate: 1, costPerGb: 5, p95Latency: 0 });
  assert.ok(eff > effExpensive, 'cheaper provider is more efficient');
});

test('banPrediction: feature vector order + hardness prior', () => {
  const v = ban.featureVector({ failRate: 0.5, captchaRate: 0.2, targetClass: 'sneaker_ticket' });
  assert.strictEqual(v.length, ban.FEATURES.length);
  assert.strictEqual(v[6], ban.hardness('sneaker_ticket'));
  assert.ok(ban.hardness('sneaker_ticket') > ban.hardness('generic'));
});
