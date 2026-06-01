'use strict';
/**
 * The single @baalvion/sdk instance for notification-service (CommonJS runtime).
 *
 * notification-service is the platform's first PRODUCTION event consumer on the
 * Redis Streams transport: it subscribes to baalvion:events via sdk.events, logs
 * via sdk.logger, traces via sdk.trace, and authenticates service-to-service calls
 * via sdk.internalAuth. It holds no tenant secrets; provider creds (email/SMS/push)
 * are global infra config, so it does not consume sdk.config.
 */
const config = require('../config/appConfig');

let instance = null;
let initPromise = null;

async function initSdk() {
    if (instance) return instance;
    if (initPromise) return initPromise;
    const { createSdk } = require('@baalvion/sdk');
    initPromise = createSdk({
        service: 'notification-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        cms: {
            baseUrl: process.env.CMS_BASE_URL || 'http://localhost:3018/api/v1',
            internalSecret: config.internalSecret,
        },
        internalAuth: { secret: config.internalSecret, scheme: 'shared-secret' },
        // The consumer's whole job is reading the Redis Streams backbone.
        eventBus: { transport: process.env.EVENT_TRANSPORT || 'redis' },
        logLevel: process.env.LOG_LEVEL || 'info',
    }).then((sdk) => {
        instance = sdk;
        initPromise = null;
        return sdk;
    }).catch((err) => {
        initPromise = null; // allow retry (intentional — not a persistent latch)
        throw err;
    });
    return initPromise;
}

function getSdk() {
    if (!instance) throw new Error('[notification-service] SDK not initialised — call initSdk() in bootstrap before use');
    return instance;
}

function tryGetSdk() {
    return instance;
}

module.exports = { initSdk, getSdk, tryGetSdk };
