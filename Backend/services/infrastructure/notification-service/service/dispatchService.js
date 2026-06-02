'use strict';
// Unified multi-channel dispatch. Given a recipient + per-channel payloads, fans
// out to email/sms/push queues and the in-app channel, honoring each user's
// channel preferences. This is the "engine" that ties the channels together.
const { getQueues } = require('../queue/queues');
const deviceService = require('./deviceService');
const inappService  = require('./inappService');
const logger        = require('../utils/logger');

/**
 * @param {object} msg
 * @param {string} [msg.userId]              for preferences, push tokens, in-app inbox
 * @param {object} [msg.recipients]          { email, phone }
 * @param {string[]} [msg.channels]          explicit channels; else inferred from payloads
 * @param {object} [msg.email]               { templateName, data, rawSubject, rawHtml }
 * @param {object} [msg.sms]                 { body }
 * @param {object} [msg.push]                { title, body, data }
 * @param {object} [msg.inapp]               { title, body, data, type }
 * @param {string} [msg.idempotencyKey]      base key; per-channel suffix added
 * @returns {Promise<object>} per-channel result
 */
async function dispatch(msg = {}) {
    const { userId, recipients = {}, idempotencyKey } = msg;
    const { emailQueue, smsQueue, pushQueue } = getQueues();

    // Infer channels from which payloads + recipients are present, unless explicit.
    const inferred = [];
    if (msg.email && recipients.email) inferred.push('email');
    if (msg.sms && recipients.phone)   inferred.push('sms');
    if (msg.push && userId)            inferred.push('push');
    if (msg.inapp && userId)           inferred.push('inapp');
    const channels = (msg.channels && msg.channels.length ? msg.channels : inferred);

    const idem = (ch) => (idempotencyKey ? `${idempotencyKey}:${ch}` : undefined);
    const result = {};

    for (const ch of channels) {
        // Honor per-user opt-outs.
        if (!(await deviceService.isChannelEnabled(userId, ch))) { result[ch] = { skipped: 'preference_off' }; continue; }
        try {
            if (ch === 'email' && recipients.email) {
                const job = await emailQueue.add('dispatch-email', { to: recipients.email, ...msg.email, idempotencyKey: idem('email') });
                result.email = { queued: job.id };
            } else if (ch === 'sms' && recipients.phone) {
                const job = await smsQueue.add('dispatch-sms', { to: recipients.phone, ...msg.sms, idempotencyKey: idem('sms') });
                result.sms = { queued: job.id };
            } else if (ch === 'push' && userId) {
                const job = await pushQueue.add('dispatch-push', { userId, ...msg.push, idempotencyKey: idem('push') });
                result.push = { queued: job.id };
            } else if (ch === 'inapp' && userId) {
                result.inapp = await inappService.sendInApp({ userId, ...msg.inapp, idempotencyKey: idem('inapp') });
            } else {
                result[ch] = { skipped: 'missing_recipient_or_payload' };
            }
        } catch (err) {
            logger.error({ err: err.message, channel: ch, userId }, 'dispatch channel failed');
            result[ch] = { error: err.message };
        }
    }

    logger.info({ userId, channels, result }, 'Notification dispatched');
    return { channels, result };
}

module.exports = { dispatch };
