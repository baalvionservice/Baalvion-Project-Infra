'use strict';
/**
 * Webhook signature verification shared by real vendor adapters.
 *
 * All comparisons are constant-time (crypto.timingSafeEqual) to avoid leaking
 * the signature byte-by-byte via timing. Verification ALWAYS runs over the RAW
 * request body bytes — never a re-serialized object, since JSON re-encoding
 * changes whitespace/key-order and breaks the HMAC. Express routes must capture
 * the raw body (e.g. express.raw or a verify hook) and pass it here.
 */
const crypto = require('crypto');

/** HMAC-SHA256 of `payload` (string|Buffer) keyed by `secret`, hex-encoded. */
function hmacSha256Hex(secret, payload) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** HMAC-SHA256, base64-encoded (AfterShip-style). */
function hmacSha256Base64(secret, payload) {
    return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

/**
 * Constant-time string compare. Returns false (never throws) on length mismatch
 * or non-string input, so a malformed signature header is simply "invalid".
 */
function timingSafeEqualStr(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    try { return crypto.timingSafeEqual(ab, bb); } catch { return false; }
}

/**
 * Generic HMAC webhook verifier.
 * @param {Object} args
 * @param {string} args.secret
 * @param {string|Buffer} args.rawBody     raw request body bytes
 * @param {string} args.signatureHeader    value from the provider's signature header
 * @param {'hex'|'base64'} [args.encoding='hex']
 * @returns {boolean}
 */
function verifyHmac({ secret, rawBody, signatureHeader, encoding = 'hex' }) {
    if (!secret || rawBody == null || !signatureHeader) return false;
    const expected = encoding === 'base64'
        ? hmacSha256Base64(secret, rawBody)
        : hmacSha256Hex(secret, rawBody);
    return timingSafeEqualStr(expected, signatureHeader);
}

module.exports = {
    hmacSha256Hex,
    hmacSha256Base64,
    timingSafeEqualStr,
    verifyHmac,
};
