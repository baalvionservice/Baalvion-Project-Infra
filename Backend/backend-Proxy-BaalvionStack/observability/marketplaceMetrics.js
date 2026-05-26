'use strict';

// Marketplace / channel Prometheus metrics. prom-client optional (no-op if absent).
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

const resellerRevenue = gauge('reseller_revenue_usd', 'Revenue per reseller (USD)', ['reseller']);
const affiliatePayouts = counter('affiliate_payouts_usd_total', 'Affiliate payouts processed (USD)', []);
const partnerMargin = gauge('partner_margin_ratio', 'Partner gross-margin ratio', ['party']);
const channelGrowth = gauge('channel_growth_resellers', 'Active resellers', []);
const resellerQuotaUsage = gauge('reseller_quota_usage_ratio', 'Reseller allocated/quota ratio', ['reseller']);
const conversionRate = gauge('marketplace_conversion_rate', 'Referral conversion rate', []);
const payoutHolds = counter('payout_holds_total', 'Payouts placed on hold', ['reason']);
const commissionAccrued = counter('commission_accrued_usd_total', 'Commission accrued (USD)', ['party_type']);

module.exports = {
  enabled: Boolean(client),
  setResellerRevenue: (reseller, v) => resellerRevenue.set({ reseller }, Number(v)),
  incAffiliatePayout: (amount) => affiliatePayouts.inc(Number(amount)),
  setPartnerMargin: (party, v) => partnerMargin.set({ party }, Number(v)),
  setChannelGrowth: (n) => channelGrowth.set(Number(n)),
  setResellerQuotaUsage: (reseller, v) => resellerQuotaUsage.set({ reseller }, Number(v)),
  setConversionRate: (v) => conversionRate.set(Number(v)),
  incPayoutHold: (reason) => payoutHolds.inc({ reason }),
  incCommissionAccrued: (partyType, amount) => commissionAccrued.inc({ party_type: partyType }, Number(amount)),
};
