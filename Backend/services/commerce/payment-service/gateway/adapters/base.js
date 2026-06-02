'use strict';
/**
 * Shared crypto + helpers for payment provider adapters.
 *
 * A provider adapter implements the uniform contract:
 *   name
 *   async createOrder({ amount, currency, receipt, notes, secrets, config, mode }) -> { providerOrderId, clientParams, raw }
 *   verifyWebhook({ rawBody, body, headers, secrets }) -> boolean   // REAL signature check (mock + live)
 *   parseWebhook({ body, headers }) -> { providerEventId, eventType, providerOrderId, providerPaymentId, amount, currency, status, raw }
 *   signWebhook({ rawBody, body, secrets, timestamp }) -> string|object   // test/helper to produce a valid signature
 *
 * Secrets ALWAYS come from the CMS vault (resolved via sdk.config); adapters never
 * read env. `mode` is 'live' | 'mock' — signature verification is real crypto in
 * BOTH modes; only createOrder differs (mock = deterministic, no merchant account).
 *
 * Canonical normalized status set: 'authorized' | 'captured' | 'failed' | 'refunded'.
 */
const crypto = require('node:crypto');

function hmacSha256Hex(data, secret) {
    // Refuse to compute with an empty key — an empty-key HMAC is deterministic and
    // forgeable, which would silently disable signature verification.
    if (!secret) throw new Error('hmacSha256Hex: secret must be a non-empty string');
    return crypto.createHmac('sha256', String(secret)).update(data).digest('hex');
}

function sha512Hex(data) {
    return crypto.createHash('sha512').update(data).digest('hex');
}

/** Constant-time hex/string comparison. */
function timingSafeEqual(a, b) {
    const ba = Buffer.from(String(a == null ? '' : a), 'utf8');
    const bb = Buffer.from(String(b == null ? '' : b), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

function nowSeconds() {
    return Math.floor(Date.now() / 1000);
}

module.exports = { hmacSha256Hex, sha512Hex, timingSafeEqual, nowSeconds };
