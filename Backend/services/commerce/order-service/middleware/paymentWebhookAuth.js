'use strict';
// Signature verification for provider-initiated payment webhooks (async failure/cancellation).
// The provider signs the raw request body with a shared secret (PAYMENT_WEBHOOK_SECRET); we
// recompute hmac_sha256(rawBody) and constant-time compare it to the `X-Payment-Signature` header.
//
// FAIL-CLOSED: with no secret configured, webhooks are rejected (a provider-driven state change is
// security-sensitive — it must never be accepted unauthenticated). The raw body is captured by the
// express.json({ verify }) hook in index.js (req.rawBody) so the signature covers the exact bytes.
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

function timingSafeEqualHex(a, b) {
    const ba = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyPaymentWebhook(req, res, next) {
    if (!SECRET) return next(new AppError('FORBIDDEN', 'Payment webhooks are disabled (PAYMENT_WEBHOOK_SECRET not set)', 403));
    const sig = req.get('X-Payment-Signature');
    if (!sig) return next(new AppError('UNAUTHORIZED', 'Missing webhook signature', 401));
    // req.rawBody is the exact bytes express.json parsed (see index.js verify hook). FAIL CLOSED if
    // the raw capture is unavailable: re-serializing req.body would HMAC a re-encoded payload (key
    // order / whitespace / number formatting can differ from the bytes the provider signed), silently
    // degrading verification. A provider-driven state change must never be accepted on a derived body.
    const raw = req.rawBody;
    if (raw == null) return next(new AppError('UNAUTHORIZED', 'Raw body unavailable for signature verification', 401));
    const expected = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
    if (!timingSafeEqualHex(expected, sig)) return next(new AppError('UNAUTHORIZED', 'Invalid webhook signature', 401));
    return next();
}

module.exports = { verifyPaymentWebhook };
