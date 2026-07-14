'use strict';
/**
 * The single @baalvion/sdk instance for imperialpedia-service (CommonJS runtime).
 *
 * Used to subscribe to the baalvion:events Redis Streams bus (sdk.events) so this
 * service can sync short-titled CMS content into the glossary `entities` table as
 * cms-service publishes/unpublishes content — see workers/eventConsumer.js.
 */
const config = require('../config/appConfig');

let instance = null;
let initPromise = null;

async function initSdk() {
    if (instance) return instance;
    if (initPromise) return initPromise;
    const { createSdk } = require('@baalvion/sdk');
    initPromise = createSdk({
        service: 'imperialpedia-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        cms: {
            baseUrl: config.cms.baseUrl,
            internalSecret: config.internalSecret,
        },
        internalAuth: { secret: config.internalSecret, scheme: 'shared-secret' },
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
    if (!instance) throw new Error('[imperialpedia-service] SDK not initialised — call initSdk() in bootstrap before use');
    return instance;
}

function tryGetSdk() {
    return instance;
}

module.exports = { initSdk, getSdk, tryGetSdk };
