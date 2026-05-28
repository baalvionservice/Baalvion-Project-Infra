'use strict';

/**
 * Finance fraud + revenue protection. Scores refund requests and credit usage for
 * abuse (refund farming, credit cycling, account farming) and enforces an
 * approval workflow: small clean refunds auto-approve; risky/large ones require
 * manual approval; clear abuse is blocked. Pure scoring core is unit-tested.
 * Complements paymentFraud (Prompt 7, payment-time) — this is post-sale finance.
 */

const db = require('../models');
const financeMetrics = require('../observability/financeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const AUTO_APPROVE_LIMIT = Number(process.env.REFUND_AUTO_APPROVE_LIMIT || 50);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * PURE refund risk assessment → { score 0..100, decision, reasons }.
 * decision: approve (auto) | review (manual) | block.
 */
function assessRefund({ refundAmount = 0, invoiceAmount = 0, accountAgeDays = 0, priorRefunds = 0, refunds30d = 0, disputed = false }) {
  const reasons = [];
  let score = 0;

  const ratio = invoiceAmount > 0 ? refundAmount / invoiceAmount : 1;
  if (ratio > 1.0) { score += 40; reasons.push('refund_exceeds_invoice'); }
  else if (ratio > 0.9) { score += 15; reasons.push('near_full_refund'); }

  if (accountAgeDays < 14) { score += 20; reasons.push('young_account'); }
  if (priorRefunds >= 3) { score += 20; reasons.push('repeat_refunder'); }
  if (refunds30d >= 2) { score += 20; reasons.push('refund_velocity'); }
  if (disputed) { score += 15; reasons.push('payment_disputed'); }

  score = clamp(score, 0, 100);

  let decision;
  if (score >= 60 || ratio > 1.0) decision = 'block';
  else if (score >= 25 || refundAmount > AUTO_APPROVE_LIMIT) decision = 'review';
  else decision = 'approve';

  return { score, decision, reasons, autoApproveLimit: AUTO_APPROVE_LIMIT };
}

/** PURE credit-abuse score: credit granted but never converted to paid usage. */
function creditAbuseScore({ creditsGranted = 0, creditsConsumed = 0, paidRevenue = 0, relatedSignups = 0, sharedPaymentMethods = 0 }) {
  const reasons = [];
  let score = 0;
  const burn = creditsGranted > 0 ? creditsConsumed / creditsGranted : 0;
  if (creditsConsumed > 0 && paidRevenue === 0) { score += 35; reasons.push('credit_only_no_payment'); }
  if (relatedSignups >= 5) { score += 30; reasons.push('account_farming'); }
  if (sharedPaymentMethods >= 3) { score += 25; reasons.push('shared_payment_methods'); }
  if (burn > 0.95 && paidRevenue === 0) { score += 10; reasons.push('full_credit_burn'); }
  return { score: clamp(score, 0, 100), abusive: score >= 50, reasons };
}

// ── async: refund workflow ────────────────────────────────────────────────────
async function requestRefund({ orgId, invoiceId, amount, reason, requestedBy }) {
  const [inv] = invoiceId ? await db.sequelize.query(
    `SELECT total, issued_at, status FROM invoices WHERE id = :id AND org_id = :org`,
    { replacements: { id: invoiceId, org: orgId }, type: Q.SELECT },
  ).catch(() => [null]) : [null];

  const [counts] = await db.sequelize.query(
    `SELECT COUNT(*) AS prior, COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') AS recent
     FROM refunds WHERE org_id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  ).catch(() => [{ prior: 0, recent: 0 }]);

  const org = await db.organizations.findByPk(orgId).catch(() => null);
  const ageDays = org?.created_at ? Math.floor((Date.now() - new Date(org.created_at)) / 86400000) : 0;

  const risk = assessRefund({
    refundAmount: Number(amount), invoiceAmount: inv ? Number(inv.total) : 0,
    accountAgeDays: ageDays, priorRefunds: Number(counts.prior || 0), refunds30d: Number(counts.recent || 0),
  });

  const status = risk.decision === 'approve' ? 'approved' : risk.decision === 'block' ? 'rejected' : 'pending';
  const [row] = await db.sequelize.query(
    `INSERT INTO refunds (org_id, invoice_id, amount, reason, status, risk_score, requested_by)
     VALUES (:org, :inv, :amt, :reason, :status, :score, :by) RETURNING id`,
    { replacements: { org: orgId, inv: invoiceId || null, amt: amount, reason, status, score: risk.score, by: requestedBy || null }, type: Q.SELECT },
  );
  logger.info(`[refund] org=${orgId} amount=${amount} risk=${risk.score} → ${status}`);
  return { refundId: row.id, status, risk };
}

/** Approve or reject a pending refund; on approval, post the ledger entry. */
async function decideRefund({ refundId, decision, approvedBy }) {
  const status = decision === 'approve' ? 'approved' : 'rejected';
  const [row] = await db.sequelize.query(
    `UPDATE refunds SET status = :st, approved_by = :by WHERE id = :id AND status = 'pending' RETURNING org_id, amount`,
    { replacements: { id: refundId, st: status, by: approvedBy || null }, type: Q.SELECT },
  ).then((r) => r).catch(() => [null]);
  if (!row) return { ok: false, reason: 'not_pending' };
  if (status === 'approved') {
    const ledger = require('./financeLedger');
    await ledger.entry(row.org_id, { amount: -Math.abs(Number(row.amount)), entryType: 'refund', reason: `refund:${refundId}` }).catch(() => {});
  }
  return { ok: true, refundId, status };
}

module.exports = { assessRefund, creditAbuseScore, requestRefund, decideRefund, AUTO_APPROVE_LIMIT };
