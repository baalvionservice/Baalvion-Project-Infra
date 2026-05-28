'use strict';

/**
 * Metering/billing Prometheus metrics. prom-client optional (no-op if absent).
 * Registers on the shared default registry exposed by observability/authMetrics.
 */

let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function counter(name, help, labels = []) {
  if (!client) return { inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Counter({ name, help, labelNames: labels });
}
function gauge(name, help, labels = []) {
  if (!client) return { inc: () => {}, dec: () => {}, set: () => {} };
  return client.register.getSingleMetric(name) || new client.Gauge({ name, help, labelNames: labels });
}

const ingest = counter('metering_ingest_total', 'Metering events ingested');
const ingestErrors = counter('metering_ingest_errors_total', 'Metering ingestion errors');
const dlq = counter('metering_dlq_total', 'Metering events sent to dead-letter queue');
const billingFailures = counter('billing_failures_total', 'Billing run failures', ['stage']);
const quotaDenials = counter('quota_denials_total', 'Quota-denied connections (gateway-reported)');
const providerMargin = gauge('provider_margin_ratio', 'Gross margin ratio by provider', ['provider']);
const activeUsageSessions = gauge('active_usage_sessions', 'Distinct active billable sessions');
const wsConnections = gauge('websocket_connections', 'Open realtime dashboard connections');

module.exports = {
  enabled: Boolean(client),
  incIngest: (n = 1) => ingest.inc(n),
  incIngestError: () => ingestErrors.inc(),
  incDLQ: (n = 1) => dlq.inc(n),
  incBillingFailure: (stage) => billingFailures.inc({ stage: stage || 'unknown' }),
  incQuotaDenial: () => quotaDenials.inc(),
  setProviderMargin: (provider, ratio) => providerMargin.set({ provider }, ratio),
  setActiveUsageSessions: (n) => activeUsageSessions.set(n),
  incWs: () => wsConnections.inc(),
  decWs: () => wsConnections.dec(),
};
