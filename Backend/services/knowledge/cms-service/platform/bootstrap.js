'use strict';
/**
 * Boot the cms-service platform layer.
 *
 * Initialises the single SDK instance and exposes it on `app.locals.sdk` for
 * request handlers that prefer that access path (service-layer code uses the
 * `getSdk()` singleton instead). Call once in the server bootstrap, AFTER the
 * trace middleware is mounted in the chain but BEFORE the listener starts.
 *
 * The trace middleware itself is mounted by index.js at the correct position in
 * the middleware chain (it must run before the /api/v1 router); it activates as
 * soon as this init completes.
 */
const { initSdk } = require('./sdk');
const config = require('../config/appConfig');

async function bootstrapPlatform(app) {
    const sdk = await initSdk();
    app.locals.sdk = sdk;
    sdk.logger.info(
        { service: 'cms-service', transport: config.eventTransport, env: config.env },
        'cms-service platform layer ready (SDK + trace bound)',
    );
    return sdk;
}

module.exports = { bootstrapPlatform };
