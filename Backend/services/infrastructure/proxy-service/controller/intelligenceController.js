'use strict';

/**
 * AI network-intelligence control plane (mounted under /v1/admin, platform-admin
 * only). Model registry + training, live route-weight publishing + predictive
 * failover, ban-probability + anomaly inspection, forecasting, and autonomous
 * cost/margin optimization.
 */

const db = require('../models');
const registry = require('../service/mlRegistry');
const banPrediction = require('../service/banPrediction');
const anomalyDetection = require('../service/anomalyDetection');
const forecastingEngine = require('../service/forecastingEngine');
const aiRoutingEngine = require('../service/aiRoutingEngine');
const costOptimizer = require('../service/costOptimizer');
const featureEngineering = require('../service/featureEngineering');
const slaIntelligence = require('../service/slaIntelligence');
const { sendSuccess } = require('../utils/response');

const Q = db.Sequelize.QueryTypes;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (err) { next(err); } };

module.exports = {
  // ─── Models / registry ────────────────────────────────────────────────────
  listModels: wrap(async (req, res) => sendSuccess(req, res, await registry.listModels())),
  modelMetrics: wrap(async (req, res) =>
    sendSuccess(req, res, await registry.metricHistory(req.params.name, req.query.metric || 'auc', Number(req.query.limit || 100)))),
  promoteModel: wrap(async (req, res) =>
    sendSuccess(req, res, await registry.promote(req.params.name, Number(req.body.version)), 200)),

  // ─── Ban prediction ─────────────────────────────────────────────────────────
  trainBan: wrap(async (req, res) => sendSuccess(req, res, await banPrediction.trainBanModel(Number(req.body.days || 14)), 202)),
  scoreBanRoutes: wrap(async (req, res) => sendSuccess(req, res, await banPrediction.scoreRoutes(Number(req.body.days || 2)), 202)),
  banProbabilities: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT route_key, provider, country, target_class, ban_probability, computed_at
     FROM ban_probability_models ORDER BY ban_probability DESC LIMIT :limit`,
    { replacements: { limit: Number(req.query.limit || 100) }, type: Q.SELECT },
  ))),

  // ─── Routing brain ────────────────────────────────────────────────────────
  routeWeights: wrap(async (req, res) => sendSuccess(req, res, await aiRoutingEngine.currentWeights())),
  recomputeWeights: wrap(async (req, res) => sendSuccess(req, res, await aiRoutingEngine.publishRouteWeights(), 202)),
  predictiveFailover: wrap(async (req, res) => sendSuccess(req, res, await aiRoutingEngine.predictiveFailover(), 202)),

  // ─── Feature store ──────────────────────────────────────────────────────────
  refreshFeatures: wrap(async (req, res) => sendSuccess(req, res, await featureEngineering.refreshAll(), 202)),
  providerFeatures: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT DISTINCT ON (provider) provider, success_rate, ban_rate, p50_latency, p95_latency, throughput_gb, cost_per_gb, efficiency, sample_count, computed_at
     FROM provider_features ORDER BY provider, bucket DESC`,
    { type: Q.SELECT },
  ))),
  asnQuality: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT asn, quality_score, success_rate, ban_rate, sample_count, updated_at FROM asn_quality_scores ORDER BY quality_score DESC LIMIT :limit`,
    { replacements: { limit: Number(req.query.limit || 200) }, type: Q.SELECT },
  ))),

  // ─── Anomalies ────────────────────────────────────────────────────────────
  listAnomalies: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, scope, entity_id, metric, observed, expected, score, severity, status, mitigation, detected_at
     FROM anomaly_events ${req.query.status ? 'WHERE status = :status' : ''} ORDER BY detected_at DESC LIMIT :limit`,
    { replacements: { status: req.query.status, limit: Number(req.query.limit || 100) }, type: Q.SELECT },
  ))),
  resolveAnomaly: wrap(async (req, res) => {
    await db.sequelize.query(
      `UPDATE anomaly_events SET status = :status, resolved_at = CASE WHEN :status IN ('resolved','false_positive') THEN now() ELSE resolved_at END WHERE id = :id`,
      { replacements: { id: req.params.id, status: req.body.status || 'resolved' }, type: Q.UPDATE },
    );
    sendSuccess(req, res, { id: req.params.id, status: req.body.status || 'resolved' });
  }),
  sweepAnomalies: wrap(async (req, res) => sendSuccess(req, res, await anomalyDetection.sweep(), 202)),

  // ─── Forecasting ────────────────────────────────────────────────────────────
  runForecasts: wrap(async (req, res) => sendSuccess(req, res, await forecastingEngine.runForecasts(), 202)),
  platformForecast: wrap(async (req, res) => sendSuccess(req, res, await forecastingEngine.forecastPlatformBandwidth(Number(req.query.horizon || 30)))),
  providerCostForecast: wrap(async (req, res) => sendSuccess(req, res, await forecastingEngine.forecastProviderCost(Number(req.query.horizon || 30)))),
  latestForecasts: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT DISTINCT ON (entity_type, entity_id, metric) entity_type, entity_id, metric, point_value, model, generated_at
     FROM forecasts WHERE metric = COALESCE(:metric, metric) ORDER BY entity_type, entity_id, metric, generated_at DESC LIMIT :limit`,
    { replacements: { metric: req.query.metric || null, limit: Number(req.query.limit || 200) }, type: Q.SELECT },
  ))),

  // ─── Cost / margin optimization ─────────────────────────────────────────────
  costOptimization: wrap(async (req, res) => {
    const [weights, lowMargin, offload] = await Promise.all([
      costOptimizer.recommendProviderWeights(),
      costOptimizer.lowMarginCustomers(Number(req.query.marginFloor || 1.3)),
      costOptimizer.offloadRecommendations(),
    ]);
    sendSuccess(req, res, { recommendedWeights: weights, lowMarginCustomers: lowMargin, offloadRecommendations: offload });
  }),

  // ─── SLA intelligence ───────────────────────────────────────────────────────
  slaRisk: wrap(async (req, res) => sendSuccess(req, res, await slaIntelligence.evaluateEnterprise())),
};
