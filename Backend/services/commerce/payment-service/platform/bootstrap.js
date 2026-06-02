'use strict';
/**
 * Boot the payment-service platform layer: initialise the single SDK instance and
 * expose it on `app.locals.sdk`. Call once in the server bootstrap, after the
 * trace middleware is mounted in the chain (the entrypoint owns the mount point,
 * before the route layer) and before the listener starts.
 */
const { initSdk } = require('./sdk');
const config = require('../config/appConfig');

async function bootstrapPlatform(app) {
    const sdk = await initSdk();
    app.locals.sdk = sdk;
    sdk.logger.info(
        { service: config.service, transport: config.eventTransport, cmsHub: config.cmsBaseUrl, env: config.env },
        'payment-service platform layer ready (SDK + trace bound)',
    );
    return sdk;
}

module.exports = { bootstrapPlatform };
