'use strict';
/**
 * Duty account ledger — PURE (Compression, Phase 5).
 *
 * Duty payment is a hidden 2–4 days in the baseline cycle, and almost none of it
 * is processing: it is "someone logs into a bank at 10am". A pre-funded duty
 * account turns that into a ledger debit, which is the difference between a day
 * and a tenth of an hour.
 *
 * THREE-PHASE MONEY. An assessment is not a payment. Funds are RESERVED when
 * customs assesses, SETTLED when the payment is actually made, and RELEASED if
 * the assessment is cancelled or amended down. Skipping the reservation step is
 * how an account with a healthy balance still fails at the moment of payment —
 * the money was already spoken for by three other consignments.
 *
 *   available = balance + credit_limit - reserved
 *
 * INTEGER MINOR UNITS ONLY. Every amount here is an integer in the account's
 * minor unit. A duty figure that disagrees with the assessment by one cent is a
 * rejected payment, so float arithmetic is not an option anywhere in this file.
 *
 * PURE: no DB, no clock beyond the injected `now`. dutyEngine.js persists.
 */

const LEDGER_VERSION = '1.0.0';

const ACCOUNT_TYPE = Object.freeze({
    PREFUNDED: 'prefunded_wallet',    // customer's own money, held by us
    DEFERRED: 'deferred_account',     // duty deferment under a guarantee
    BROKER_BOND: 'broker_bond',       // drawn against the broker's customs bond
});

const ENTRY = Object.freeze({
    DEPOSIT: 'deposit',
    RESERVE: 'reserve',
    RELEASE: 'release',
    SETTLE: 'settle',
    REFUND: 'refund',
    FEE: 'fee',
    ADJUSTMENT: 'adjustment',
});

const ALL_ENTRY_TYPES = Object.freeze(Object.values(ENTRY));

/** Errors carry a machine code so callers can branch without string-matching. */
class LedgerError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

const int = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new LedgerError('NON_INTEGER_AMOUNT', 'Ledger amounts must be integers in the account minor unit', { value: v });
    }
    return n;
};

/** Normalize an account row into the state the reducer operates on. */
function stateOf(account = {}) {
    // `?? 0`, never `|| 0`: NaN is falsy, so `||` would silently turn an invalid
    // balance into a zero one instead of rejecting it.
    return {
        balance_minor: int(account.balance_minor ?? 0),
        reserved_minor: int(account.reserved_minor ?? 0),
        credit_limit_minor: int(account.credit_limit_minor ?? 0),
        currency: account.currency || 'USD',
    };
}

const availableOf = (s) => s.balance_minor + s.credit_limit_minor - s.reserved_minor;

/**
 * Apply one entry to account state.
 *
 * Deliberately total and deliberately strict: every rejection is an explicit
 * LedgerError rather than a silently clamped number. A duty account that quietly
 * goes negative produces a payment that bounces at the authority, which is the
 * exact failure this phase exists to remove.
 */
function applyEntry(state, entry = {}) {
    const s = { ...state };
    const type = entry.type;
    if (!ALL_ENTRY_TYPES.includes(type)) {
        throw new LedgerError('UNKNOWN_ENTRY_TYPE', `Unknown duty ledger entry type: ${type}`, { known: ALL_ENTRY_TYPES });
    }

    // `?? 0` so a NaN amount reaches int() and is rejected, rather than being
    // coerced to a silent zero-value entry by `||`.
    const amount = int(entry.amount_minor ?? 0);
    if (amount < 0 && type !== ENTRY.ADJUSTMENT) {
        throw new LedgerError('NEGATIVE_AMOUNT', 'Only an adjustment may carry a negative amount', { type, amount });
    }

    switch (type) {
        case ENTRY.DEPOSIT:
        case ENTRY.REFUND:
            s.balance_minor += amount;
            break;

        case ENTRY.RESERVE: {
            // Reserving more than is available is the check that matters: it is
            // what stops four consignments from each believing they own the same
            // balance.
            if (amount > availableOf(s)) {
                throw new LedgerError('INSUFFICIENT_FUNDS',
                    'Duty account does not have enough available balance to reserve this assessment',
                    { requested: amount, available: availableOf(s), balance: s.balance_minor, reserved: s.reserved_minor, credit_limit: s.credit_limit_minor });
            }
            s.reserved_minor += amount;
            break;
        }

        case ENTRY.RELEASE: {
            if (amount > s.reserved_minor) {
                throw new LedgerError('RELEASE_EXCEEDS_RESERVED',
                    'Cannot release more than is currently reserved',
                    { requested: amount, reserved: s.reserved_minor });
            }
            s.reserved_minor -= amount;
            break;
        }

        case ENTRY.SETTLE: {
            // Settlement consumes a reservation AND the balance behind it. Both
            // must move together, or the account drifts.
            if (amount > s.reserved_minor) {
                throw new LedgerError('SETTLE_EXCEEDS_RESERVED',
                    'Cannot settle more than was reserved — re-reserve the amended assessment first',
                    { requested: amount, reserved: s.reserved_minor });
            }
            if (amount > s.balance_minor + s.credit_limit_minor) {
                throw new LedgerError('INSUFFICIENT_FUNDS',
                    'Duty account cannot cover this settlement',
                    { requested: amount, balance: s.balance_minor, credit_limit: s.credit_limit_minor });
            }
            s.reserved_minor -= amount;
            s.balance_minor -= amount;
            break;
        }

        case ENTRY.FEE: {
            if (amount > s.balance_minor + s.credit_limit_minor) {
                throw new LedgerError('INSUFFICIENT_FUNDS', 'Duty account cannot cover this fee',
                    { requested: amount, balance: s.balance_minor });
            }
            s.balance_minor -= amount;
            break;
        }

        case ENTRY.ADJUSTMENT:
            // The manual escape hatch: signed, and the only entry type allowed to
            // push an account negative, because a real correction sometimes must.
            s.balance_minor += amount;
            break;

        default:
            break;
    }

    return s;
}

/** Replay a whole entry list. Used to verify a persisted balance against its history. */
function replay(openingState, entries = []) {
    return entries.reduce((s, e) => applyEntry(s, e), stateOf(openingState));
}

/**
 * Can this account cover an assessment right now, and if not, by how much is it
 * short? The shortfall is the actionable number — "insufficient" alone just
 * sends someone to a spreadsheet.
 */
function sufficiency(account, amountMinor) {
    const s = stateOf(account);
    const amount = int(amountMinor ?? 0);
    const available = availableOf(s);
    return {
        sufficient: amount <= available,
        requested_minor: amount,
        available_minor: available,
        shortfall_minor: Math.max(0, amount - available),
        balance_minor: s.balance_minor,
        reserved_minor: s.reserved_minor,
        credit_limit_minor: s.credit_limit_minor,
        currency: s.currency,
    };
}

/**
 * Funding headroom against the account's own recent burn rate.
 *
 * The point is to top up BEFORE an assessment lands, because discovering a
 * shortfall at the moment of payment reintroduces exactly the bank-transfer day
 * this phase removed.
 */
function runway(account, settledEntries = [], { days = 30 } = {}) {
    const s = stateOf(account);
    const settled = settledEntries.filter((e) => e.type === ENTRY.SETTLE);
    const total = settled.reduce((a, e) => a + int(e.amount_minor ?? 0), 0);
    const perDay = days > 0 ? total / days : 0;
    const available = availableOf(s);
    return {
        available_minor: available,
        settled_minor: total,
        daily_burn_minor: Math.round(perDay),
        days_of_cover: perDay > 0 ? Math.round((available / perDay) * 10) / 10 : null,
        // Below this the next assessment is likely to be the one that fails.
        top_up_recommended: perDay > 0 && available < perDay * 7,
    };
}

module.exports = {
    LEDGER_VERSION,
    ACCOUNT_TYPE,
    ENTRY,
    ALL_ENTRY_TYPES,
    LedgerError,
    stateOf,
    availableOf,
    applyEntry,
    replay,
    sufficiency,
    runway,
};
