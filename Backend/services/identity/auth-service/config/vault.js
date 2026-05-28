'use strict';
/**
 * Key management abstraction.
 *
 * Resolution order (first match wins):
 *   1. PEM files on disk  — JWT_PRIVATE_KEY_PATH + JWT_PUBLIC_KEY_PATH
 *   2. Base64 env vars    — JWT_PRIVATE_KEY_B64  + JWT_PUBLIC_KEY_B64   (containers/CI)
 *   3. Inline PEM env     — JWT_PRIVATE_KEY      + JWT_PUBLIC_KEY       (escape hatch)
 *   4. Ephemeral generate — DEV ONLY, invalidates all tokens on restart
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let _cache = null;

function loadKeys() {
    if (_cache) return _cache;

    let privateKey, publicKey;

    // 1 — File paths
    const privPath = process.env.JWT_PRIVATE_KEY_PATH;
    const pubPath  = process.env.JWT_PUBLIC_KEY_PATH;
    if (privPath && pubPath) {
        privateKey = fs.readFileSync(path.resolve(privPath), 'utf8');
        publicKey  = fs.readFileSync(path.resolve(pubPath),  'utf8');
    }
    // 2 — Base64-encoded PEM (good for Docker secrets / Kubernetes)
    else if (process.env.JWT_PRIVATE_KEY_B64 && process.env.JWT_PUBLIC_KEY_B64) {
        privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY_B64, 'base64').toString('utf8');
        publicKey  = Buffer.from(process.env.JWT_PUBLIC_KEY_B64,  'base64').toString('utf8');
    }
    // 3 — Raw PEM in env (newlines escaped as \n)
    else if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
        privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
        publicKey  = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    }
    // 4 — Ephemeral fallback: dev only
    else {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('[Vault] RSA keys are required in production. Set JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH.');
        }
        console.warn('[Vault] ⚠  No RSA keys configured — generating ephemeral 2048-bit keypair (DEV ONLY, tokens lost on restart)');
        const pair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding:  { type: 'spki',  format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        privateKey = pair.privateKey;
        publicKey  = pair.publicKey;
    }

    // Stable kid from public key fingerprint — survives restarts for same key file
    const pubObj = crypto.createPublicKey(publicKey);
    const der    = pubObj.export({ type: 'spki', format: 'der' });
    const kid    = crypto.createHash('sha256').update(der).digest('base64url').slice(0, 16);

    _cache = { privateKey, publicKey, kid };
    return _cache;
}

/** Call this during key rotation — forces next loadKeys() to re-read from disk. */
function rotateKeys() { _cache = null; }

module.exports = { loadKeys, rotateKeys };
