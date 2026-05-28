'use strict';

/**
 * ML model registry over the `ml_models` table. Stores versioned model params
 * (real coefficients/weights), promotes one version to `active` per model name,
 * publishes the active model to Redis (`ml:model:{name}`) for low-latency serving
 * by the Node inference layer + the gateway, records evaluation metrics
 * (drift/accuracy) and writes append-only inference logs.
 *
 * This is a lightweight, self-hosted MLflow-equivalent: it works with the Node
 * models out of the box, and the Python ml-service registers sklearn models here
 * too (framework='sklearn', params point at the artifact uri).
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

/** Save a new model version (auto-increments version per name). */
async function saveModel({ name, algorithm, framework = 'node', params = {}, featureNames = [], metrics = {}, trainedRows = 0, activate = false }) {
  const [{ next }] = await db.sequelize.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM ml_models WHERE name = :name`,
    { replacements: { name }, type: Q.SELECT },
  );
  const version = Number(next);
  const [row] = await db.sequelize.query(
    `INSERT INTO ml_models (name, version, algorithm, framework, params, feature_names, metrics, trained_rows, status)
     VALUES (:name, :version, :algorithm, :framework, :params::jsonb, :features, :metrics::jsonb, :rows, :status)
     RETURNING id, version`,
    { replacements: {
        name, version, algorithm, framework,
        params: JSON.stringify(params), features: featureNames,
        metrics: JSON.stringify(metrics), rows: trainedRows,
        status: activate ? 'active' : 'shadow',
      }, type: Q.SELECT },
  );
  if (activate) await promote(name, version);
  return { id: row.id, name, version, status: activate ? 'active' : 'shadow' };
}

/** Promote a version to active (demotes the previous active to archived) + publish. */
async function promote(name, version) {
  await db.sequelize.transaction(async (tx) => {
    await db.sequelize.query(
      `UPDATE ml_models SET status = 'archived' WHERE name = :name AND status = 'active' AND version <> :version`,
      { replacements: { name, version }, type: Q.UPDATE, transaction: tx },
    );
    await db.sequelize.query(
      `UPDATE ml_models SET status = 'active' WHERE name = :name AND version = :version`,
      { replacements: { name, version }, type: Q.UPDATE, transaction: tx },
    );
  });
  await publishActive(name);
  return { name, version, status: 'active' };
}

async function getActive(name) {
  const rows = await db.sequelize.query(
    `SELECT name, version, algorithm, framework, params, feature_names, metrics, trained_at
     FROM ml_models WHERE name = :name AND status = 'active' ORDER BY version DESC LIMIT 1`,
    { replacements: { name }, type: Q.SELECT },
  );
  return rows[0] || null;
}

/** Cached active-model fetch: Redis first (published params), DB fallback. */
async function getActiveCached(name) {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(`ml:model:${name}`);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* fall through to DB */ }
  }
  const m = await getActive(name);
  if (m && redis) {
    try { await redis.set(`ml:model:${name}`, JSON.stringify(m), 'EX', 3600); } catch (_) {}
  }
  return m;
}

async function publishActive(name) {
  const m = await getActive(name);
  const redis = getRedis();
  if (m && redis) {
    try { await redis.set(`ml:model:${name}`, JSON.stringify(m), 'EX', 3600); } catch (err) { logger.error('[mlRegistry] publish failed:', err.message); }
  }
  return m;
}

async function listModels() {
  return db.sequelize.query(
    `SELECT name, version, algorithm, framework, status, trained_rows, metrics, trained_at
     FROM ml_models ORDER BY name, version DESC`,
    { type: Q.SELECT },
  );
}

async function recordMetric({ modelName, version, metric, value, windowStart = null, windowEnd = null }) {
  await db.sequelize.query(
    `INSERT INTO ml_model_metrics (model_name, version, metric, value, window_start, window_end)
     VALUES (:name, :version, :metric, :value, :ws, :we)`,
    { replacements: { name: modelName, version: version || null, metric, value: Number(value), ws: windowStart, we: windowEnd }, type: Q.INSERT },
  );
  return { modelName, metric, value };
}

async function metricHistory(modelName, metric, limit = 100) {
  return db.sequelize.query(
    `SELECT version, metric, value, evaluated_at FROM ml_model_metrics
     WHERE model_name = :name AND metric = :metric ORDER BY evaluated_at DESC LIMIT :limit`,
    { replacements: { name: modelName, metric, limit }, type: Q.SELECT },
  );
}

/** Append-only inference log (sampled by callers to bound volume). */
async function logInference({ modelName, version, source = 'node', features = {}, output = {}, latencyMs = null }) {
  try {
    await db.sequelize.query(
      `INSERT INTO inference_logs (model_name, model_version, source, features, output, latency_ms)
       VALUES (:name, :version, :source, :features::jsonb, :output::jsonb, :lat)`,
      { replacements: { name: modelName, version: version || null, source,
          features: JSON.stringify(features), output: JSON.stringify(output), lat: latencyMs }, type: Q.INSERT },
    );
  } catch (err) { logger.error('[mlRegistry] logInference failed:', err.message); }
}

module.exports = {
  saveModel, promote, getActive, getActiveCached, publishActive,
  listModels, recordMetric, metricHistory, logInference,
};
