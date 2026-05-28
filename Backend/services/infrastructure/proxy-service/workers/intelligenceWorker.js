'use strict';

/**
 * Intelligence scheduler — runs the AI control loop on cadence:
 *   - feature refresh           every 15 min   (featureEngineering.refreshAll)
 *   - route weight publish      every 60 s     (aiRoutingEngine.publishRouteWeights)
 *   - predictive failover       every 60 s     (aiRoutingEngine.predictiveFailover)
 *   - anomaly sweep             every 2 min    (anomalyDetection.sweep)
 *   - ban route scoring         every 15 min   (banPrediction.scoreRoutes)
 *   - SLA intelligence          every 10 min   (slaIntelligence.evaluateEnterprise)
 *   - ban model train           daily          (banPrediction.trainBanModel)
 *   - forecasts                 daily          (forecastingEngine.runForecasts)
 *
 * Also starts the telemetry→ClickHouse pipeline. Started from workers/index.js.
 */

const featureEngineering = require('../service/featureEngineering');
const aiRoutingEngine = require('../service/aiRoutingEngine');
const anomalyDetection = require('../service/anomalyDetection');
const banPrediction = require('../service/banPrediction');
const forecastingEngine = require('../service/forecastingEngine');
const slaIntelligence = require('../service/slaIntelligence');
const telemetryPipeline = require('./telemetryPipeline');
const logger = require('../service/logger');

const timers = [];
let lastDailyDay = -1;

function every(ms, label, fn) {
  const t = setInterval(() => {
    Promise.resolve().then(fn).catch((e) => logger.error(`[intel] ${label}:`, e.message));
  }, ms);
  timers.push(t);
}

async function start() {
  await telemetryPipeline.start().catch((e) => logger.error('[intel] telemetry pipeline start:', e.message));

  // Warm the feature store + first weights at boot (non-fatal if DB not migrated yet).
  featureEngineering.refreshAll().then(() => aiRoutingEngine.publishRouteWeights()).catch((e) => logger.error('[intel] warm-up:', e.message));

  every(60 * 1000, 'route-weights', async () => {
    await aiRoutingEngine.publishRouteWeights();
    await aiRoutingEngine.predictiveFailover();
  });
  every(2 * 60 * 1000, 'anomaly-sweep', () => anomalyDetection.sweep());
  every(10 * 60 * 1000, 'sla-intel', () => slaIntelligence.evaluateEnterprise());
  every(15 * 60 * 1000, 'feature-refresh', () => featureEngineering.refreshAll());
  every(15 * 60 * 1000, 'ban-score', () => banPrediction.scoreRoutes());

  // Daily heavy jobs (train + forecasts) — run at ~03:00 UTC, once per day.
  every(30 * 60 * 1000, 'daily-check', async () => {
    const now = new Date();
    if (now.getUTCHours() === 3 && now.getUTCDate() !== lastDailyDay) {
      lastDailyDay = now.getUTCDate();
      logger.info('[intel] running daily train + forecasts');
      await banPrediction.trainBanModel().catch((e) => logger.error('[intel] ban train:', e.message));
      await forecastingEngine.runForecasts().catch((e) => logger.error('[intel] forecasts:', e.message));
    }
  });

  logger.info('[intel] intelligence scheduler started');
}

function stop() {
  for (const t of timers) clearInterval(t);
  telemetryPipeline.stop();
  logger.info('[intel] intelligence scheduler stopped');
}

module.exports = { start, stop };
