'use strict';
/**
 * Mirror captured payments and refunds into the double-entry ledger (ledger-service).
 *
 * This client is written against ledger-service's ACTUAL contract, read from its controller,
 * DTO and entity rather than assumed:
 *
 *   POST {baseUrl}/api/v1/ledger/entries
 *     transactionRef  String, max 64, the idempotency key — (tenant, ref) is unique and a
 *                     replay returns the existing entry rather than posting a second one.
 *     amount          BigDecimal(19,4) in MAJOR units, @DecimalMin("0.01"). Not minor units.
 *     currency        ISO-4217, exactly 3 chars.
 *     entryType       EntryType.valueOf() — PAYMENT | FEE | REVERSAL | SETTLEMENT | ESCROW
 *                     | REFUND | ADJUSTMENT. Anything else is a 500.
 *     metadata        String holding JSON (stored into a jsonb column). An object here does
 *                     not bind and the whole request is rejected.
 *   GET  {baseUrl}/api/v1/ledger/entries?page=&size=&entryType=
 *     Spring Page JSON: { content: [...], totalElements, number, size, ... }.
 *
 * Design:
 *   - The store id is the ledger tenant (X-Tenant-ID). Account ids are deterministic per store
 *     (derived UUIDs) so no chart-of-accounts provisioning is required.
 *   - Double-entry directions:
 *       PAYMENT captured  → Debit  store CASH      , Credit store REVENUE
 *       REFUND issued     → Debit  store REVENUE   , Credit store CASH
 *   - FAIL-OPEN: a ledger outage/error never propagates into the payment path. Failures emit a
 *     structured `ledger.post_failed` log for ops/replay, and the reconciliation report detects
 *     the resulting gap.
 *   - DISABLED when no internal key is configured (logs `ledger.skipped`).
 *
 * Authenticates with the shared internal key (X-Internal-Key).
 */
const crypto = require('crypto');
const config = require('../config/appConfig');
const { Money } = require('@baalvion/money');

// ── deterministic per-store account ids ─────────────────────────────────────────
// A stable UUIDv5-style id derived from (storeId, accountKind) via SHA-1. No registry
// needed; the same store+kind always maps to the same ledger account.
function deriveAccountId(storeId, kind) {
    const hash = crypto.createHash('sha1').update(`baalvion:commerce:${storeId}:${kind}`).digest('hex');
    // Format 16 bytes as a UUID, stamping version 5 + RFC4122 variant.
    const b = hash.slice(0, 32).split('');
    b[12] = '5';
    b[16] = ((parseInt(b[16], 16) & 0x3) | 0x8).toString(16);
    const h = b.join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const accounts = {
    cash:    (storeId) => deriveAccountId(storeId, 'cash'),
    revenue: (storeId) => deriveAccountId(storeId, 'revenue'),
};

const MAX_REF_LENGTH = 64;

/**
 * Exact minor units for a stored amount — the comparison currency for reconciliation.
 * The exponent comes from the currency, not a hardcoded 100: a zero-decimal currency read
 * at 100x would corrupt every comparison, and the ledger is what everything reconciles to.
 */
function toMinorUnits(amount, currencyCode) {
    return Money.fromDatabaseValue(amount, currencyCode || 'USD').toSafeNumber();
}

/**
 * The decimal string ledger-service stores. Its `amount` is a BigDecimal in MAJOR units with
 * an 0.01 minimum — posting minor units there overstates every entry by 10^exponent.
 */
function toLedgerAmount(amount, currencyCode) {
    return Money.fromDatabaseValue(amount, currencyCode || 'USD').toDecimalString();
}

/** Exact minor units from an amount ledger-service returned (a decimal string). */
function ledgerAmountToMinorUnits(amount, currencyCode) {
    return Money.fromDatabaseValue(amount, currencyCode || 'USD').toSafeNumber();
}

async function postEntry(storeId, entry) {
    if (!config.ledger.enabled) {
        console.info(JSON.stringify({ evt: 'ledger.skipped', reason: 'not_configured', storeId, transactionRef: entry.transactionRef }));
        return { ok: false, skipped: true };
    }
    // A ref over the column limit must never be silently truncated: two different postings
    // truncated to the same ref would dedup against each other and one would vanish.
    if (String(entry.transactionRef || '').length > MAX_REF_LENGTH) {
        console.error(JSON.stringify({ evt: 'ledger.post_failed', storeId, transactionRef: entry.transactionRef, error: 'transaction_ref_too_long' }));
        return { ok: false, error: 'transaction_ref_too_long' };
    }
    const url = `${config.ledger.baseUrl}${config.ledger.apiPrefix}/ledger/entries`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.ledger.timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': config.ledger.internalKey,
                'X-Service-Name': 'order-service',
                'X-Tenant-ID': storeId,
            },
            // metadata is serialised to a JSON string here — the receiving field is a String.
            body: JSON.stringify({ ...entry, metadata: JSON.stringify(entry.metadata || {}) }),
            signal: ctrl.signal,
        });
        if (res.status === 201) return { ok: true };
        if (res.status === 409) return { ok: true, duplicate: true }; // already posted — idempotent success
        const text = await res.text().catch(() => '');
        console.error(JSON.stringify({ evt: 'ledger.post_failed', storeId, transactionRef: entry.transactionRef, status: res.status, body: text.slice(0, 200) }));
        return { ok: false, status: res.status };
    } catch (err) {
        console.error(JSON.stringify({ evt: 'ledger.post_failed', storeId, transactionRef: entry.transactionRef, error: err.message }));
        return { ok: false, error: err.message };
    } finally {
        clearTimeout(timer);
    }
}

/** Mirror a captured payment as a PAYMENT journal entry (Debit cash / Credit revenue). */
async function recordPaymentCapture(storeId, { paymentId, orderId, orderNumber, amount, currencyCode, provider, transactionId }) {
    return postEntry(storeId, {
        transactionRef: `pay-${paymentId}`,
        debitAccountId: accounts.cash(storeId),
        creditAccountId: accounts.revenue(storeId),
        amount: toLedgerAmount(amount, currencyCode),
        currency: currencyCode || 'USD',
        entryType: 'PAYMENT',
        description: `Payment captured for order ${orderNumber || orderId}`,
        relatedTransactionId: orderId,
        metadata: { orderId, orderNumber, storeId, provider, transactionId, source: 'order-service' },
    });
}

/** Mirror a refund as a REFUND journal entry (Debit revenue / Credit cash). */
async function recordRefund(storeId, { refundId, orderId, orderNumber, amount, currencyCode, provider, transactionId, reason }) {
    return postEntry(storeId, {
        transactionRef: `refund-${refundId}`,
        debitAccountId: accounts.revenue(storeId),
        creditAccountId: accounts.cash(storeId),
        amount: toLedgerAmount(amount, currencyCode),
        currency: currencyCode || 'USD',
        entryType: 'REFUND',
        description: `Refund for order ${orderNumber || orderId}${reason ? ` — ${reason}` : ''}`,
        relatedTransactionId: orderId,
        metadata: { orderId, orderNumber, storeId, provider, transactionId, reason, source: 'order-service' },
    });
}

/**
 * List this store's journal entries — used by the reconciliation report.
 *
 * ledger-service pages with `page`/`size` and returns a Spring Page (`content`), not
 * `limit`/`offset` and `data`. Sending the wrong parameter names is not an error there: the
 * defaults silently apply, so the report would read one page of 20 and call it the whole ledger.
 */
async function listEntries(storeId, { entryType, page = 0, size = 100 } = {}) {
    if (!config.ledger.enabled) return { ok: false, skipped: true, entries: [] };
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (entryType) qs.set('entryType', entryType);
    const url = `${config.ledger.baseUrl}${config.ledger.apiPrefix}/ledger/entries?${qs.toString()}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.ledger.timeoutMs);
    try {
        const res = await fetch(url, {
            headers: { 'X-Internal-Key': config.ledger.internalKey, 'X-Service-Name': 'order-service', 'X-Tenant-ID': storeId },
            signal: ctrl.signal,
        });
        if (!res.ok) return { ok: false, status: res.status, entries: [] };
        const body = await res.json();
        const entries = Array.isArray(body.content) ? body.content : [];
        return { ok: true, entries, totalElements: body.totalElements, last: body.last };
    } catch (err) {
        return { ok: false, error: err.message, entries: [] };
    } finally {
        clearTimeout(timer);
    }
}

module.exports = {
    recordPaymentCapture, recordRefund, listEntries, postEntry,
    accounts, deriveAccountId,
    toMinorUnits, toLedgerAmount, ledgerAmountToMinorUnits,
    MAX_REF_LENGTH,
};
