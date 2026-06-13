'use strict';
/**
 * Financial reconciliation: prove that every captured payment and refund in the order
 * system has a matching double-entry in the ledger, and surface any gaps.
 *
 * The order system is the operational record of money movements; the ledger is the
 * accounting record. They are linked by a deterministic transactionRef derived from the
 * payment row id (`pay-{id}` for captures, `refund-{id}` for refunds). This report:
 *   - lists the captures/refunds the order system expects to see in the ledger,
 *   - fetches the store's ledger entries,
 *   - classifies each as matched / missing / amount-mismatch,
 *   - totals money in/out on both sides.
 * `backfill()` re-posts the missing entries (idempotent — safe to run repeatedly).
 */
const { QueryTypes } = require('sequelize');
const { OrdersOrderPayment, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const ledgerClient = require('./ledgerClient');
const config = require('../config/appConfig');

const LEDGER_PAGE = 100;
const MAX_LEDGER_PAGES = 100; // 10k entries scanned before we report a truncation

// Money movements the order system expects to be mirrored in the ledger.
async function expectedMovements(storeId, { from, to } = {}) {
    const rows = await sequelize.query(
        `SELECT p.id, p.order_id   AS "orderId", p.amount, p.currency_code AS "currencyCode",
                p.status, p.transaction_id AS "transactionId", p.metadata,
                o.order_number AS "orderNumber"
           FROM orders.orders_order_payments p
           JOIN orders.orders_orders o ON o.id = p.order_id
          WHERE o.store_id = :storeId
            AND p.status IN ('captured', 'refunded')
            AND (:from::timestamptz IS NULL OR p.created_at >= :from)
            AND (:to::timestamptz   IS NULL OR p.created_at <= :to)
          ORDER BY p.created_at ASC`,
        { replacements: { storeId, from: from || null, to: to || null }, type: QueryTypes.SELECT },
    );
    return rows.map((p) => {
        const isRefund = p.status === 'refunded';
        return {
            paymentId: p.id, orderId: p.orderId, orderNumber: p.orderNumber,
            kind: isRefund ? 'REFUND' : 'PAYMENT',
            transactionRef: isRefund ? `refund-${p.id}` : `pay-${p.id}`,
            amountMinor: ledgerClient.toMinorUnits(p.amount),
            currency: p.currencyCode, transactionId: p.transactionId,
        };
    });
}

// All of a store's PAYMENT/REFUND ledger entries, keyed by transactionRef.
async function ledgerIndex(storeId) {
    const byRef = new Map();
    let truncated = false;
    for (const entryType of ['PAYMENT', 'REFUND']) {
        let offset = 0;
        for (let page = 0; page < MAX_LEDGER_PAGES; page += 1) {
            const res = await ledgerClient.listEntries(storeId, { entryType, limit: LEDGER_PAGE, offset });
            if (!res.ok) return { ok: false, skipped: res.skipped, byRef };
            for (const e of res.entries) byRef.set(e.transactionRef, e);
            if (res.entries.length < LEDGER_PAGE) break;
            offset += LEDGER_PAGE;
            if (page === MAX_LEDGER_PAGES - 1) truncated = true;
        }
    }
    return { ok: true, byRef, truncated };
}

async function report(storeId, opts = {}) {
    if (!config.ledger.enabled) {
        return { storeId, ledgerAvailable: false, reason: 'ledger_not_configured', message: 'Set LEDGER_INTERNAL_KEY to enable ledger reconciliation.' };
    }
    const expected = await expectedMovements(storeId, opts);
    const idx = await ledgerIndex(storeId);
    if (!idx.ok) return { storeId, ledgerAvailable: false, reason: 'ledger_unreachable' };

    const matched = [];
    const missing = [];
    const mismatched = [];
    for (const m of expected) {
        const entry = idx.byRef.get(m.transactionRef);
        if (!entry) { missing.push(m); continue; }
        if (Math.round(Number(entry.amount)) !== m.amountMinor || entry.entryType !== m.kind) {
            mismatched.push({ ...m, ledgerAmountMinor: Math.round(Number(entry.amount)), ledgerEntryType: entry.entryType, ledgerEntryId: entry.id });
        } else {
            matched.push(m.transactionRef);
        }
    }

    const sum = (arr, kind) => arr.filter((m) => m.kind === kind).reduce((s, m) => s + m.amountMinor, 0);
    return {
        storeId,
        ledgerAvailable: true,
        range: { from: opts.from || null, to: opts.to || null },
        truncated: !!idx.truncated,
        totals: {
            capturedMinor: sum(expected, 'PAYMENT'),
            refundedMinor: sum(expected, 'REFUND'),
            netMinor: sum(expected, 'PAYMENT') - sum(expected, 'REFUND'),
        },
        counts: { expected: expected.length, matched: matched.length, missing: missing.length, mismatched: mismatched.length },
        missing,
        mismatched,
        balanced: missing.length === 0 && mismatched.length === 0,
    };
}

// Re-post the entries the ledger is missing. Idempotent: an entry that already exists
// returns 409 from the ledger and is counted as already-present.
async function backfill(storeId, opts = {}) {
    if (!config.ledger.enabled) throw new AppError('CONFLICT', 'Ledger is not configured (LEDGER_INTERNAL_KEY missing)', 409);
    const r = await report(storeId, opts);
    if (!r.ledgerAvailable) throw new AppError('SERVICE_UNAVAILABLE', 'Ledger is not reachable', 503);

    let posted = 0; let failed = 0;
    for (const m of r.missing) {
        const payment = await OrdersOrderPayment.findByPk(m.paymentId);
        if (!payment) { failed += 1; continue; }
        const args = {
            orderId: m.orderId, orderNumber: m.orderNumber,
            amount: Number(payment.amount), currencyCode: m.currency,
            provider: payment.provider, transactionId: payment.transactionId,
        };
        const res = m.kind === 'REFUND'
            ? await ledgerClient.recordRefund(storeId, { refundId: m.paymentId, reason: (payment.metadata || {}).reason, ...args })
            : await ledgerClient.recordPaymentCapture(storeId, { paymentId: m.paymentId, ...args });
        if (res.ok) posted += 1; else failed += 1;
    }
    return { storeId, attempted: r.missing.length, posted, failed };
}

module.exports = { report, backfill, expectedMovements };
