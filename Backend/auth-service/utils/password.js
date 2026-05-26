'use strict';
/**
 * Password hashing abstraction.
 * Uses argon2id when the `argon2` package is installed (preferred).
 * Falls back to bcrypt transparently — both hashes are auto-detected on verify.
 *
 * Install argon2: npm install argon2
 */
let argon2;
try { argon2 = require('argon2'); } catch { argon2 = null; }

const bcrypt = require('bcrypt');
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

const ARGON2_OPTIONS = {
    type:        argon2?.argon2id,
    memoryCost:  65536,  // 64 MiB
    timeCost:    3,
    parallelism: 4,
};

async function hash(plaintext) {
    if (argon2) return argon2.hash(plaintext, ARGON2_OPTIONS);
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/**
 * Detects hash type by prefix and delegates to the correct verifier.
 * Works on mixed databases during migration from bcrypt → argon2.
 */
async function verify(storedHash, plaintext) {
    if (storedHash.startsWith('$argon2')) {
        if (!argon2) throw new Error('argon2 package not installed but argon2 hash found — run: npm install argon2');
        return argon2.verify(storedHash, plaintext);
    }
    return bcrypt.compare(plaintext, storedHash);
}

/** Returns the algorithm currently used for new hashes. */
function algorithm() { return argon2 ? 'argon2id' : 'bcrypt'; }

module.exports = { hash, verify, algorithm };
