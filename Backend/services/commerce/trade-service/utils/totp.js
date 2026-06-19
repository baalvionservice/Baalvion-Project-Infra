'use strict';
/**
 * Dependency-free TOTP (RFC 6238 / HOTP RFC 4226) using Node crypto.
 * Used for MFA enrollment + verification. SHA1, 6 digits, 30s step.
 */
const crypto = require('crypto');

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
    let bits = 0, value = 0, out = '';
    for (const byte of buf) {
        value = (value << 8) | byte; bits += 8;
        while (bits >= 5) { out += B32_ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
    return out;
}

function base32Decode(str) {
    const clean = String(str).toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
    let bits = 0, value = 0;
    const out = [];
    for (const ch of clean) {
        const idx = B32_ALPHABET.indexOf(ch);
        if (idx === -1) continue;
        value = (value << 5) | idx; bits += 5;
        if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    return Buffer.from(out);
}

function generateSecret(bytes = 20) {
    return base32Encode(crypto.randomBytes(bytes));
}

function hotp(secretB32, counter) {
    const key = base32Decode(secretB32);
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
    return (code % 1e6).toString().padStart(6, '0');
}

function totp(secretB32, time = Date.now(), step = 30) {
    return hotp(secretB32, Math.floor(time / 1000 / step));
}

// Verify with a ±1 step drift window. Constant-time-ish comparison.
function verify(secretB32, token, time = Date.now(), step = 30, window = 1) {
    if (!secretB32 || !token) return false;
    const counter = Math.floor(time / 1000 / step);
    for (let i = -window; i <= window; i++) {
        const candidate = hotp(secretB32, counter + i);
        if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(String(token).padStart(6, '0').slice(0, 6)))) {
            return true;
        }
    }
    return false;
}

function otpauthURI(secretB32, label, issuer = 'Baalvion Trade OS') {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function generateBackupCodes(n = 8) {
    return Array.from({ length: n }, () => crypto.randomBytes(5).toString('hex'));
}

module.exports = { generateSecret, totp, hotp, verify, otpauthURI, generateBackupCodes, base32Decode, base32Encode };
