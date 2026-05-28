'use strict';
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const fs     = require('fs');
const config = require('../config/appConfig');

let _privateKey = null;
let _publicKey  = null;
let _keyId      = null;

function getPrivateKey() {
    if (_privateKey) return _privateKey;
    if (config.jwt.privateKeyPath) {
        _privateKey = fs.readFileSync(config.jwt.privateKeyPath, 'utf8');
    } else if (config.jwt.privateKeyB64) {
        _privateKey = Buffer.from(config.jwt.privateKeyB64, 'base64').toString('utf8');
    } else if (config.jwt.privateKey) {
        _privateKey = config.jwt.privateKey.replace(/\\n/g, '\n');
    } else {
        throw new Error('JWT private key not configured in oauth-service');
    }
    return _privateKey;
}

function getPublicKey() {
    if (_publicKey) return _publicKey;
    if (config.jwt.publicKeyPath) {
        _publicKey = fs.readFileSync(config.jwt.publicKeyPath, 'utf8');
    } else if (config.jwt.publicKeyB64) {
        _publicKey = Buffer.from(config.jwt.publicKeyB64, 'base64').toString('utf8');
    } else if (config.jwt.publicKey) {
        _publicKey = config.jwt.publicKey.replace(/\\n/g, '\n');
    } else {
        // Derive public key from private key
        const priv = getPrivateKey();
        const keyObj = crypto.createPrivateKey(priv);
        _publicKey = keyObj.export({ type: 'spki', format: 'pem' }).toString();
    }
    return _publicKey;
}

function getKeyId() {
    if (_keyId) return _keyId;
    const pub = getPublicKey();
    _keyId = crypto.createHash('sha256').update(pub).digest('base64url').slice(0, 16);
    return _keyId;
}

// Build JWKS JSON for /.well-known/jwks.json
function buildJwks() {
    const pub    = getPublicKey();
    const keyObj = crypto.createPublicKey(pub);
    const jwk    = keyObj.export({ format: 'jwk' });
    return {
        keys: [{
            kty: jwk.kty,
            use: 'sig',
            alg: 'RS256',
            kid: getKeyId(),
            n:   jwk.n,
            e:   jwk.e,
        }],
    };
}

function signToken(payload, expiresIn) {
    return jwt.sign(payload, getPrivateKey(), {
        algorithm: 'RS256',
        expiresIn,
        issuer:    config.jwt.issuer,
        audience:  config.jwt.audience,
        keyid:     getKeyId(),
    });
}

function verifyToken(token) {
    return jwt.verify(token, getPublicKey(), {
        algorithms: ['RS256'],
        issuer:     config.jwt.issuer,
        audience:   config.jwt.audience,
    });
}

module.exports = { getPublicKey, getPrivateKey, getKeyId, buildJwks, signToken, verifyToken };
