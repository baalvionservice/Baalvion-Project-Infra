'use strict';
// SMS channel. Twilio provider (lazy-loaded — `twilio` is an optional dependency).
// With no Twilio creds the dev "log" provider prints instead of sending, mirroring
// emailService's SMTP fallback so the service runs with zero external setup.
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const { checkRateLimit, isDuplicate } = require('./throttle');

let _twilio = null;
function getTwilio() {
    if (_twilio) return _twilio;
    const { accountSid, authToken } = config.sms.twilio;
    if (!accountSid || !authToken) return null;
    try {
        // Optional dependency — only required when Twilio is actually configured.
        const twilio = require('twilio');
        _twilio = twilio(accountSid, authToken);
    } catch (err) {
        logger.error({ err: err.message }, 'twilio package not installed — run `pnpm add twilio` to enable SMS');
        return null;
    }
    return _twilio;
}

async function sendViaTwilio({ to, body }) {
    const client = getTwilio();
    if (!client) throw new Error('Twilio not configured');
    const msg = { to, body };
    if (config.sms.messagingServiceSid) msg.messagingServiceSid = config.sms.messagingServiceSid;
    else msg.from = config.sms.from;
    const res = await client.messages.create(msg);
    return { provider: 'twilio', id: res.sid, status: res.status };
}

function sendViaLog({ to, body }) {
    logger.info({ to, body }, '[sms:log] (dev) SMS not sent — no Twilio creds configured');
    return { provider: 'log', id: `log-${Date.now()}`, status: 'logged' };
}

/**
 * @param {object} p { to (E.164 phone), body, idempotencyKey? }
 */
async function sendSms({ to, body, idempotencyKey }) {
    if (!to || !body) throw new Error('sms requires `to` and `body`');

    if (await isDuplicate(idempotencyKey)) {
        logger.info({ idempotencyKey, to }, 'Duplicate SMS suppressed');
        return { suppressed: true, reason: 'duplicate' };
    }
    if (!(await checkRateLimit('sms', to, config.rateLimits.smsPerRecipientPerHour))) {
        logger.warn({ to }, 'SMS rate limit exceeded');
        return { suppressed: true, reason: 'rate_limit' };
    }

    const useTwilio = config.sms.provider === 'twilio' && getTwilio();
    const result = useTwilio ? await sendViaTwilio({ to, body }) : sendViaLog({ to, body });
    logger.info({ to, provider: result.provider, id: result.id }, 'SMS dispatched');
    return result;
}

module.exports = { sendSms };
