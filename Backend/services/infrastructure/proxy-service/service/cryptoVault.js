'use strict';

/**
 * Provider-secret encryption at rest (AES-256-GCM).
 *
 * Provider API tokens / proxy passwords are stored encrypted in
 * provider_credentials and decrypted only in memory when building upstream
 * config. The master key comes from PROVIDER_SECRET_KEY (32 bytes, hex or
 * base64). Rotate by setting PROVIDER_SECRET_KEY_PREVIOUS during re-encryption.
 */

const crypto = require('crypto');
const logger = require('./logger');

function loadKey(envVal) {
  if (!envVal) return null;
  const buf = /^[0-9a-fA-F]{64}$/.test(envVal) ? Buffer.from(envVal, 'hex') : Buffer.from(envVal, 'base64');
  return buf.length === 32 ? buf : null;
}

const KEY = loadKey(process.env.PROVIDER_SECRET_KEY);
const PREV_KEY = loadKey(process.env.PROVIDER_SECRET_KEY_PREVIOUS);

if (!KEY && process.env.NODE_ENV === 'production') {
  throw new Error('[vault] PROVIDER_SECRET_KEY (32 bytes) is required in production');
}

/** Encrypt → "v1:base64(iv).base64(tag).base64(ciphertext)". */
function encrypt(plaintext) {
  if (!KEY) throw new Error('[vault] no encryption key configured');
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
  if (!payload || !payload.startsWith('v1:')) return payload; // tolerate plaintext during migration
  try {
    return decryptWith(KEY, payload);
  } catch (err) {
    if (PREV_KEY) {
      try { return decryptWith(PREV_KEY, payload); } catch (_) { /* fallthrough */ }
    }
    logger.error('[vault] decrypt failed:', err.message);
    throw new Error('provider secret decryption failed');
  }
}

module.exports = { encrypt, decrypt, hasKey: () => Boolean(KEY) };
