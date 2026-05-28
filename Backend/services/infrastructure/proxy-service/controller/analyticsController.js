'use strict';

/**
 * Enterprise analytics platform (org-scoped, mounted under /v1/analytics). Real
 * measurements from TimescaleDB + the feature store + forecasting engine. Every
 * endpoint is scoped to the caller's verified organization (never a client-
 * supplied id). Profitability/all-provider analytics stay admin-only (see
 * intelligenceController); this is the customer/enterprise self-service surface.
 */

const db = require('../models');
const ts = require('../service/timeseriesDb');
const analyticsService = require('../service/analyticsService');
const forecastingEngine = require('../service/forecastingEngine');
const slaIntelligence = require('../service/slaIntelligence');
const pricing = require('../service/pricing');
const { sendSuccess } = require('../utils/response');

const GB = pricing.BYTES_PER_GB;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (err) { next(err); } };
const orgOf = (req) => req.auth.organizationId || req.auth.orgId;

module.exports = {
  // Live dashboard summary (reuses the real analytics service).
  dashboard: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getDashboardSummary(req.auth))),

  // Geo heatmap: per-country requests + bytes + latency model, for the org.
  geoHeatmap: wrap(async (req, res) => {
    const orgId = orgOf(req);
    const usage = await ts.query(
      `SELECT country, SUM(requests)::bigint AS reqs, SUM(bytes_total)::bigint AS bytes
       FROM geo_usage_hourly WHERE org_id = $1 AND bucket >= now() - interval '7 days' AND country <> ''
       GROUP BY country ORDER BY bytes DESC LIMIT 200`,
      [orgId],
    );
    const lat = await db.sequelize.query(
      `SELECT country, p50, p95 FROM geo_latency_models`, { type: db.Sequelize.QueryTypes.SELECT },
    ).catch(() => []);
    const latMap = Object.fromEntries(lat.map((r) => [r.country, r]));
    sendSuccess(req, res, usage.rows.map((r) => ({
      country: (r.country || '').toUpperCase(),
      requests: Number(r.reqs),
      gb: Math.round((Number(r.bytes) / GB) * 100) / 100,
      p50Latency: Math.round(Number(latMap[r.country]?.p50) || 0),
      p95Latency: Math.round(Number(latMap[r.country]?.p95) || 0),
    })));
  }),

  // Latency distribution + top domains (traffic intelligence).
  trafficIntelligence: wrap(async (req, res) => {
    const [latency, domains] = await Promise.all([
      analyticsService.getLatencyDistribution(req.auth),
      analyticsService.getTopDomains(req.auth),
    ]);
    sendSuccess(req, res, { latencyDistribution: latency, topDomains: domains });
  }),

  // Bandwidth forecast for the org (Holt-Winters).
  bandwidthForecast: wrap(async (req, res) =>
    sendSuccess(req, res, await forecastingEngine.forecastBandwidth(orgOf(req), Number(req.query.horizon || 30)))),

  // Quota-exhaustion projection (when allowance / ceiling is reached).
  quotaForecast: wrap(async (req, res) =>
    sendSuccess(req, res, await forecastingEngine.forecastQuotaExhaustion(orgOf(req)))),

  // SLA risk for the caller's org (read-only; no auto-action from this surface).
  slaRisk: wrap(async (req, res) =>
    sendSuccess(req, res, await slaIntelligence.predictSlaRisk(orgOf(req), { autoAct: false }))),

  // Provider mix the org is actually being routed through (transparency).
  providerMix: wrap(async (req, res) => {
    const orgId = orgOf(req);
    const rows = await ts.query(
      `SELECT provider, SUM(bytes_total)::bigint AS bytes, SUM(requests)::bigint AS reqs
       FROM provider_usage_daily WHERE org_id = $1 AND bucket >= now() - interval '30 days'
       GROUP BY provider ORDER BY bytes DESC`,
      [orgId],
    );
    const total = rows.rows.reduce((s, r) => s + Number(r.bytes), 0) || 1;
    sendSuccess(req, res, rows.rows.map((r) => ({
      provider: r.provider, gb: Math.round((Number(r.bytes) / GB) * 100) / 100,
      requests: Number(r.reqs), share: Math.round((100 * Number(r.bytes)) / total * 100) / 100,
    })));
  }),
};
