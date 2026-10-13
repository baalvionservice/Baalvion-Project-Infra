'use strict';
/**
 * Authenticates the order service when it asks us to open a journey. Not a user: a signed request.
 *
 *   x-journey-timestamp   unix seconds (a request more than five minutes old is rejected, so a
 *                         captured request cannot be replayed later)
 *   x-journey-signature   sha256=hex(HMAC(JOURNEY_INTERNAL_SECRET, `${timestamp}.${rawBody}`))
 *
 * Fails closed: with no secret configured nothing is accepted.
 */
const crypto = require('crypto');

const TOLERANCE_SECONDS = 300;

function sign(secret, timestamp, body) {
    return `sha256=${crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

function verify({ rawBody, headers = {}, secret = process.env.JOURNEY_INTERNAL_SECRET, now = Math.floor(Date.now() / 1000) }) {
    if (!secret) return { ok: false, reason: 'the internal secret is not configured' };
    const h = {};
    for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = v;
    const ts = h['x-journey-timestamp'];
    const sig = h['x-journey-signature'];
    if (!ts || !sig || !/^\d+$/.test(String(ts))) return { ok: false, reason: 'missing or malformed signature headers' };
    if (Math.abs(now - Number(ts)) > TOLERANCE_SECONDS) return { ok: false, reason: 'the request is too old or too new' };
    const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
    const a = Buffer.from(sign(secret, ts, body));
    const b = Buffer.from(String(sig));
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

module.exports = { sign, verify, TOLERANCE_SECONDS };
