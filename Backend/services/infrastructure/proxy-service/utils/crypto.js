const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const generateToken = (size = 32) => crypto.randomBytes(size).toString('hex');

// URL-safe high-entropy secret (no padding) — used for API key secrets.
const randomKey = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');

// Constant-time comparison of two hex strings (mitigates timing side channels).
const timingSafeEqualHex = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch (_) {
        return false;
    }
};

module.exports = {
    sha256,
    generateToken,
    randomKey,
    timingSafeEqualHex,
};