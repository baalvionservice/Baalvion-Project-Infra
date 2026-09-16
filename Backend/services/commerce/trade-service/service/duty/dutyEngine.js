'use strict';
/**
 * Duty settlement — DB-backed ORCHESTRATOR (Compression, Phase 5).
 *
 * The pure ledger (ledger.js) decides whether a movement is legal; this file
 * makes it durable and safe under concurrency. Two properties carry the weight:
 *
 *   ATOMICITY. Every mutation runs inside a transaction that takes a ROW LOCK on
 *   the account first. Without it, two assessments landing together both read a
 *   balance of 10,000, both reserve 8,000, and the account is over-committed by
 *   6,000 — which surfaces days later as a payment refused at the authority.
 *
 *   IDEMPOTENCY. Every mutation takes an idempotency key, enforced by a unique
 *   index. The customs gateway retries; a duplicated settle is real money leaving
 *   a real account. A repeat call returns the ORIGINAL entry rather than
 *   applying a second one.
 *
 * Amounts are integers in the account's minor unit throughout. Nothing in this
 * file may introduce a float.
 */

const db = require('../../models');
const core = require('./ledger');
const fx = require('./fx');
const clearanceLedger = require('../clearance/ledger');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/** BIGINT comes back from pg as a string; every DB read must go through this. */
const big = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
};

/**
 * Strict coercion for CALLER-supplied amounts. big() tolerates junk because it
 * reads trusted DB columns; an inbound amount must not be tolerated — coercing a
 * NaN to zero would post a silent zero-value movement and report success.
 */
function amountInt(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new AppError('NON_INTEGER_AMOUNT',
            'Amount must be an integer in the account minor unit (e.g. 150000 for 1500.00 USD)', 422, { value: v });
    }
    return n;
}

function accountState(row) {
    return core.stateOf({
        balance_minor: big(row.balance_minor),
        reserved_minor: big(row.reserved_minor),
        credit_limit_minor: big(row.credit_limit_minor),
        currency: row.currency,
    });
}

/** Translate a pure LedgerError into the HTTP-shaped error the API returns. */
function asAppError(err) {
    if (err instanceof core.LedgerError) {
        const status = err.code === 'INSUFFICIENT_FUNDS' ? 409 : 422;
        return new AppError(err.code, err.message, status, err.details);
    }
    return err;
}

async function openAccount({
    tenantId = null, orgId = null, label = null, currency = 'USD',
    accountType = core.ACCOUNT_TYPE.PREFUNDED, creditLimitMinor = 0, guaranteeReference = null,
    provider = null, actor = null,
} = {}) {
    if (accountType !== core.ACCOUNT_TYPE.PREFUNDED && !guaranteeReference) {
        // A deferment account or bond draw without a guarantee reference is not a
        // funding arrangement, it is an unsecured credit line we cannot honour.
        throw new AppError('GUARANTEE_REQUIRED',
            'A deferred account or broker bond needs a guarantee reference before it can carry a credit limit', 422);
    }
    const row = await db.DutyAccount.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        org_id: orgId,
        label,
        currency: String(currency).toUpperCase(),
        account_type: accountType,
        credit_limit_minor: big(creditLimitMinor),
        guarantee_reference: guaranteeReference,
        provider,
        created_by: actor,
    });
    return plain(row);
}

/**
 * Apply one ledger movement atomically.
 *
 * Everything else in this module is a thin wrapper over this function, so the
 * lock-then-validate-then-write ordering is written exactly once.
 */
async function post(accountId, {
    type, amountMinor, tenantId = null, idempotencyKey = null,
    consignmentId = null, submissionId = null, fxLockId = null,
    reference = null, description = null, actor = null,
} = {}) {
    return db.sequelize.transaction(async (t) => {
        // Idempotency first: a retry must never even attempt the movement.
        if (idempotencyKey) {
            const where = { account_id: accountId, idempotency_key: idempotencyKey };
            if (tenantId) where.tenant_id = tenantId;
            const existing = await db.DutyLedgerEntry.findOne({ where, transaction: t });
            if (existing) {
                const acct = await db.DutyAccount.findByPk(accountId, { transaction: t });
                return { entry: plain(existing), account: plain(acct), replayed: true };
            }
        }

        const where = { id: accountId };
        if (tenantId) where.tenant_id = tenantId;
        // Row lock: the read and the write must be one indivisible step, or two
        // concurrent assessments will each reserve against the same balance.
        const account = await db.DutyAccount.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
        if (!account) throw new AppError('NOT_FOUND', 'Duty account not found', 404);
        if (account.status !== 'active') {
            throw new AppError('ACCOUNT_NOT_ACTIVE', `Duty account is ${account.status}`, 409);
        }

        const amount = amountInt(amountMinor);
        let next;
        try {
            next = core.applyEntry(accountState(account), { type, amount_minor: amount });
        } catch (err) {
            throw asAppError(err);
        }

        await account.update({
            balance_minor: next.balance_minor,
            reserved_minor: next.reserved_minor,
        }, { transaction: t });

        const entry = await db.DutyLedgerEntry.create({
            tenant_id: account.tenant_id,
            account_id: account.id,
            entry_type: type,
            amount_minor: amount,
            currency: account.currency,
            balance_after_minor: next.balance_minor,
            reserved_after_minor: next.reserved_minor,
            consignment_id: consignmentId,
            submission_id: submissionId,
            fx_lock_id: fxLockId,
            reference,
            description,
            idempotency_key: idempotencyKey,
            created_by: actor,
        }, { transaction: t });

        return { entry: plain(entry), account: plain(account), replayed: false };
    });
}

const deposit = (accountId, amountMinor, opts = {}) => post(accountId, { ...opts, type: core.ENTRY.DEPOSIT, amountMinor });
const refund = (accountId, amountMinor, opts = {}) => post(accountId, { ...opts, type: core.ENTRY.REFUND, amountMinor });
const release = (accountId, amountMinor, opts = {}) => post(accountId, { ...opts, type: core.ENTRY.RELEASE, amountMinor });
const fee = (accountId, amountMinor, opts = {}) => post(accountId, { ...opts, type: core.ENTRY.FEE, amountMinor });
const adjust = (accountId, amountMinor, opts = {}) => post(accountId, { ...opts, type: core.ENTRY.ADJUSTMENT, amountMinor });

/**
 * Reserve against an assessment. Called the moment customs assesses, not at
 * payment — the gap between those two is where an unreserved account gets spent
 * by another consignment.
 */
async function reserve(accountId, amountMinor, opts = {}) {
    const result = await post(accountId, { ...opts, type: core.ENTRY.RESERVE, amountMinor });
    if (opts.consignmentId) {
        clearanceLedger.record({ subjectType: 'consignment', subjectId: opts.consignmentId }, 'duty_funding', 'close',
            { tenantId: opts.tenantId, actor: opts.actor });
    }
    return result;
}

/**
 * Settle: convert a reservation into an actual payment. This is the step that
 * replaces the bank transfer, and the one the compression clock cares about.
 */
async function settle(accountId, amountMinor, opts = {}) {
    const result = await post(accountId, { ...opts, type: core.ENTRY.SETTLE, amountMinor });
    if (opts.consignmentId) {
        clearanceLedger.record({ subjectType: 'consignment', subjectId: opts.consignmentId }, 'duty_payment', 'close',
            { tenantId: opts.tenantId, actor: opts.actor });
    }
    return result;
}

/** Can this account cover an assessment, and if not, by exactly how much is it short? */
async function checkSufficiency(accountId, amountMinor, { tenantId = null } = {}) {
    const where = { id: accountId };
    if (tenantId) where.tenant_id = tenantId;
    const account = await db.DutyAccount.findOne({ where });
    if (!account) throw new AppError('NOT_FOUND', 'Duty account not found', 404);
    return { account_id: account.id, ...core.sufficiency(accountState(account), amountMinor) };
}

// ── FX ───────────────────────────────────────────────────────────────────────

async function createFxLock({
    tenantId = null, consignmentId = null, baseCurrency, quoteCurrency, rate,
    ttlHours = 24, source = 'internal', actor = null, now = new Date(),
} = {}) {
    let lock;
    try {
        lock = fx.createLock({ base_currency: baseCurrency, quote_currency: quoteCurrency, rate, ttl_hours: ttlHours, source, now });
    } catch (err) {
        throw new AppError(err.code || 'INVALID_FX', err.message, 422, err.details || {});
    }
    const row = await db.FxLock.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        consignment_id: consignmentId,
        base_currency: lock.base_currency,
        quote_currency: lock.quote_currency,
        rate_scaled: lock.rate_scaled,
        rate_decimals: lock.rate_decimals,
        source,
        locked_at: lock.locked_at,
        expires_at: lock.expires_at,
        created_by: actor,
    });
    return { ...plain(row), rate: lock.rate };
}

/** Rehydrate a stored lock into the shape the pure converter expects. */
function lockShape(row) {
    return {
        base_currency: row.base_currency,
        quote_currency: row.quote_currency,
        // NUMERIC arrives as a string; keep it a string so BigInt parses it exactly.
        rate_scaled: String(row.rate_scaled),
        rate_decimals: row.rate_decimals,
        expires_at: new Date(row.expires_at).toISOString(),
        rate: Number(row.rate_scaled) / (10 ** row.rate_decimals),
    };
}

async function convert(fxLockId, amountMinor, { tenantId = null, direction = 'base_to_quote', now = new Date() } = {}) {
    const where = { id: fxLockId };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.FxLock.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'FX lock not found', 404);
    if (row.status === 'cancelled') throw new AppError('FX_LOCK_CANCELLED', 'This FX lock was cancelled', 409);

    try {
        const converted = fx.convertWithLock(amountMinor, lockShape(row), { now, direction });
        return {
            fx_lock_id: row.id,
            direction,
            from_currency: direction === 'base_to_quote' ? row.base_currency : row.quote_currency,
            to_currency: direction === 'base_to_quote' ? row.quote_currency : row.base_currency,
            amount_minor: big(amountMinor),
            converted_minor: converted,
            rate: lockShape(row).rate,
            expires_at: row.expires_at,
        };
    } catch (err) {
        if (err.code === 'FX_LOCK_EXPIRED') {
            // Mark it so a stale lock stops being offered, then refuse.
            await row.update({ status: 'expired' }).catch(() => null);
            throw new AppError(err.code, err.message, 409, err.details);
        }
        throw err;
    }
}

async function getAccount(accountId, { tenantId = null, entryLimit = 50 } = {}) {
    const where = { id: accountId };
    if (tenantId) where.tenant_id = tenantId;
    const account = await db.DutyAccount.findOne({ where });
    if (!account) throw new AppError('NOT_FOUND', 'Duty account not found', 404);

    const entries = (await db.DutyLedgerEntry.findAll({
        where: { account_id: account.id },
        order: [['created_at', 'DESC']],
        limit: Math.min(500, Number(entryLimit) || 50),
    })).map(plain);

    const state = accountState(account);
    return {
        account: plain(account),
        available_minor: core.availableOf(state),
        entries,
        runway: core.runway(state, entries.map((e) => ({ type: e.entry_type, amount_minor: big(e.amount_minor) }))),
    };
}

/**
 * Audit: replay the whole entry history and compare against the stored balance.
 *
 * A drift here means a movement bypassed post() — worth knowing about
 * immediately rather than at a year-end reconciliation.
 */
async function audit(accountId, { tenantId = null } = {}) {
    const where = { id: accountId };
    if (tenantId) where.tenant_id = tenantId;
    const account = await db.DutyAccount.findOne({ where });
    if (!account) throw new AppError('NOT_FOUND', 'Duty account not found', 404);

    const entries = (await db.DutyLedgerEntry.findAll({
        where: { account_id: account.id }, order: [['created_at', 'ASC']],
    })).map(plain);

    const replayed = core.replay(
        { balance_minor: 0, reserved_minor: 0, credit_limit_minor: big(account.credit_limit_minor), currency: account.currency },
        entries.map((e) => ({ type: e.entry_type, amount_minor: big(e.amount_minor) })),
    );
    const stored = accountState(account);

    return {
        account_id: account.id,
        entry_count: entries.length,
        stored: { balance_minor: stored.balance_minor, reserved_minor: stored.reserved_minor },
        replayed: { balance_minor: replayed.balance_minor, reserved_minor: replayed.reserved_minor },
        balanced: stored.balance_minor === replayed.balance_minor && stored.reserved_minor === replayed.reserved_minor,
        drift_minor: stored.balance_minor - replayed.balance_minor,
    };
}

module.exports = {
    openAccount, post, deposit, refund, reserve, release, settle, fee, adjust,
    checkSufficiency, createFxLock, convert, getAccount, audit,
};
