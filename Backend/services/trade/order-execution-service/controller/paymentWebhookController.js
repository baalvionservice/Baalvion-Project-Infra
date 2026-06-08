'use strict';
/**
 * RazorpayX settlement webhook -> order saga cascade.
 *
 * RazorpayX signs every webhook with HMAC-SHA256(rawBody, RAZORPAYX_WEBHOOK_SECRET)
 * delivered HEX in X-Razorpay-Signature. We verify over the RAW body (captured in
 * index.js), normalize the payout entity, map its terminal status to the canonical
 * `payments.transaction.*` event, and reuse the SAME idempotent inbox + saga cascade
 * as the Java finance-events bridge (controller/internalController.applySettlement).
 *
 * The payout's reference_id is `order-<orderId>` (set by orderController.confirmPayment),
 * so settlement links back to the exact order with no extra lookup.
 */
const crypto = require('crypto');
const config = require('../config/appConfig');
const internal = require('./internalController');
const { verifyRazorpayWebhook, parsePayoutEvent } = require('../integrations/payment/webhook');

// Normalized PAYMENT_STATUS / raw payout status -> the saga's terminal event.
// Non-terminal states (queued/pending/processing/on_hold) have no event -> acked + ignored.
function eventTypeForPayout(parsed) {
    switch (parsed.rawStatus) {
        case 'processed': return 'payments.transaction.completed';
        case 'reversed': return 'payments.transaction.reversed';
        case 'failed':
        case 'rejected':
        case 'cancelled': return 'payments.transaction.failed';
        default: return null; // not yet terminal
    }
}

/** `order-<id>` reference_id -> `<id>` (or null when absent/foreign). */
function orderIdFromRef(ref) {
    if (!ref || typeof ref !== 'string') return null;
    const id = ref.replace(/^order-/, '').trim();
    return id || null;
}

/**
 * Pure-ish core: decides the HTTP response from injected verify/parse/apply deps.
 * No Express/DB coupling, so it is unit-testable.
 * @returns {Promise<{status:number, json:object}>}
 */
async function handleRazorpayWebhook(input, deps) {
    const { verify, parse, apply } = deps;
    if (!verify()) {
        return { status: 401, json: { error: { code: 'BAD_SIGNATURE', message: 'invalid webhook signature' } } };
    }
    let parsed;
    try { parsed = parse(); } catch (e) {
        return { status: 400, json: { error: { code: 'BAD_WEBHOOK_BODY', message: 'unparseable payout webhook' } } };
    }
    const eventType = eventTypeForPayout(parsed);
    if (!eventType) {
        return { status: 200, json: { ok: true, ignored: true, rawStatus: parsed.rawStatus } };
    }
    const orderId = orderIdFromRef(parsed.idempotencyKey);
    if (!orderId) {
        return { status: 200, json: { ok: true, ignored: true, reason: 'no order reference' } };
    }
    // 2A: dedup key MUST come only from HMAC-protected data — the payout entity.id (signed)
    // or the content-addressed eventType:hash fallback. NEVER an attacker-controllable header.
    const webhookId = parsed.providerId || `${eventType}:${input.hash}`;
    try {
        const result = await apply({
            webhookId, eventType, hash: input.hash, orderId,
            // 3A/3B + forward/pending guards (settlement path only; finance-events stays unguarded).
            expect: { amount: parsed.amount, currency: parsed.currency },
            requireForward: true,
            requirePending: eventType === 'payments.transaction.completed',
        });
        // A guard rejected the event (amount/currency mismatch, illegal transition, not-pending).
        // This is permanent — ack 200 so RazorpayX stops retrying — but the order did NOT advance.
        if (result && result.rejected) {
            console.error(
                `[${config.service}] SECURITY: razorpay settlement rejected event=${sanitizeLog(eventType)} order=${sanitizeLog(orderId)} reason=${sanitizeLog(result.rejected)}`,
            );
            return { status: 200, json: { ok: true, rejected: result.rejected } };
        }
        return { status: 200, json: { ok: true, event: eventType, result } };
    } catch (err) {
        if (err && err.name === 'SequelizeUniqueConstraintError') {
            return { status: 200, json: { ok: true, deduped: true, event: eventType } };
        }
        console.error(`[${config.service}] razorpay webhook cascade failed:`, eventType, err.message);
        return { status: 500, json: { error: { code: 'CASCADE_FAILED', message: 'event processing failed; retry' } } };
    }
}

// Strip CR/LF/tab from any dynamic value before logging (no log-injection / forging).
function sanitizeLog(v) {
    return String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ');
}

// Express handler — wires the real verify/parse/apply over the request.
async function razorpayWebhook(req, res) {
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const secret = config.payment.razorpayWebhookSecret;
    const signatureHeader = req.headers['x-razorpay-signature'];
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    // 2A: webhookId is derived INSIDE handleRazorpayWebhook from signed body data only.
    // The X-Razorpay-Event-Id header is NOT HMAC-covered, so it is intentionally not passed.
    const out = await handleRazorpayWebhook(
        { hash },
        {
            verify: () => verifyRazorpayWebhook({ rawBody: raw, signatureHeader, secret }),
            parse: () => parsePayoutEvent(req.body || {}),
            apply: internal.applySettlement,
        },
    );
    return res.status(out.status).json(out.json);
}

module.exports = { razorpayWebhook, handleRazorpayWebhook, eventTypeForPayout, orderIdFromRef };
