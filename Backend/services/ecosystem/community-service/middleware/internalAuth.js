'use strict';
// Server-to-server auth for payment-service's billing-fulfill callback — it carries no RS256
// user token (it's not an end user), so the platform authMiddleware doesn't apply here.
const { timingSafeMatch } = require('../service/internalSecret');

function requireInternalSecret(req, res, next) {
    if (!timingSafeMatch(req.headers['x-internal-secret'])) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'internal secret required' } });
    }
    return next();
}

module.exports = { requireInternalSecret };
