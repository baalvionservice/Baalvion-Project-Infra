'use strict';

// Global edge-network Prometheus metrics. prom-client optional (no-op if absent)
// so the app boots without the dependency installed.
let client = null;
try { client = require('prom-client'); } catch (_) { client = null; }

function counter(name, help, labels = []) {
  if (!client) return { inc: () => {} };
  return client.register.getSingleMetric(name) || new client.Counter({ name, help, labelNames: labels });
}
function gauge(name, help, labels = []) {
  if (!client) return { inc: () => {}, set: () => {}, dec: () => {} };
  return client.register.getSingleMetric(name) || new client.Gauge({ name, help, labelNames: labels });
}

const regionRequests = counter('edge_region_requests_total', 'Requests routed by edge region', ['region']);
const regionLatency = gauge('edge_region_latency_ms', 'Last reported region latency (ms)', ['region']);
const regionSaturation = gauge('edge_region_saturation', 'Region saturation 0–1', ['region']);
const regionStatus = gauge('edge_region_up', 'Region up=1/degraded=0.5/offline=0', ['region']);
const dedicatedIps = gauge('dedicated_ips_total', 'Owned IPs by status', ['status']);
const ipAllocations = counter('ip_allocations_total', 'Dedicated IP allocation events', ['op']);
const asnReputation = gauge('asn_reputation', 'Reputation by ASN (0–100)', ['asn']);
const asnBanned = gauge('asn_banned_total', 'Count of ASNs below ban threshold', []);

const STATUS_VAL = { healthy: 1, degraded: 0.5, offline: 0 };

module.exports = {
  enabled: Boolean(client),
  incRegionRequest: (region) => regionRequests.inc({ region }),
  setRegionHealth: (region, m = {}) => {
    if (m.latencyMs != null) regionLatency.set({ region }, Number(m.latencyMs));
    if (m.saturation != null) regionSaturation.set({ region }, Number(m.saturation));
    if (m.status != null) regionStatus.set({ region }, STATUS_VAL[m.status] != null ? STATUS_VAL[m.status] : 1);
  },
  setDedicatedIps: (status, n) => dedicatedIps.set({ status }, Number(n)),
  incIpAllocation: (op) => ipAllocations.inc({ op }),
  setAsnReputation: (asn, rep) => asnReputation.set({ asn: String(asn) }, Number(rep)),
  setAsnBanned: (n) => asnBanned.set(Number(n)),
};
