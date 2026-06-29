'use strict';

/**
 * Amazon SES adapter for the notification-service.
 *
 * Wraps the centralized @baalvion/email service with a Redis-backed delivery-status store so
 * every email the platform sends is recorded (recipient, sender, template, status, messageId,
 * configurationSet) and later updated by SES events arriving on the /webhooks/aws/ses endpoint.
 *
 * notification-service renders its OWN templates (templates/index.js), so we send the
 * already-rendered HTML via `sendRaw`, choosing the verified sender from the template's purpose.
 */
const { createEmailService, createRedisStore, isSesConfigured, loadConfig } = require('@baalvion/email');
const redis  = require('../config/redis');
const logger = require('../utils/logger');

// notification-service template name -> SES sender category.
const TEMPLATE_CATEGORY = {
    welcome: 'auth',
    emailVerification: 'auth',
    passwordReset: 'auth',
    loginAlert: 'security',
    securityAlert: 'security',
    mfaEnabled: 'security',
    impersonationAlert: 'security',
    orderConfirmation: 'notifications',
    orderPaid: 'notifications',
    orgInvite: 'notifications',
};

let _service = null;
let _store = null;

function getStore() {
    if (_store) return _store;
    const client = redis.getClient && redis.getClient();
    // Durable status in Redis when available; otherwise the package falls back to log-only.
    _store = client ? createRedisStore(client, { logger }) : undefined;
    return _store;
}

/** The shared SES-backed EmailService (lazy singleton). Reusable + DI-friendly. */
function getService() {
    if (_service) return _service;
    _service = createEmailService({ logger, store: getStore() });
    return _service;
}

/** Whether SES is the active provider (explicit keys or opted-in instance role). */
function isSesEnabled() {
    return isSesConfigured(loadConfig());
}

/**
 * The delivery-status store, exposed so the SNS webhook can update statuses.
 * @returns {{record:Function, updateStatus:Function, get?:Function} | undefined}
 */
function getDeliveryStore() {
    return getStore();
}

/**
 * Send already-rendered HTML through SES.
 * @param {{to:string, subject:string, html:string, text?:string, replyTo?:string, templateName?:string, idempotencyKey?:string}} p
 * @returns {Promise<{provider:string, id:string|null, status:string}>}
 */
async function sendViaSes({ to, subject, html, text, replyTo, templateName }) {
    const category = TEMPLATE_CATEGORY[templateName] || 'notifications';
    const res = await getService().sendRaw({ to, subject, html, text, replyTo, category, template: templateName || 'raw' });
    if (res.status === 'failed') {
        // Permanent failure (hard bounce / rejected) — surface so the caller's failover does NOT
        // kick in for a doomed address. We throw only for transient (handled inside sendRaw).
        const err = new Error(`SES permanent failure: ${res.error || 'rejected'}`);
        err.permanent = true;
        throw err;
    }
    return { provider: 'ses', id: res.messageId, status: res.status };
}

module.exports = { sendViaSes, isSesEnabled, getDeliveryStore, getService };
