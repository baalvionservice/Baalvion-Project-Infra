'use strict';
/**
 * ntfy channel.
 *
 * Added because every other channel this service implements needs credentials that do not
 * exist on this platform: email falls back through SES -> Resend -> SMTP to a log sink, and
 * SMS and push both resolve to `log` providers that print and reach nobody. ntfy needs a topic
 * name and nothing else, so it is the one channel that can actually deliver today.
 *
 * The publisher itself lives in @baalvion/notify-ntfy rather than here, because the status
 * prober in admin-service must be able to alert when THIS service is the thing that is down.
 */
const { sendNtfy, isConfigured, resolveConfig } = require('@baalvion/notify-ntfy');
const logger = require('../utils/logger');

/**
 * @param {object} msg
 * @param {string} msg.title
 * @param {string} msg.body
 * @param {'critical'|'warning'|'info'} [msg.severity]
 * @param {string[]} [msg.tags]
 * @param {string} [msg.clickUrl]
 * @param {string} [msg.topic] override the default topic (e.g. a per-severity topic)
 */
async function sendNtfyNotification(msg = {}) {
    if (!msg.title && !msg.body) throw new Error('ntfy notification needs a title or a body');
    const out = await sendNtfy(msg, msg.topic ? { topic: msg.topic } : {});
    if (out.sent) logger.info({ title: msg.title }, 'ntfy notification sent');
    else logger.warn({ title: msg.title, reason: out.error || out.skipped }, 'ntfy notification not delivered');
    return out;
}

/** Reported on /health next to the other channels, so "configured" is visible without guessing. */
function resolveProvider() {
    return isConfigured() ? (resolveConfig().server === 'https://ntfy.sh' ? 'ntfy.sh' : 'ntfy-self-hosted') : 'unconfigured';
}

module.exports = { sendNtfyNotification, resolveProvider };
