'use strict';

/**
 * Prometheus metrics for the auth layer.
 *
 * prom-client is an optional dependency at runtime: if it is not installed the
 * module degrades to no-ops so the service still boots. Install it
 * (`npm i prom-client`) to light these up. Metrics register on prom-client's
 * default registry, shared with observability/metrics.js.
 */

let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function makeCounter(name, help, labelNames = []) {
  if (!client) return { inc: () => {} };
  const existing = client.register.getSingleMetric(name);
  return existing || new client.Counter({ name, help, labelNames });
}
function makeGauge(name, help, labelNames = []) {
  if (!client) return { inc: () => {}, dec: () => {}, set: () => {} };
  const existing = client.register.getSingleMetric(name);
  return existing || new client.Gauge({ name, help, labelNames });
}
function makeHistogram(name, help, labelNames = []) {
  if (!client) return { observe: () => {} };
  const existing = client.register.getSingleMetric(name);
  return existing || new client.Histogram({ name, help, labelNames, buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000] });
}

const authSuccess = makeCounter('auth_success_total', 'Successful authentications', ['type']);
const authFailure = makeCounter('auth_failure_total', 'Failed authentications', ['type', 'reason']);
const apiKeyUsage = makeCounter('api_key_usage_total', 'API key authenticated requests', ['environment']);
const rateLimitHits = makeCounter('rate_limit_hits_total', 'Rate limit rejections', ['scope']);
const activeProxySessions = makeGauge('active_proxy_sessions', 'Currently active proxy sessions');
const authLatency = makeHistogram('auth_latency_ms', 'Auth middleware latency (ms)', ['type']);

module.exports = {
  enabled: Boolean(client),
  incAuthSuccess: (type) => authSuccess.inc({ type }),
  incAuthFailure: (type, reason) => authFailure.inc({ type, reason: reason || 'unknown' }),
  incApiKeyUsage: (environment) => apiKeyUsage.inc({ environment: environment || 'live' }),
  incRateLimitHit: (scope) => rateLimitHits.inc({ scope }),
  setActiveProxySessions: (n) => activeProxySessions.set(n),
  incActiveProxySessions: () => activeProxySessions.inc(),
  decActiveProxySessions: () => activeProxySessions.dec(),
  observeAuthLatency: (type, ms) => authLatency.observe({ type }, ms),
  async metricsText() {
    if (!client) return '# prom-client not installed — metrics disabled\n';
    return client.register.metrics();
  },
  contentType: client ? client.register.contentType : 'text/plain',
};
