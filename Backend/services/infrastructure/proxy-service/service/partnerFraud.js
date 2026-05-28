'use strict';

/**
 * Partner / affiliate / reseller fraud detection. Scores affiliate referral
 * abuse (fake referrals, click farming, self-dealing) and reseller fraud (quota
 * abuse, nested-billing manipulation, account farming). Pure scoring cores are
 * unit-tested; high scores drive payout holds + reseller sanctions.
 */

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Affiliate fraud score 0..100. Signals: low conversion quality, IP clustering,
 * fast churn of referred accounts, self-referral patterns.
 * @param {object} s { clicks, conversions, distinctIps, churnedWithin7dPct, selfReferralHits, payoutVelocity }
 */
function affiliateFraudScore(s = {}) {
  const reasons = [];
  let score = 0;
  const clicks = Number(s.clicks) || 0;
  const conversions = Number(s.conversions) || 0;
  const convRate = clicks > 0 ? conversions / clicks : 0;

  // Abnormally HIGH conversion with concentrated IPs → fake referrals.
  if (clicks >= 20 && convRate > 0.5 && (Number(s.distinctIps) || 0) < clicks * 0.3) { score += 35; reasons.push('ip_clustering'); }
  if ((Number(s.churnedWithin7dPct) || 0) > 0.7 && conversions >= 5) { score += 30; reasons.push('rapid_churn'); }
  if ((Number(s.selfReferralHits) || 0) > 0) { score += 25; reasons.push('self_referral'); }
  if ((Number(s.payoutVelocity) || 0) >= 5) { score += 15; reasons.push('payout_velocity'); }

  score = clamp(score, 0, 100);
  return { score, fraudulent: score >= 50, reasons };
}

/**
 * Reseller fraud score 0..100. Signals: quota over-allocation, nested billing
 * loops (reseller is its own customer), churn farming, KYB gaps.
 * @param {object} s { quotaAllocatedRatio, selfCustomer, customerChurn30dPct, customers, kybApproved, marginVsParentExcess }
 */
function resellerFraudScore(s = {}) {
  const reasons = [];
  let score = 0;
  if ((Number(s.quotaAllocatedRatio) || 0) > 1.0) { score += 30; reasons.push('quota_overallocation'); }
  if (s.selfCustomer) { score += 30; reasons.push('nested_billing_self_customer'); }
  if ((Number(s.customerChurn30dPct) || 0) > 0.6 && (Number(s.customers) || 0) >= 10) { score += 20; reasons.push('customer_churn_farming'); }
  if (s.kybApproved === false) { score += 20; reasons.push('kyb_incomplete'); }
  if ((Number(s.marginVsParentExcess) || 0) > 0) { score += 15; reasons.push('margin_exceeds_parent'); }

  score = clamp(score, 0, 100);
  return { score, fraudulent: score >= 50, reasons };
}

module.exports = { affiliateFraudScore, resellerFraudScore };
