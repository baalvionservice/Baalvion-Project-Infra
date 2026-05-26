'use strict';

/**
 * Ban prediction engine. Trains a REAL logistic-regression classifier (mlMath,
 * gradient descent) on historical routing telemetry and serves a ban-probability
 * per route (provider|country|target_class). Probabilities are persisted to
 * ban_probability_models and published to Redis (`ban:prob:{routeKey}`) so the Go
 * gateway can pre-emptively avoid high-ban routes BEFORE dialing.
 *
 * Label: a route-hour is "banned" when its observed ban+captcha rate exceeds a
 * threshold. Features are rates engineered by featureEngineering + telemetry.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const ch = require('./chClient');
const mlMath = require('./mlMath');
const registry = require('./mlRegistry');
const { targetClass } = require('./featureEngineering');
const { getRedis } = require('./redisClient');
const logger = require('./logger');
const intelMetrics = require('../observability/intelligenceMetrics');

const Q = db.Sequelize.QueryTypes;

const MODEL = 'ban_predictor';
const FEATURES = ['fail_rate', 'captcha_rate', 'err4xx_rate', 'err5xx_rate', 'latency_norm', 'recent_ban_rate', 'target_hardness'];
const BAN_LABEL_THRESHOLD = Number(process.env.BAN_LABEL_THRESHOLD || 0.15);

// Prior "hardness" per target class — anti-bot aggressiveness. Used as a feature
// AND as a fallback when no model is trained yet (cold start).
const TARGET_HARDNESS = {
  sneaker_ticket: 0.9, social: 0.7, search: 0.6, ecommerce: 0.5, travel: 0.45, generic: 0.3,
};

function hardness(cls) {
  return TARGET_HARDNESS[cls] ?? 0.3;
}

/** Build a feature vector (order MUST match FEATURES). */
function featureVector(f) {
  return [
    mlMath.clamp(f.failRate ?? 0, 0, 1),
    mlMath.clamp(f.captchaRate ?? 0, 0, 1),
    mlMath.clamp(f.err4xxRate ?? 0, 0, 1),
    mlMath.clamp(f.err5xxRate ?? 0, 0, 1),
    mlMath.clamp((f.latencyMs ?? 0) / 5000, 0, 2), // normalise ~5s
    mlMath.clamp(f.recentBanRate ?? 0, 0, 1),
    hardness(f.targetClass || 'generic'),
  ];
}

// ── training ────────────────────────────────────────────────────────────────
/** Pull the hourly ban training set. Prefers ClickHouse; falls back to Timescale. */
async function loadTrainingSet(days = 14) {
  if (ch.isEnabled()) {
    try {
      const since = Math.floor((Date.now() - days * 86400000) / 1000);
      const rows = await ch.query(
        `SELECT provider, country, target_class,
                requests, failures, bans, captchas, err_4xx, err_5xx,
                avgMerge(avg_latency) AS latency
         FROM baalvion.ban_features_hourly
         WHERE hour >= toDateTime(${since}) GROUP BY provider, country, target_class, requests, failures, bans, captchas, err_4xx, err_5xx, avg_latency
         HAVING requests >= 20 LIMIT 200000`,
      );
      return rows.map((r) => mapTrainingRow(r));
    } catch (e) { logger.error('[banPredict] CH train load failed, falling back:', e.message); }
  }
  // Timescale fallback (no explicit captcha/ban flag → approximate from status).
  const since = new Date(Date.now() - days * 86400000);
  const res = await ts.query(
    `SELECT provider, country, dest_host AS target,
            COUNT(*) AS requests,
            COUNT(*) FILTER (WHERE NOT success) AS failures,
            COUNT(*) FILTER (WHERE status IN (403,429)) AS bans,
            COUNT(*) FILTER (WHERE status = 429) AS captchas,
            COUNT(*) FILTER (WHERE status >= 400 AND status < 500) AS err_4xx,
            COUNT(*) FILTER (WHERE status >= 500) AS err_5xx,
            AVG(latency_ms) AS latency
     FROM usage_events WHERE ts >= $1 AND dest_host IS NOT NULL
     GROUP BY provider, country, dest_host HAVING COUNT(*) >= 20 LIMIT 200000`,
    [since],
  );
  return res.rows.map((r) => mapTrainingRow({ ...r, target_class: targetClass(r.target) }));
}

function mapTrainingRow(r) {
  const requests = Number(r.requests) || 1;
  const failRate = Number(r.failures) / requests;
  const banRate = Number(r.bans) / requests;
  const captchaRate = Number(r.captchas) / requests;
  const f = {
    country: r.country || 'any',
    failRate,
    captchaRate,
    err4xxRate: Number(r.err_4xx) / requests,
    err5xxRate: Number(r.err_5xx) / requests,
    latencyMs: Number(r.latency) || 0,
    recentBanRate: banRate,
    targetClass: r.target_class || 'generic',
  };
  const label = banRate + captchaRate >= BAN_LABEL_THRESHOLD ? 1 : 0;
  return { provider: r.provider || 'any', country: r.country || 'any', x: featureVector(f), y: label, raw: f };
}

/** Train + register the ban model. Returns metrics. */
async function trainBanModel(days = 14) {
  const data = await loadTrainingSet(days);
  if (data.length < 50) {
    logger.warn(`[banPredict] insufficient data (${data.length} rows) — keeping current model`);
    return { trained: false, rows: data.length };
  }
  const X = data.map((d) => d.x);
  const y = data.map((d) => d.y);
  const model = mlMath.trainLogisticRegression(X, y, { lr: 0.3, epochs: 600, l2: 1e-3 });
  const preds = X.map((row) => mlMath.logisticPredict(model, row));
  const auc = mlMath.rocAuc(y, preds);
  const metrics = { auc, logloss: model.logloss, classBalance: model.classBalance };

  const saved = await registry.saveModel({
    name: MODEL, algorithm: 'logistic_regression', framework: 'node',
    params: { weights: model.weights, bias: model.bias, mu: model.mu, sigma: model.sigma },
    featureNames: FEATURES, metrics, trainedRows: data.length,
    activate: auc >= 0.6, // only promote if it beats coin-flip meaningfully
  });
  await registry.recordMetric({ modelName: MODEL, version: saved.version, metric: 'auc', value: auc });
  await registry.recordMetric({ modelName: MODEL, version: saved.version, metric: 'logloss', value: model.logloss });
  intelMetrics.setBanModelAuc(auc);
  logger.info(`[banPredict] trained v${saved.version} rows=${data.length} auc=${auc.toFixed(3)} promoted=${auc >= 0.6}`);
  return { trained: true, version: saved.version, rows: data.length, ...metrics };
}

// ── inference ─────────────────────────────────────────────────────────────────
/** Predict ban probability for a feature object. Cold-start = hardness prior. */
async function predictBanProbability(f) {
  const model = await registry.getActiveCached(MODEL);
  const x = featureVector(f);
  if (!model || !model.params || !model.params.weights) {
    // No trained model yet → blend recent ban rate with the target hardness prior.
    return mlMath.clamp(0.5 * (f.recentBanRate ?? 0) + 0.5 * hardness(f.targetClass || 'generic'), 0, 1);
  }
  return mlMath.logisticPredict(model.params, x);
}

/** Score current routes and publish ban probabilities for the gateway. */
async function scoreRoutes(days = 2) {
  const data = await loadTrainingSet(days);
  const redis = getRedis();
  let published = 0;
  const seen = new Set();
  // Aggregate to route keys (provider|country|target_class) using the latest features.
  for (const d of data) {
    const f = d.raw;
    const routeKey = `${d.provider || 'any'}|${f.country || 'any'}|${f.targetClass}`;
    // loadTrainingSet rows don't carry provider/country on the raw obj for CH path;
    // reconstruct from the row when present.
    const provider = d.provider || 'any';
    const country = f.country || 'any';
    if (seen.has(routeKey)) continue;
    seen.add(routeKey);
    const prob = await predictBanProbability(f);
    await db.sequelize.query(
      `INSERT INTO ban_probability_models (route_key, provider, country, target_class, ban_probability, features, computed_at)
       VALUES (:k, :p, :c, :tc, :prob, :feat::jsonb, now())
       ON CONFLICT (route_key) DO UPDATE SET ban_probability=EXCLUDED.ban_probability, features=EXCLUDED.features, computed_at=now()`,
      { replacements: { k: routeKey, p: provider, c: country, tc: f.targetClass, prob, feat: JSON.stringify(f) }, type: Q.INSERT },
    ).catch(() => {});
    if (redis && prob >= 0.5) {
      try { await redis.set(`ban:prob:${routeKey}`, prob.toFixed(4), 'EX', 1800); published++; } catch (_) {}
    }
  }
  return { routes: seen.size, highRiskPublished: published };
}

module.exports = {
  MODEL, FEATURES, featureVector, hardness,
  trainBanModel, predictBanProbability, scoreRoutes, loadTrainingSet,
};
