'use strict';
/**
 * Symmetric encryption for stored integration secrets (API keys, payment keys).
 *
 * Secrets are encrypted at rest with AES-256-GCM and only ever returned to the
 * console in masked form (••••1234). The raw values are decrypted solely by the
 * internal resolver for service-to-service use. The key is derived from
 * CMS_SECRETS_KEY (set this in production); a dev fallback keeps local setups
 * working out of the box.
 */
const crypto = require('crypto');

const ALG = 'aes-256-gcm';

function getKey() {
    const raw =
        process.env.CMS_SECRETS_KEY ||
        process.env.INTERNAL_SECRETS_KEY ||
        'baalvion-cms-dev-secret-key-change-me';
    return crypto.createHash('sha256').update(String(raw)).digest(); // 32 bytes
}

/** Encrypt a plain object → base64(iv | tag | ciphertext). */
function encrypt(obj) {
    if (!obj || Object.keys(obj).length === 0) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALG, getKey(), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, data]).toString('base64');
}

/** Decrypt a base64 blob back to an object; returns {} on any failure. */
function decrypt(blob) {
    if (!blob) return {};
    try {
        const buf = Buffer.from(blob, 'base64');
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const data = buf.subarray(28);
        const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
        decipher.setAuthTag(tag);
        const out = Buffer.concat([decipher.update(data), decipher.final()]);
        return JSON.parse(out.toString('utf8'));
    } catch {
        return {};
    }
}

/** Mask a single secret value for display: keep only the last 4 chars. */
function maskValue(v) {
    if (v == null || v === '') return null;
    const s = String(v);
    return s.length <= 4 ? '••••' : `••••${s.slice(-4)}`;
}

/** Mask every value of a secrets object for safe display. */
function maskSecrets(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) out[k] = maskValue(v);
    return out;
}

module.exports = { encrypt, decrypt, maskValue, maskSecrets };
