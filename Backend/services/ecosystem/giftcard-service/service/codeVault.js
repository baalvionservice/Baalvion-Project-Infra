'use strict';

/**
 * Gift card redeem-code encryption at rest (AES-256-GCM).
 *
 * A redeem code IS redeemable money — treated with the same care as a payment
 * credential. Stored encrypted in gift_card_orders.redeem_code_encrypted / redeem_pin_encrypted,
 * decrypted only in memory when the owning user views their card. Mirrors
 * proxy-service/service/cryptoVault.js's envelope format exactly (duplicated per the
 * architecture contract's C2 rule: no cross-service source imports). The master key comes
 * from GIFTCARD_CODE_ENCRYPTION_KEY (32 bytes, hex or base64). Rotate by setting
 * GIFTCARD_CODE_ENCRYPTION_KEY_PREVIOUS during re-encryption.
 */

const crypto = require('crypto');

function loadKey(envVal) {
    if (!envVal) return null;
    const buf = /^[0-9a-fA-F]{64}$/.test(envVal) ? Buffer.from(envVal, 'hex') : Buffer.from(envVal, 'base64');
    return buf.length === 32 ? buf : null;
}

const KEY = loadKey(process.env.GIFTCARD_CODE_ENCRYPTION_KEY);
const PREV_KEY = loadKey(process.env.GIFTCARD_CODE_ENCRYPTION_KEY_PREVIOUS);

if (!KEY && process.env.NODE_ENV === 'production') {
    throw new Error('[codeVault] GIFTCARD_CODE_ENCRYPTION_KEY (32 bytes) is required in production');
}

/** Encrypt -> "v1:base64(iv).base64(tag).base64(ciphertext)". */
function encrypt(plaintext) {
    if (!KEY) throw new Error('[codeVault] no encryption key configured');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

function decryptWith(key, payload) {
    const [, body] = payload.split('v1:');
    const [ivB64, tagB64, ctB64] = body.split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

/** Decrypt, trying the current key then the previous (rotation window). */
function decrypt(payload) {
    if (!payload || !payload.startsWith('v1:')) return payload;
    try {
        return decryptWith(KEY, payload);
    } catch (err) {
        if (PREV_KEY) {
            try { return decryptWith(PREV_KEY, payload); } catch (_) { /* fallthrough */ }
        }
        throw new Error('gift card code decryption failed: ' + err.message);
    }
}

module.exports = { encrypt, decrypt, hasKey: () => Boolean(KEY) };
