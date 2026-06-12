'use strict';
/**
 * ============================================================================
 * Inbound payment webhook verification + event normalization
 * ============================================================================
 * Razorpay / RazorpayX sign every webhook with HMAC-SHA256(rawBody, webhook_secret)
 * delivered HEX in the `X-Razorpay-Signature` header. Verification MUST run over
 * the RAW request body bytes (Express must capture them via express.raw) — a
 * re-serialized JSON object will not match.
 *
 * This module provides the verify + parse primitives ONLY. Wiring the Express
 * route (raw-body capture, idempotent upsert, bus emit) is a later supervised
 * step in WIRING.md.
 *
 * Required configuration:
 *   RAZORPAYX_WEBHOOK_SECRET / RAZORPAY_WEBHOOK_SECRET   webhook signing secret
 */
const { verifyHmac } = require('../_shared/signature');
const { PAYMENT_STATUS } = require('./contract');

// RazorpayX payout event status -> normalized PAYMENT_STATUS (mirrors providers/razorpayx).
const PAYOUT_STATUS_MAP = Object.freeze({
    queued: PAYMENT_STATUS.PENDING,
    pending: PAYMENT_STATUS.PENDING,
    processing: PAYMENT_STATUS.PROCESSING,
    processed: PAYMENT_STATUS.COMPLETED,
    reversed: PAYMENT_STATUS.FAILED,
    cancelled: PAYMENT_STATUS.CANCELLED,
    rejected: PAYMENT_STATUS.FAILED,
    failed: PAYMENT_STATUS.FAILED,
    on_hold: PAYMENT_STATUS.HELD,
});

/**
 * Verify a Razorpay / RazorpayX webhook signature (constant-time, over raw body).
 * @param {{ rawBody:string|Buffer, signatureHeader:string, secret:string }} args
 * @returns {boolean} true iff authentic.
 */
function verifyRazorpayWebhook({ rawBody, signatureHeader, secret }) {
    return verifyHmac({ secret, rawBody, signatureHeader, encoding: 'hex' });
}

/**
 * Normalize a (already verified) RazorpayX payout webhook body into the fields
 * the order saga needs. Accepts the standard envelope:
 *   { event, payload: { payout: { entity: {...} } } }
 * or a bare payout entity.
 * @param {object|string} body  parsed JSON object (or JSON string)
 * @returns {{ providerId:string, idempotencyKey:string, amount:(number|null), currency:(string|null), status:keyof typeof PAYMENT_STATUS, rawStatus:string, event?:string }}
 */
function parsePayoutEvent(body) {
    const obj = typeof body === 'string' ? safeParse(body) : body;
    if (!obj || typeof obj !== 'object') {
        const err = new Error('payout webhook: unparseable body');
        err.code = 'BAD_WEBHOOK_BODY';
        throw err;
    }
    const entity = obj?.payload?.payout?.entity || obj?.payout?.entity || obj?.payout || obj?.entity || obj;
    const rawStatus = String(entity.status || '').toLowerCase();
    const status = PAYOUT_STATUS_MAP[rawStatus] || PAYMENT_STATUS.PROCESSING;
    return {
        providerId: entity.id,
        idempotencyKey: entity.reference_id,
        // RazorpayX `entity.amount` is in the minor unit (paise) — convert to MAJOR units
        // so it can be compared to the order's stored base_currency_amount. Guard non-finite.
        amount: paiseToMajor(entity.amount),
        currency: entity.currency != null ? String(entity.currency) : null,
        status,
        rawStatus,
        event: obj.event,
    };
}

// RazorpayX amounts are integer paise (1/100 of the major unit). Returns null when
// the value is missing or non-finite so a forged/absent amount can never settle.
function paiseToMajor(paise) {
    const n = Number(paise);
    if (!Number.isFinite(n)) return null;
    return n / 100;
}

function safeParse(s) {
    try { return JSON.parse(s); } catch { return undefined; }
}

module.exports = {
    verifyRazorpayWebhook,
    parsePayoutEvent,
    PAYOUT_STATUS_MAP,
};
