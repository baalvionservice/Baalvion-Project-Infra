'use strict';

/**
 * Partner billing engine — wholesale pricing, channel margins, commissions and
 * hierarchical (multi-level) revenue sharing. All computation is PURE and
 * unit-tested; the async layer accrues commissions to the `commissions` table.
 *
 * Revenue-share model = multi-level override (AWS/Shopify-partner style): each
 * level in the reseller chain earns an override % of the END-CUSTOMER price;
 * the platform keeps the remainder. Sum of channel margins is clamped to ≤ 100%.
 */

const db = require('../models');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Wholesale price = list × (1 − discount). */
function wholesalePrice(listPrice, discountPct) {
  return round2(Number(listPrice) * (1 - clamp(Number(discountPct) || 0, 0, 1)));
}

/** Channel margin a reseller earns reselling at list while buying at wholesale. */
function computeChannelMargin({ listPrice, wholesalePrice: wp }) {
  const margin = round2(Number(listPrice) - Number(wp));
  const ratio = listPrice > 0 ? round2(margin / Number(listPrice)) : 0;
  return { margin, ratio };
}

/**
 * Commission for a single accrual.
 * @param {object} i { revenue, basis: 'recurring'|'usage'|'signup', recurringPct, usagePct, signupBonus }
 */
function computeCommission(i) {
  const rev = Math.max(0, Number(i.revenue) || 0);
  if (i.basis === 'signup') return round2(Number(i.signupBonus) || 0);
  if (i.basis === 'usage') return round2(rev * clamp(Number(i.usagePct) || 0, 0, 1));
  // recurring (default)
  return round2(rev * clamp(Number(i.recurringPct) || 0, 0, 1));
}

/**
 * Hierarchical revenue split. `chain` is ordered customer→up (the selling
 * reseller first, then its parents). Each entry { partyId, marginPct }. Returns
 * the per-level amount + the platform's residual share.
 */
function splitRevenueHierarchy({ customerRevenue, chain = [] }) {
  const revenue = Math.max(0, Number(customerRevenue) || 0);
  let allocated = 0;
  const splits = [];
  for (const level of chain) {
    const pct = clamp(Number(level.marginPct) || 0, 0, 1);
    // Never let cumulative channel margin exceed 100% of the sale.
    const avail = clamp(1 - allocated, 0, 1);
    const effectivePct = Math.min(pct, avail);
    const amount = round2(revenue * effectivePct);
    splits.push({ partyId: level.partyId, tier: level.tier, pct: effectivePct, amount });
    allocated = round2(allocated + effectivePct);
  }
  const platformShare = round2(revenue * clamp(1 - allocated, 0, 1));
  return { revenue: round2(revenue), splits, channelTotal: round2(revenue - platformShare), platformShare };
}

/** Partner profitability for the platform's view of a channel account. */
function partnerProfitability({ channelRevenue = 0, providerCost = 0, infraCost = 0, commissionsPaid = 0 }) {
  const netToplatform = round2(Number(channelRevenue) - Number(commissionsPaid));
  const grossMargin = round2(netToplatform - Number(providerCost) - Number(infraCost));
  const ratio = channelRevenue > 0 ? round2(grossMargin / Number(channelRevenue)) : 0;
  return { channelRevenue: round2(channelRevenue), commissionsPaid: round2(commissionsPaid), grossMargin, marginRatio: ratio };
}

// ── async accrual ─────────────────────────────────────────────────────────────
async function accrueCommission({ partyType, partyId, sourceInvoiceId = null, sourceOrgId = null, basis, amount, period, currency = 'USD' }) {
  if (amount <= 0) return { accrued: 0 };
  await db.sequelize.query(
    `INSERT INTO commissions (party_type, party_id, source_invoice_id, source_org_id, basis, amount, currency, period, status)
     VALUES (:pt, :pid, :inv, :org, :basis, :amt, :cur, :period, 'accrued')`,
    { replacements: { pt: partyType, pid: partyId, inv: sourceInvoiceId, org: sourceOrgId, basis, amt: amount, cur: currency, period }, type: Q.INSERT },
  ).catch((e) => logger.error('[partnerBilling] accrue:', e.message));
  return { accrued: amount };
}

/** Accrue commissions across a customer's reseller chain for an invoice. */
async function accrueForInvoice({ invoiceId, customerOrgId, revenue, chain, period }) {
  const split = splitRevenueHierarchy({ customerRevenue: revenue, chain });
  for (const s of split.splits) {
    if (s.amount > 0) {
      await accrueCommission({ partyType: 'reseller', partyId: s.partyId, sourceInvoiceId: invoiceId, sourceOrgId: customerOrgId, basis: 'recurring', amount: s.amount, period });
    }
  }
  return split;
}

module.exports = {
  wholesalePrice, computeChannelMargin, computeCommission, splitRevenueHierarchy,
  partnerProfitability, accrueCommission, accrueForInvoice,
};
