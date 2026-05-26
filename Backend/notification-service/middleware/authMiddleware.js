'use strict';
const jwt    = require('jsonwebtoken');
const fs     = require('fs');
const crypto = require('crypto');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

let _publicKey = null;

function getPublicKey() {
    if (_publicKey) return _publicKey;
    if (config.jwt.publicKeyPath) { _publicKey = fs.readFileSync(config.jwt.publicKeyPath, 'utf8'); }
    else if (config.jwt.publicKeyB64) { _publicKey = Buffer.from(config.jwt.publicKeyB64, 'base64').toString('utf8'); }
    else if (config.jwt.publicKey)    { _publicKey = config.jwt.publicKey.replace(/\\n/g, '\n'); }
    else throw new Error('No JWT public key configured');
    return _publicKey;
}

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next(new AppError('UNAUTHORIZED', 'Bearer token required', 401));
    try {
        const decoded = jwt.verify(authHeader.slice(7), getPublicKey(), {
            algorithms: ['RS256'],
            issuer:     config.jwt.issuer,
            audience:   config.jwt.audience,
        });
        req.auth = { userId: decoded.sub, email: decoded.email, orgId: decoded.org_id ?? null, role: decoded.role };
        next();
    } catch { next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401)); }
}

// HMAC service-to-service auth
function internalAuth(req, _res, next) {
    if (!config.internalSecret) {
        if (process.env.NODE_ENV !== 'production') return next();
        return next(new AppError('CONFIGURATION_ERROR', 'Internal secret not set', 500));
    }
    const sig = req.headers['x-service-signature'];
    const ts  = req.headers['x-service-timestamp'];
    if (!sig || !ts) return next(new AppError('UNAUTHORIZED', 'Missing service auth', 401));
    if (Date.now() - parseInt(ts, 10) > 30_000) return next(new AppError('UNAUTHORIZED', 'Timestamp expired', 401));
    const expected = crypto.createHmac('sha256', config.internalSecret).update(`${ts}:${req.method}:${req.path}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return next(new AppError('UNAUTHORIZED', 'Invalid service signature', 401));
    }
    next();
}

module.exports = { authMiddleware, internalAuth };
