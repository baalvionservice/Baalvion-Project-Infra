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

// Append a credit top-up. `amount` is USD; idempotency is the caller's concern
// (in production this is keyed to a settled payment).
const addCredit = async (orgId, amount, reason = 'topup') => {
    const usd = Number(amount);
    if (!(usd >= MIN_TOPUP) || usd > MAX_TOPUP) {
        throw new AppError('VALIDATION', `Top-up must be between $${MIN_TOPUP} and $${MAX_TOPUP}`, 400);
    }
    await db.sequelize.query(
        `INSERT INTO credit_ledger (org_id, amount, reason, entry_type, currency, created_at)
         VALUES (:orgId, :amount, :reason, 'credit', 'USD', now())`,
        { replacements: { orgId, amount: usd, reason } }
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
