'use strict';
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

/**
 * Gate for first-party, server-to-server callers (e.g. Imperialpedia's Next.js
 * server reading the wire feed to render /world). Distinct from apiKeyAuth,
 * which is the public developer-key flow for third-party API consumers —
 * internal platform services shouldn't have to mint/verify a developer key
 * just to read their own platform's data. Shares the same INTERNAL_API_KEY
 * convention already used for the news-service → developer-service call.
 */
function requireInternalKey(req, res, next) {
    const provided = req.headers['x-internal-key'];
    const expected = config.developerService.internalApiKey;
    if (!expected) return next(new AppError('INTERNAL_KEY_NOT_CONFIGURED', 'Internal API key not configured', 503));
    if (!provided || provided !== expected) {
        return next(new AppError('UNAUTHORIZED', 'Missing or invalid internal key', 401));
    }
    return next();
}

module.exports = { requireInternalKey };
