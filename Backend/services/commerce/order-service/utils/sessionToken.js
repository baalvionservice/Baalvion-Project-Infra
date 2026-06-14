'use strict';
// Tamper-resistant guest-cart session tokens. A cart's owner-session is a server-generated random
// id (NOT guessable, NOT the cartId), handed to the client as an HMAC-SHA256-signed token:
//     token = base64url(sessionId) + '.' + base64url(HMAC(payload, secret))
// The client returns it as the `X-Cart-Session` header; the server verifies the signature
// (constant-time) and recovers the sessionId. Without the secret, signing/verification fail-closed
// (guest carts disabled). This prevents session spoofing and cart enumeration: knowing a cartId is
// useless without the matching signed session (or being the authenticated owner / store staff).
const crypto = require('crypto');
const config = require('../config/appConfig');
const { AppError } = require('./errors');

const getSecret = () => (config.session && config.session.signingSecret) || '';
const b64url = (s) => Buffer.from(s).toString('base64url');
const hmac = (data, key) => crypto.createHmac('sha256', key).update(data).digest('base64url');

function newSessionId() {
    return `cs_${crypto.randomUUID()}`;
}

function sign(sessionId) {
    const key = getSecret();
    if (!key) throw new AppError('SESSION_NOT_CONFIGURED', 'Guest sessions are not enabled (CART_SESSION_SECRET missing)', 503);
    const payload = b64url(String(sessionId));
    return `${payload}.${hmac(payload, key)}`;
}

/** Verify a signed token → the sessionId, or null if absent/invalid/forged. */
function verify(token) {
    const key = getSecret();
    if (!key || typeof token !== 'string') return null;
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!safeEqual(sig, hmac(payload, key))) return null;
    try { return Buffer.from(payload, 'base64url').toString('utf8'); } catch { return null; }
}

/** Constant-time string compare (length-safe). */
function safeEqual(a, b) {
    const ba = Buffer.from(String(a == null ? '' : a), 'utf8');
    const bb = Buffer.from(String(b == null ? '' : b), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

module.exports = { newSessionId, sign, verify, safeEqual };
