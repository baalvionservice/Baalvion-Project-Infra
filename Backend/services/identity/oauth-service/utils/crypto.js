'use strict';
const crypto = require('crypto');

function generateCode(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

// PKCE: verifier → challenge (S256)
function pkceChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function verifyPkce(verifier, challenge, method) {
    // Only S256 is accepted. 'plain' is insecure (verifier == challenge — trivially interceptable)
    // and is no longer advertised in the discovery document.
    if (method === 'S256') return pkceChallenge(verifier) === challenge;
    return false;
}

function safeCompare(a, b) {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = { generateCode, sha256, pkceChallenge, verifyPkce, safeCompare };
