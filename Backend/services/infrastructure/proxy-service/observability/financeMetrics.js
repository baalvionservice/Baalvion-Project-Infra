'use strict';

// Financial-operations Prometheus metrics. prom-client optional (no-op if absent)
// so the app boots without the dependency. Distinct metric names from
// meteringMetrics to avoid double-registration on the default registry.
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
  return client.register.getSingleMetric(name) || new client.Histogram({ name, help, labelNames: labels, buckets: buckets || [10, 50, 100, 250, 500, 1000, 2500, 5000] });
}

const revenuePerRegion = gauge('revenue_per_region', 'Revenue attributed per region (USD)', ['region']);
const providerMargin = gauge('finance_provider_margin_ratio', 'Provider gross-margin ratio', ['provider']);
const infraCostPerGb = gauge('infra_cost_per_gb', 'Blended infrastructure cost per GB (USD)', []);
const reconFailures = counter('billing_reconciliation_failures_total', 'Reconciliation runs with discrepancies', ['kind']);
const invoiceLatency = hist('invoice_generation_latency_ms', 'Invoice generation latency (ms)', []);
const taxErrors = counter('tax_calculation_errors_total', 'Tax computation errors', []);
const negativeMargin = gauge('negative_margin_accounts', 'Accounts at negative net margin', []);
const providerOverbilling = counter('provider_overbilling_usd_total', 'Detected provider overbilling (USD)', ['provider']);
const grossMargin = gauge('finance_gross_margin_ratio', 'Platform gross-margin ratio', []);
const netMargin = gauge('finance_net_margin_ratio', 'Platform net-margin ratio', []);
const mrr = gauge('finance_mrr_usd', 'Monthly recurring revenue (USD)', []);
const refundRate = gauge('finance_refund_rate', 'Refund $ / revenue $', []);

module.exports = {
  enabled: Boolean(client),
  setRevenuePerRegion: (region, v) => revenuePerRegion.set({ region }, Number(v)),
  setProviderMargin: (provider, v) => providerMargin.set({ provider }, Number(v)),
  setInfraCostPerGb: (v) => infraCostPerGb.set(Number(v)),
  incReconciliationFailure: (kind) => reconFailures.inc({ kind }),
  observeInvoiceLatency: (ms) => invoiceLatency.observe(Number(ms)),
  incTaxError: () => taxErrors.inc(),
  setNegativeMarginAccounts: (n) => negativeMargin.set(Number(n)),
  incProviderOverbilling: (provider, amount) => providerOverbilling.inc({ provider }, Number(amount)),
  setGrossMargin: (v) => grossMargin.set(Number(v)),
  setNetMargin: (v) => netMargin.set(Number(v)),
  setMrr: (v) => mrr.set(Number(v)),
  setRefundRate: (v) => refundRate.set(Number(v)),
};
