'use strict';

/**
 * Webhook + API-key cryptography. Stripe-style webhook signature so receivers can
 * verify authenticity and reject replays:
 *
 *   X-Baalvion-Signature: t=<unixSeconds>,v1=<hex HMAC-SHA256(secret, `${t}.${body}`)>
 *
 * API keys are random tokens; only their SHA-256 hash is stored. Verification is a
 * constant-time compare against the stored hash.
 */

const crypto = require('crypto');

function randomToken(bytes = 24) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(s) {
    return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function timingSafeEqualHex(a, b) {
    const ba = Buffer.from(String(a), 'hex');
    const bb = Buffer.from(String(b), 'hex');
    if (ba.length !== bb.length || ba.length === 0) return false;
    return crypto.timingSafeEqual(ba, bb);
}

/** Build the signature header value for a webhook delivery. */
function signWebhook(secret, body, timestamp = Math.floor(Date.now() / 1000)) {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const v1 = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    return { header: `t=${timestamp},v1=${v1}`, timestamp, v1 };
}

/** Verify an inbound signature header against the raw body (for receivers/tests). */
function verifyWebhook(secret, body, headerValue, toleranceSec = 300) {
    if (!headerValue) return false;
    const parts = Object.fromEntries(String(headerValue).split(',').map((kv) => kv.split('=')));
    const t = Number(parts.t);
    if (!t || Math.abs(Math.floor(Date.now() / 1000) - t) > toleranceSec) return false;
    const expected = signWebhook(secret, body, t).v1;
    return timingSafeEqualHex(expected, parts.v1 || '');
}

module.exports = { randomToken, sha256, timingSafeEqualHex, signWebhook, verifyWebhook };
