'use strict';
// One log line per optional capability at boot, so a half-configured deploy is obvious in the logs
// instead of being discovered when a user hits a 503 or an email never arrives. Never throws.
const kycCrypto = require('../utils/kycCrypto');

function status(env = process.env, crypto = kycCrypto) {
    const emailOn = !!env.NOTIFICATION_BASE_URL && !!env.INTERNAL_SERVICE_SECRET;
    return {
        kyc: crypto.isConfigured() ? 'enabled' : 'DISABLED (KYC_ENCRYPTION_KEY missing or not 32 bytes base64): /kyc will answer 503',
        email: emailOn ? 'enabled' : 'disabled (needs NOTIFICATION_BASE_URL and INTERNAL_SERVICE_SECRET): in-app notifications only',
        adminAlerts: env.ADMIN_ALERT_EMAIL ? 'enabled' : 'disabled (ADMIN_ALERT_EMAIL unset): admins see queues in the console only',
    };
}

function report(log = console) {
    try {
        const s = status();
        const level = s.kyc.startsWith('DISABLED') ? 'warn' : 'info';
        log[level](JSON.stringify({ evt: 'community.capabilities', ...s }));
    } catch (err) {
        log.error(JSON.stringify({ evt: 'community.capabilities_error', error: err.message }));
    }
}

module.exports = { status, report };
