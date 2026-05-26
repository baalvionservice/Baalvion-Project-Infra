'use strict';

/**
 * Affiliate / referral system. Tracks clicks, attributes conversions within an
 * attribution window (last- or first-touch), computes one-time + recurring
 * commissions, and validates referrals against self-referral / duplicate fraud.
 * Attribution + commission + validation cores are PURE and unit-tested.
 */

const db = require('../models');
const partnerBilling = require('./partnerBilling');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// ── pure ────────────────────────────────────────────────────────────────────

/**
 * Pick the winning referral touch for a conversion.
 * @param {Array} touches [{ id, affiliateId, landedAt }]
 * @param {Date|string} conversionTime
 * @param {number} windowDays
 * @param {'last_touch'|'first_touch'} model
 */
function attributeReferral(touches, conversionTime, windowDays = 30, model = 'last_touch') {
  const conv = new Date(conversionTime).getTime();
  const windowMs = windowDays * 86400000;
  const eligible = touches
    .map((t) => ({ ...t, ts: new Date(t.landedAt).getTime() }))
    .filter((t) => t.ts <= conv && conv - t.ts <= windowMs);
  if (!eligible.length) return null;
  eligible.sort((a, b) => a.ts - b.ts);
  return model === 'first_touch' ? eligible[0] : eligible[eligible.length - 1];
}

/**
 * Affiliate commission for a payment.
 * First payment earns the one-time conversion % (commissionPct) PLUS the recurring
 * %; subsequent payments earn only the recurring %.
 */
function computeAffiliateCommission({ revenue, commissionPct = 0, recurringPct = 0, isFirstPayment = false }) {
  const rev = Math.max(0, Number(revenue) || 0);
  const oneTime = isFirstPayment ? partnerBilling.computeCommission({ revenue: rev, basis: 'usage', usagePct: commissionPct }) : 0;
  const recurring = partnerBilling.computeCommission({ revenue: rev, basis: 'recurring', recurringPct });
  return Math.round((oneTime + recurring + Number.EPSILON) * 100) / 100;
}

/** Reject self-referral and obvious duplicate fraud. */
function validateReferral({ affiliateOrgId, referredOrgId, affiliateIpHash, referredIpHash, alreadyConverted = false }) {
  if (alreadyConverted) return { valid: false, reason: 'already_converted' };
  if (affiliateOrgId && referredOrgId && affiliateOrgId === referredOrgId) return { valid: false, reason: 'self_referral' };
  if (affiliateIpHash && referredIpHash && affiliateIpHash === referredIpHash) return { valid: false, reason: 'same_ip_self_referral' };
  return { valid: true, reason: null };
}

// ── async ─────────────────────────────────────────────────────────────────────

async function trackClick({ code, visitorId, ipHash }) {
  const [aff] = await db.sequelize.query(`SELECT id FROM affiliates WHERE code = :code AND status = 'active'`, { replacements: { code }, type: Q.SELECT });
  if (!aff) return { tracked: false, reason: 'unknown_code' };
  await db.sequelize.query(
    `INSERT INTO referrals (affiliate_id, code, visitor_id, ip_hash) VALUES (:aff, :code, :v, :ip)`,
    { replacements: { aff: aff.id, code, v: visitorId || null, ip: ipHash || null }, type: Q.INSERT },
  ).catch((e) => logger.error('[affiliate] click:', e.message));
  return { tracked: true, affiliateId: aff.id };
}

/** Convert: attribute the org's signup to a referral touch within the window. */
async function convertReferral({ referredOrgId, visitorId, referredIpHash }) {
  const touches = await db.sequelize.query(
    `SELECT r.id, r.affiliate_id AS "affiliateId", r.landed_at AS "landedAt", a.attribution_window_days AS "window", a.org_id AS "affiliateOrgId", a.ip_hash AS afip
     FROM referrals r JOIN affiliates a ON a.id = r.affiliate_id
     WHERE r.status = 'pending' AND (r.visitor_id = :v OR r.referred_org_id = :org)`,
    { replacements: { v: visitorId || '', org: referredOrgId }, type: Q.SELECT },
  ).catch(() => []);
  if (!touches.length) return { converted: false };

  const windowDays = Number(touches[0].window || 30);
  const winner = attributeReferral(touches, new Date(), windowDays, 'last_touch');
  if (!winner) return { converted: false, reason: 'outside_window' };

  const check = validateReferral({ affiliateOrgId: touches.find((t) => t.id === winner.id)?.affiliateOrgId, referredOrgId, referredIpHash, affiliateIpHash: null });
  const status = check.valid ? 'converted' : 'rejected';
  await db.sequelize.query(
    `UPDATE referrals SET status = :st, referred_org_id = :org, converted_at = now(), reject_reason = :rr WHERE id = :id`,
    { replacements: { id: winner.id, st: status, org: referredOrgId, rr: check.reason }, type: Q.UPDATE },
  ).catch(() => {});
  return { converted: check.valid, affiliateId: winner.affiliateId, referralId: winner.id, reason: check.reason };
}

/** Accrue an affiliate commission for an invoice (called by the billing flow). */
async function accrueAffiliateCommission({ referredOrgId, invoiceId, revenue, isFirstPayment, period }) {
  const [ref] = await db.sequelize.query(
    `SELECT r.affiliate_id, a.commission_pct, a.recurring_pct FROM referrals r JOIN affiliates a ON a.id = r.affiliate_id
     WHERE r.referred_org_id = :org AND r.status = 'converted' ORDER BY r.converted_at DESC LIMIT 1`,
    { replacements: { org: referredOrgId }, type: Q.SELECT },
  ).catch(() => [null]);
  if (!ref) return { accrued: 0 };
  const amount = computeAffiliateCommission({ revenue, commissionPct: Number(ref.commission_pct), recurringPct: Number(ref.recurring_pct), isFirstPayment });
  await partnerBilling.accrueCommission({ partyType: 'affiliate', partyId: ref.affiliate_id, sourceInvoiceId: invoiceId, sourceOrgId: referredOrgId, basis: isFirstPayment ? 'signup' : 'recurring', amount, period });
  return { accrued: amount, affiliateId: ref.affiliate_id };
}

module.exports = { attributeReferral, computeAffiliateCommission, validateReferral, trackClick, convertReferral, accrueAffiliateCommission };
