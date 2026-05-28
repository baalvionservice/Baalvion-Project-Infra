'use strict';

// Trust & Safety Prometheus metrics. prom-client optional (no-op if absent).
let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function counter(name, help, labels = []) {
  if (!client) return { inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Counter({ name, help, labelNames: labels });
}
function gauge(name, help, labels = []) {
  if (!client) return { inc: () => {}, set: () => {} };
  return client.register.getSingleMetric(name) || new client.Gauge({ name, help, labelNames: labels });
}
function hist(name, help, labels = []) {
  if (!client) return { observe: () => {} };
  return client.register.getSingleMetric(name) || new client.Histogram({ name, help, labelNames: labels, buckets: [10, 30, 55, 80, 100] });
}

const abuseEvents = counter('abuse_events_total', 'Abuse events by type', ['type']);
const blockedConns = counter('blocked_connections_total', 'Connections blocked by enforcement/threat-intel', ['reason']);
const kycFailures = counter('kyc_failures_total', 'KYC verifications rejected', []);
const enforcementActions = counter('enforcement_actions_total', 'Enforcement actions applied', ['action']);
const fraudScores = hist('fraud_scores', 'Distribution of computed fraud/risk scores', ['kind']);
const modQueue = gauge('moderation_queue_size', 'Open moderation cases', []);

module.exports = {
  enabled: Boolean(client),
  incAbuse: (type) => abuseEvents.inc({ type }),
  incBlocked: (reason) => blockedConns.inc({ reason }),
  incKycFailure: () => kycFailures.inc(),
  incEnforcement: (action) => enforcementActions.inc({ action }),
  observeFraud: (kind, score) => fraudScores.observe({ kind }, score),
  setModQueue: (n) => modQueue.set(n),
};
