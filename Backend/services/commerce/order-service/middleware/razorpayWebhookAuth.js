'use strict';
// Signature verification for Razorpay webhooks (the capture backstop). Razorpay signs the raw
// request body with the webhook secret configured in its dashboard and sends the hex HMAC in the
// `X-Razorpay-Signature` header — we recompute hmac_sha256(rawBody, RAZORPAY_WEBHOOK_SECRET) and
// constant-time compare. This is the security boundary for a provider-driven capture, so it
// FAILS CLOSED: with no secret configured, webhooks are rejected (never an unauthenticated capture).
// The raw body is captured by the express.json({ verify }) hook in index.js (req.rawBody) so the
// signature covers the exact bytes Razorpay signed.
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

function timingSafeEqualHex(a, b) {
    const ba = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyRazorpayWebhook(req, res, next) {
    if (!SECRET) return next(new AppError('FORBIDDEN', 'Razorpay webhooks are disabled (RAZORPAY_WEBHOOK_SECRET not set)', 403));
    const sig = req.get('X-Razorpay-Signature');
    if (!sig) return next(new AppError('UNAUTHORIZED', 'Missing webhook signature', 401));
    const raw = req.rawBody != null ? req.rawBody : JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
    if (!timingSafeEqualHex(expected, sig)) return next(new AppError('UNAUTHORIZED', 'Invalid webhook signature', 401));
    return next();
}

module.exports = { verifyRazorpayWebhook };
