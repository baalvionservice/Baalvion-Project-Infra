'use strict';
/**
 * Prepaid credit wallet for Pay-As-You-Go customers.
 *
 * Backed by the `credit_ledger` table (append-only): each top-up is a `credit`
 * entry, each metered usage charge is a `debit` entry. Balance = sum(credit) -
 * sum(debit) over non-expired rows. PAYG bandwidth is drawn down at $3/GB.
 */
const db = require('../models');
const { AppError } = require('../utils/errors');

const USD_PER_GB = 3;
// Sane bounds on a single top-up (USD).
const MIN_TOPUP = 5;
const MAX_TOPUP = 10000;

const getBalance = async (orgId) => {
    const [rows] = await db.sequelize.query(
        `SELECT COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END), 0) AS balance
         FROM credit_ledger WHERE org_id = :orgId AND expired = false`,
        { replacements: { orgId } }
    );
    const balance = Number(rows && rows[0] && rows[0].balance) || 0;
    return {
        balanceUsd: Math.round(balance * 100) / 100,
        gbRemaining: Math.floor((balance / USD_PER_GB) * 100) / 100,
        usdPerGb: USD_PER_GB,
    };
};

const listLedger = async (orgId, limit = 50) => {
    const [rows] = await db.sequelize.query(
        `SELECT id, amount, reason, entry_type, currency, created_at
         FROM credit_ledger WHERE org_id = :orgId ORDER BY created_at DESC LIMIT :limit`,
        { replacements: { orgId, limit } }
    );
    return rows || [];
};

// Append a credit top-up. `amount` is USD. When `opts.ref` (a settled gateway payment id) is given,
// the top-up is IDEMPOTENT: the ref is embedded in `reason` and a credit already carrying it is a
// no-op. This is how a payment becomes the authoritative trigger — the provider webhook and the
// client convenience call both pass the same payment id, so they net exactly ONE top-up.
// (Production hardening: a partial unique index on (org_id, reason) WHERE entry_type='credit' would
// also close the sub-millisecond race between two concurrent inserts.)
const addCredit = async (orgId, amount, reason = 'topup', opts = {}) => {
    const usd = Number(amount);
    if (!(usd >= MIN_TOPUP) || usd > MAX_TOPUP) {
        throw new AppError('VALIDATION', `Top-up must be between $${MIN_TOPUP} and $${MAX_TOPUP}`, 400);
    }
    const ledgerReason = opts.ref ? `${reason}:${opts.ref}` : reason;
    if (opts.ref) {
        const [dupe] = await db.sequelize.query(
            `SELECT 1 FROM credit_ledger WHERE org_id = :orgId AND entry_type = 'credit' AND reason = :ledgerReason LIMIT 1`,
            { replacements: { orgId, ledgerReason } }
        );
        if (dupe && dupe.length) return getBalance(orgId); // already credited for this payment
    }
    await db.sequelize.query(
        `INSERT INTO credit_ledger (org_id, amount, reason, entry_type, currency, created_at)
         VALUES (:orgId, :amount, :reason, 'credit', 'USD', now())`,
        { replacements: { orgId, amount: usd, reason: ledgerReason } }
    );
    return getBalance(orgId);
};

// Record metered usage as a debit (used by the bandwidth metering path).
const recordUsage = async (orgId, gb, reason = 'bandwidth-usage') => {
    const amount = Math.round(Number(gb) * USD_PER_GB * 100) / 100;
    if (!(amount > 0)) return getBalance(orgId);
    await db.sequelize.query(
        `INSERT INTO credit_ledger (org_id, amount, reason, entry_type, currency, created_at)
         VALUES (:orgId, :amount, :reason, 'debit', 'USD', now())`,
        { replacements: { orgId, amount, reason } }
    );
    return getBalance(orgId);
};

module.exports = { getBalance, listLedger, addCredit, recordUsage, USD_PER_GB, MIN_TOPUP, MAX_TOPUP };
