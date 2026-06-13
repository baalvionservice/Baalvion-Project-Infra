'use strict';
/**
 * Mirror captured payments and refunds into the double-entry ledger (ledger-service).
 *
 * Design:
 *   - One journal entry per money movement. transactionRef is derived from the
 *     payment row id (stable + unique), so retries and reconciliation backfills
 *     are IDEMPOTENT — a duplicate post returns 409 DUPLICATE_TRANSACTION and is
 *     treated as success.
 *   - The store id is the ledger tenant (x-tenant-id). Account ids are deterministic
 *     per store (derived UUIDs) so no chart-of-accounts provisioning is required.
 *   - Double-entry directions:
 *       PAYMENT captured  → Debit  store CASH      , Credit store REVENUE
 *       REFUND issued     → Debit  store REVENUE   , Credit store CASH
 *   - FAIL-OPEN: a ledger outage/error never propagates into the payment path.
 *     Failures emit a structured `ledger.post_failed` log for ops/replay, and the
 *     reconciliation report detects the resulting gap.
 *   - DISABLED when no internal key is configured (logs `ledger.skipped`).
 *
 * Authenticates to ledger-service with the shared internal key (X-Internal-Key).
 */
const crypto = require('crypto');
const config = require('../config/appConfig');

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

// Money is posted in minor units (integer cents), matching ledger-service's amount column.
function toMinorUnits(amount) {
    return Math.round(Number(amount) * 100);
}

async function postEntry(storeId, entry) {
    if (!config.ledger.enabled) {
        console.info(JSON.stringify({ evt: 'ledger.skipped', reason: 'not_configured', storeId, transactionRef: entry.transactionRef }));
        return { ok: false, skipped: true };
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
                'X-Tenant-Id': storeId,
            },
            body: JSON.stringify(entry),
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
        amount: toMinorUnits(amount),
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
        amount: toMinorUnits(amount),
        currency: currencyCode || 'USD',
        entryType: 'REFUND',
        description: `Refund for order ${orderNumber || orderId}${reason ? ` — ${reason}` : ''}`,
        relatedTransactionId: orderId,
        metadata: { orderId, orderNumber, storeId, provider, transactionId, reason, source: 'order-service' },
    });
}

/** List this store's journal entries (paginated) — used by the reconciliation report. */
async function listEntries(storeId, { entryType, limit = 100, offset = 0 } = {}) {
    if (!config.ledger.enabled) return { ok: false, skipped: true, entries: [] };
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (entryType) qs.set('entryType', entryType);
    const url = `${config.ledger.baseUrl}${config.ledger.apiPrefix}/ledger/entries?${qs.toString()}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.ledger.timeoutMs);
    try {
        const res = await fetch(url, {
            headers: { 'X-Internal-Key': config.ledger.internalKey, 'X-Service-Name': 'order-service', 'X-Tenant-Id': storeId },
            signal: ctrl.signal,
        });
        if (!res.ok) return { ok: false, status: res.status, entries: [] };
        const body = await res.json();
        return { ok: true, entries: body.data || [], pagination: body.pagination };
    } catch (err) {
        return { ok: false, error: err.message, entries: [] };
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { recordPaymentCapture, recordRefund, listEntries, postEntry, accounts, deriveAccountId, toMinorUnits };
