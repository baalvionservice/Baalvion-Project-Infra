'use strict';

/**
 * Resolve email/SES configuration from the environment.
 *
 * SECURITY: credentials are NEVER hard-coded. They are read from the standard AWS
 * environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) or, when those are
 * absent, from the ambient AWS credential chain (IAM role, ECS task role, shared config),
 * so the same code runs unchanged on a developer laptop and on an EC2/ECS instance role.
 *
 * @typedef {Object} SenderMap
 * @property {string} auth          From address for authentication mail (verify, OTP, reset, welcome)
 * @property {string} notifications From address for general notifications (orders, generic alerts)
 * @property {string} security      From address for security mail (login/security alerts)
 * @property {string} support       From address for support replies
 * @property {string} billing       From address for invoices / billing
 * @property {string} invrel        From address for investor-relations mail
 *
 * @typedef {Object} EmailConfig
 * @property {string} region
 * @property {string|undefined} accessKeyId
 * @property {string|undefined} secretAccessKey
 * @property {string|undefined} sessionToken
 * @property {string} configurationSet
 * @property {string} fromName
 * @property {string} replyTo
 * @property {string} appUrl
 * @property {string} adminUrl
 * @property {SenderMap} senders
 */

const env = (key, fallback) => {
    const v = process.env[key];
    return v === undefined || v === '' ? fallback : v;
};

/**
 * @param {Partial<EmailConfig>} [overrides]
 * @returns {EmailConfig}
 */
function loadConfig(overrides = {}) {
    const fromName = env('SES_FROM_NAME', env('EMAIL_FROM_NAME', 'Baalvion'));

    const senders = {
        auth: env('SES_FROM_AUTH', env('EMAIL_FROM', 'noreply@baalvion.com')),
        notifications: env('SES_FROM_NOTIFICATIONS', 'notifications@baalvion.com'),
        security: env('SES_FROM_SECURITY', 'security@baalvion.com'),
        support: env('SES_FROM_SUPPORT', 'support@baalvion.com'),
        billing: env('SES_FROM_BILLING', 'billing@baalvion.com'),
        invrel: env('SES_FROM_INVREL', 'invrel@baalvion.com'),
    };

    return {
        region: env('AWS_REGION', env('AWS_DEFAULT_REGION', 'ap-south-1')),
        // Left undefined when unset so the AWS SDK falls back to the ambient credential
        // chain (IAM role / ECS task role) instead of failing with empty-string creds.
        accessKeyId: env('AWS_ACCESS_KEY_ID', undefined),
        secretAccessKey: env('AWS_SECRET_ACCESS_KEY', undefined),
        sessionToken: env('AWS_SESSION_TOKEN', undefined),
        configurationSet: env('SES_CONFIGURATION_SET', 'baalvion-production'),
        fromName,
        replyTo: env('EMAIL_REPLY_TO', senders.support),
        // RFC 8058 mailto target for List-Unsubscribe on marketing/newsletter mail only.
        unsubscribeMailto: env('EMAIL_UNSUBSCRIBE_MAILTO', 'unsubscribe@baalvion.com'),
        appUrl: env('APP_URL', 'https://baalvion.com'),
        adminUrl: env('ADMIN_URL', 'https://admin.baalvion.com'),
        senders,
        ...overrides,
    };
}

/**
 * True when AWS SES is usable: either explicit keys are present, or we trust the
 * ambient credential chain because a region is configured. Callers use this to decide
 * whether SES is the active provider (vs a dev/no-op fallback).
 * @param {EmailConfig} config
 * @returns {boolean}
 */
function isSesConfigured(config) {
    if (config.accessKeyId && config.secretAccessKey) return true;
    // Allow ambient-credential (instance role) usage when explicitly opted in.
    return env('SES_USE_INSTANCE_ROLE', 'false') === 'true';
}

module.exports = { loadConfig, isSesConfigured };
