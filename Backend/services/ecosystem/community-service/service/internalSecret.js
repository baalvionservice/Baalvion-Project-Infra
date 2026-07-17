'use strict';
/**
 * Single source of truth for the server-to-server internal secret used to authenticate
 * payment-service -> community-service billing-fulfill calls (x-internal-secret header).
 * Mirrors proxy-service/service/internalSecret.js's contract exactly (constant-time,
 * length-blind comparison; refuses the committed dev default in any deployed environment) —
 * duplicated rather than imported cross-service per the architecture contract (C2: no
 * cross-service source imports).
 */
const crypto = require('crypto');

const DEV_DEFAULT = 'baalvion-internal-dev-secret';
const env = String(process.env.NODE_ENV || '').toLowerCase();
const isDeployed = env !== '' && env !== 'development' && env !== 'dev' && env !== 'test';

const raw = process.env.INTERNAL_SERVICE_SECRET || '';
const usingDefault = !raw || raw === DEV_DEFAULT;

if (usingDefault && isDeployed) {
    throw new Error(
        `INTERNAL_SERVICE_SECRET must be set to a non-default value (NODE_ENV=${env}). ` +
        'Refusing to authenticate server-to-server calls with the committed dev secret.'
    );
}

const SECRET = raw || DEV_DEFAULT;
const SECRET_DIGEST = crypto.createHash('sha256').update(SECRET).digest();

function timingSafeMatch(provided) {
    const candidate = crypto.createHash('sha256').update(String(provided == null ? '' : provided)).digest();
    return crypto.timingSafeEqual(candidate, SECRET_DIGEST);
}

module.exports = { SECRET, timingSafeMatch };
