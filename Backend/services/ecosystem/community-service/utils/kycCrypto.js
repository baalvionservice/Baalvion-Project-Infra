'use strict';
// AES-256-GCM for KYC documents. The key comes from KYC_ENCRYPTION_KEY (32 bytes, base64).
// No key means no KYC: callers get a 503 rather than a silent fallback to plaintext.
const crypto = require('crypto');

function loadKey() {
    const raw = process.env.KYC_ENCRYPTION_KEY || '';
    if (!raw) return null;
    const key = Buffer.from(raw, 'base64');
    return key.length === 32 ? key : null;
}

const isConfigured = () => loadKey() !== null;

function encrypt(plain) {
    const key = loadKey();
    if (!key) throw new Error('KYC_ENCRYPTION_KEY not configured');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
    return { iv, authTag: cipher.getAuthTag(), ciphertext };
}

function decrypt({ iv, authTag, ciphertext }) {
    const key = loadKey();
    if (!key) throw new Error('KYC_ENCRYPTION_KEY not configured');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

module.exports = { isConfigured, encrypt, decrypt };
