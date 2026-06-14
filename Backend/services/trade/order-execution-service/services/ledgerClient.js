'use strict';
/**
 * Client for the Java ledger-service double-entry API. Used to post a GL entry when an
 * order settles on the RazorpayX rail (the 'internal' rail already posts the ledger via
 * the Java Kafka choreography, so this is ONLY for the external rail).
 *
 * POST {url}/api/v1/ledger/entries  (X-Tenant-ID header)
 *   in  { transactionRef, debitAccountId, creditAccountId, amount, currency, entryType, description }
 *   out 201 EntryResponse  (idempotent by (tenant, transactionRef) — a replay returns the
 *       existing entry, never a second posting)
 *
 * transactionRef is the idempotency key — it MUST NOT be silently truncated (a truncated ref
 * could collide with a different posting, or break dedup). A ref > 64 chars throws
 * LEDGER_BAD_REF (permanent — the caller acks + alerts). `description` is capped to 255 chars
 * (defensive, column-length safe).
 */
const config = require('../config/appConfig');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function isUuid(v) { return typeof v === 'string' && UUID_RE.test(v); }

/**
 * @param {{ tenantId?:string, transactionRef:string, debitAccountId:string,
 *           creditAccountId:string, amount:number, currency:string,
 *           entryType?:string, description?:string }} entry
 * @param {{ url?:string, timeoutMs?:number, fetchImpl?:Function }} [opts]
 */
async function postEntry(entry, opts = {}) {
    const url = opts.url || config.ledger.url;
    const timeoutMs = opts.timeoutMs || config.ledger.timeoutMs;
    const fetchImpl = opts.fetchImpl || globalThis.fetch;

    // Validate before the call — the ledger rejects bad input, but failing here gives a
    // clearer error and avoids a pointless round-trip.
    if (!isUuid(entry.debitAccountId) || !isUuid(entry.creditAccountId)) {
        const err = new Error('ledger postEntry: debit/credit account ids must be UUIDs');
        err.code = 'LEDGER_BAD_ACCOUNTS';
        throw err;
    }
    const amount = round2(entry.amount);
    if (!Number.isFinite(amount) || amount < 0.01) {
        const err = new Error(`ledger postEntry: amount must be >= 0.01, got ${entry.amount}`);
        err.code = 'LEDGER_BAD_AMOUNT';
        throw err;
    }
    const transactionRef = String(entry.transactionRef || '');
    if (transactionRef.length > 64) {
        const err = new Error(`ledger postEntry: transactionRef must be <= 64 chars, got ${transactionRef.length}`);
        err.code = 'LEDGER_BAD_REF';
        throw err;
    }
    const currency = String(entry.currency || '').toUpperCase();
    const description = entry.description == null ? entry.description : String(entry.description).slice(0, 255);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (isUuid(entry.tenantId)) headers['X-Tenant-ID'] = entry.tenantId;
        const res = await fetchImpl(`${url}/api/v1/ledger/entries`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                transactionRef,
                debitAccountId: entry.debitAccountId,
                creditAccountId: entry.creditAccountId,
                amount,
                currency,
                entryType: entry.entryType || config.ledger.entryType,
                description,
            }),
            signal: controller.signal,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error((body && body.message) || `ledger postEntry HTTP ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return body;
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { postEntry, isUuid, round2 };
