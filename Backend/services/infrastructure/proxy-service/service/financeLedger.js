'use strict';

/**
 * Prepaid/postpaid accounting ledger. Balance is SUM(credit_ledger.amount):
 * credits are positive; consumption / refunds / expirations are negative. Every
 * mutation is a NEW append-only row (no edits) — audit-safe by construction.
 * Supports FIFO credit expiration, auto-recharge, refunds and manual adjustments.
 * Pure core (balance, FIFO consume, expiry, recharge decision) is unit-tested.
 */

const db = require('../models');
const billingAudit = (() => { try { return require('./complianceAudit'); } catch { return null; } })();
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

// ── pure ────────────────────────────────────────────────────────────────────
function computeBalance(entries) {
  return round2(entries.reduce((s, e) => s + Number(e.amount || 0), 0));
}

/** Auto-recharge decision: recharge when balance dips below the threshold. */
function autoRechargeDecision(balance, config) {
  if (!config || !config.enabled) return { shouldRecharge: false, amount: 0 };
  if (balance >= Number(config.threshold)) return { shouldRecharge: false, amount: 0 };
  return { shouldRecharge: true, amount: round2(Number(config.rechargeAmount || 0)) };
}

/**
 * FIFO-consume `amount` across positive credit lots (oldest first). Returns the
 * per-lot consumption + any uncovered remainder (which becomes postpaid/overage).
 */
function fifoConsume(lots, amount) {
  let remaining = Number(amount) || 0;
  const consumed = [];
  for (const lot of [...lots].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
    if (remaining <= 0) break;
    const avail = Number(lot.remaining ?? lot.amount) || 0;
    if (avail <= 0) continue;
    const take = Math.min(avail, remaining);
    consumed.push({ id: lot.id, amount: round2(take) });
    remaining = round2(remaining - take);
  }
  return { consumed, uncovered: round2(Math.max(0, remaining)) };
}

/** Which credit lots are expired as of `now` (FIFO expiration of unused balance). */
function expirationCandidates(lots, now = new Date()) {
  return lots.filter((l) => l.expiresAt && !l.expired && new Date(l.expiresAt) <= now && Number(l.amount) > 0);
}

// ── async DB ops ────────────────────────────────────────────────────────────
async function getBalance(orgId) {
  const [row] = await db.sequelize.query(
    `SELECT COALESCE(SUM(amount),0) AS bal FROM credit_ledger WHERE org_id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  return round2(Number(row.bal || 0));
}

async function entry(orgId, { amount, entryType, reason, refInvoiceId = null, expiresAt = null, currency = 'USD' }) {
  await db.sequelize.query(
    `INSERT INTO credit_ledger (org_id, amount, reason, ref_invoice_id, entry_type, currency, expires_at)
     VALUES (:org, :amt, :reason, :ref, :type, :cur, :exp)`,
    { replacements: { org: orgId, amt: amount, reason, ref: refInvoiceId, type: entryType, cur: currency, exp: expiresAt }, type: Q.INSERT },
  );
  if (billingAudit) await billingAudit.log({ domain: 'billing', action: `ledger:${entryType}`, orgId, payload: { amount, reason } }).catch(() => {});
  return { orgId, amount, entryType };
}

const addCredit = (orgId, amount, opts = {}) => entry(orgId, { amount: Math.abs(amount), entryType: 'credit', reason: opts.reason || 'credit_purchase', expiresAt: opts.expiresAt || null, currency: opts.currency });
const consume = (orgId, amount, reason = 'usage') => entry(orgId, { amount: -Math.abs(amount), entryType: 'consumption', reason });
const adjust = (orgId, amount, reason, actor) => entry(orgId, { amount, entryType: 'adjustment', reason: `${reason}${actor ? ` by ${actor}` : ''}` });

/** Expire unused credit lots whose expiry has passed (writes offsetting entries). */
async function expireCredits() {
  const lots = await db.sequelize.query(
    `SELECT id, org_id, amount FROM credit_ledger
     WHERE entry_type = 'credit' AND expires_at IS NOT NULL AND NOT expired AND expires_at <= now() AND amount > 0`,
    { type: Q.SELECT },
  ).catch(() => []);
  let expired = 0;
  for (const lot of lots) {
    await db.sequelize.transaction(async (tx) => {
      await db.sequelize.query(`UPDATE credit_ledger SET expired = true WHERE id = :id`, { replacements: { id: lot.id }, type: Q.UPDATE, transaction: tx });
      await db.sequelize.query(
        `INSERT INTO credit_ledger (org_id, amount, reason, entry_type) VALUES (:org, :amt, 'credit_expired', 'expiration')`,
        { replacements: { org: lot.org_id, amt: -Number(lot.amount) }, type: Q.INSERT, transaction: tx },
      );
    }).then(() => expired++).catch((e) => logger.error('[ledger] expire:', e.message));
  }
  return { expired };
}

/** Run auto-recharge for orgs below threshold (returns recharge intents). */
async function runAutoRecharge() {
  const cfgs = await db.sequelize.query(
    `SELECT org_id, threshold, recharge_amount, currency FROM auto_recharge_configs WHERE enabled = true`,
    { type: Q.SELECT },
  ).catch(() => []);
  const intents = [];
  for (const c of cfgs) {
    const balance = await getBalance(c.org_id);
    const decision = autoRechargeDecision(balance, { enabled: true, threshold: Number(c.threshold), rechargeAmount: Number(c.recharge_amount) });
    if (decision.shouldRecharge) intents.push({ orgId: c.org_id, amount: decision.amount, currency: c.currency, balance });
  }
  return intents; // the payment is charged by the billing collector, then addCredit on success
}

module.exports = {
  computeBalance, autoRechargeDecision, fifoConsume, expirationCandidates,
  getBalance, addCredit, consume, adjust, expireCredits, runAutoRecharge, entry,
};
