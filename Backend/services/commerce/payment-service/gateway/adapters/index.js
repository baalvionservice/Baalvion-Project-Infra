'use strict';
/**
 * Provider adapter factory. The set of supported gateways; selection is driven
 * ENTIRELY by the provider name resolved from the CMS vault (sdk.config) — never
 * from env or request input beyond the resolved tenant config.
 */
const razorpay = require('./razorpay');
const stripe = require('./stripe');
const payu = require('./payu');

const ADAPTERS = Object.freeze({ razorpay, stripe, payu });

function getAdapter(provider) {
    const a = ADAPTERS[String(provider || '').toLowerCase()];
    if (!a) {
        const err = new Error(`Unsupported payment provider: ${provider}`);
        err.code = 'UNSUPPORTED_PROVIDER';
        throw err;
    }
    return a;
}

function isSupported(provider) {
    return Boolean(ADAPTERS[String(provider || '').toLowerCase()]);
}

module.exports = { getAdapter, isSupported, supported: Object.keys(ADAPTERS) };
