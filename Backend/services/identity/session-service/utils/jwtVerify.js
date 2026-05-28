'use strict';
// Delegates RS256 verification to the canonical authority (packages/auth-node).
// See catalog/enforce.mjs C3 (no auth duplication). Key resolution stays local + lazy.
const fs     = require('fs');
const { createAuthServer } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

let _publicKey = null;

function getPublicKey() {
    if (_publicKey) return _publicKey;
    if (config.jwt.publicKeyPath)  { _publicKey = fs.readFileSync(config.jwt.publicKeyPath, 'utf8'); }
    else if (config.jwt.publicKeyB64) { _publicKey = Buffer.from(config.jwt.publicKeyB64, 'base64').toString('utf8'); }
    else if (config.jwt.publicKey)    { _publicKey = config.jwt.publicKey.replace(/\\n/g, '\n'); }
    else throw new Error('No JWT public key configured.');
    return _publicKey;
}

let _auth = null;
function authServer() {
    if (!_auth) _auth = createAuthServer({
        publicKey:          getPublicKey(),
        issuer:             config.jwt.issuer,
        audience:           config.jwt.audience,
        allowHs256Fallback: false,           // RS256-only, matches original algorithms:['RS256']
        env:                config.env,
    });
    return _auth;
}

function verifyToken(token) {
    return authServer().verifyAccessToken(token);
}

module.exports = { verifyToken };
