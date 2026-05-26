'use strict';
const jwt    = require('jsonwebtoken');
const fs     = require('fs');
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

function verifyToken(token) {
    return jwt.verify(token, getPublicKey(), {
        algorithms: ['RS256'],
        issuer:     config.jwt.issuer,
        audience:   config.jwt.audience,
    });
}

module.exports = { verifyToken };
