'use strict';

// Network-intelligence Prometheus metrics. prom-client optional (no-op if
// absent) so the app boots without the dependency. Exposes the model-quality +
// optimization-gain series the prompt requires.
let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function gauge(name, help, labels = []) {
  if (!client) return { set: () => {}, inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Gauge({ name, help, labelNames: labels });
}
function counter(name, help, labels = []) {
  if (!client) return { inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Counter({ name, help, labelNames: labels });
}
function hist(name, help, labels = [], buckets) {
  if (!client) return { observe: () => {} };
  return client.register.getSingleMetric(name) || new client.Histogram({ name, help, labelNames: labels, buckets: buckets || [1, 5, 10, 25, 50, 100, 250, 500] });
}

const routingAccuracy = gauge('routing_accuracy', 'Realised routing decision accuracy (0..1)', []);
const banPredAccuracy = gauge('ban_prediction_accuracy', 'Ban model AUC / accuracy (0..1)', []);
const anomalyRate = counter('anomaly_detection_total', 'Anomalies detected', ['scope', 'severity']);
const forecastAccuracy = gauge('forecast_accuracy', 'Forecast accuracy (1 - normalised MAE)', ['metric']);
const providerEfficiency = gauge('provider_efficiency', 'Provider efficiency score', ['provider']);
const providerWeight = gauge('ai_provider_weight', 'Published AI routing weight', ['provider']);
const marginGain = gauge('margin_optimization_gain', 'Estimated monthly margin gain (USD) from optimization', []);
const predictiveFailovers = counter('predictive_failover_total', 'Predictive failovers triggered', []);
const forecastHorizonGb = gauge('forecast_horizon_bandwidth_gb', 'Forecasted bandwidth over horizon (GB)', []);
const inferenceLatency = hist('ml_inference_latency_ms', 'ML inference latency (ms)', ['model'], [1, 5, 10, 25, 50, 100, 250, 500, 1000]);

module.exports = {
  enabled: Boolean(client),
  setRoutingAccuracy: (v) => routingAccuracy.set(Number(v)),
  setBanModelAuc: (v) => banPredAccuracy.set(Number(v)),
  incAnomaly: (scope, severity) => anomalyRate.inc({ scope, severity }),
  setForecastAccuracy: (metric, v) => forecastAccuracy.set({ metric }, Number(v)),
  setProviderEfficiency: (provider, v) => providerEfficiency.set({ provider }, Number(v)),
  setProviderWeight: (provider, v) => providerWeight.set({ provider }, Number(v)),
  setMarginGain: (v) => marginGain.set(Number(v)),
  incPredictiveFailover: () => predictiveFailovers.inc(),
  setForecastHorizonGb: (v) => forecastHorizonGb.set(Number(v)),
  observeInference: (model, ms) => inferenceLatency.observe({ model }, Number(ms)),
};
