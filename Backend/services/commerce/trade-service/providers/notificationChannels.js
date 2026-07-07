'use strict';
/**
 * Notification-channel providers for the Shipment Tracking & Global
 * Visibility Platform (whatsapp/slack/teams/webhook). Each channel is
 * 'simulated' (logged, not actually sent) until its env key is configured —
 * same posture as providers/tracking.js. websocket/email/sms reuse the
 * existing realtime module / already-declared email/sms provider keys and
 * are not duplicated here.
 */
const logger = require('../service/logger');

const CHANNELS = [
    { name: 'whatsapp', key: 'WHATSAPP_API_KEY' },
    { name: 'slack', key: 'SLACK_WEBHOOK_URL' },
    { name: 'teams', key: 'TEAMS_WEBHOOK_URL' },
    { name: 'webhook', key: 'TRACKING_WEBHOOK_URL' },
];

const mode = (channel) => {
    const entry = CHANNELS.find((c) => c.name === channel);
    if (!entry) return 'unsupported';
    return process.env[entry.key] ? 'live' : 'simulated';
};

/**
 * Send a notification over a channel. In simulated mode this is a structured
 * no-op (logged) so local/demo environments never require paid credentials.
 * In live mode it POSTs to the configured webhook URL (slack/teams/generic
 * webhook) or would call the provider SDK (whatsapp) — left as a thin fetch
 * call since no SDK dependency is otherwise present in this service.
 */
async function send(channel, { recipient, message, payload } = {}) {
    const channelMode = mode(channel);
    if (channelMode !== 'live') {
        logger.info(`[notificationChannels] simulated ${channel} send`, { recipient, message });
        return { ok: true, mode: 'simulated' };
    }
    const entry = CHANNELS.find((c) => c.name === channel);
    const url = process.env[entry.key];
    if (channel === 'whatsapp') {
        // WhatsApp Business API needs a phone-number-ID + token, not just a webhook
        // URL; until those are configured this still degrades to simulated.
        logger.info('[notificationChannels] whatsapp live send not yet wired (needs phone-number-id)', { recipient });
        return { ok: true, mode: 'simulated' };
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || { text: message }),
    });
    return { ok: res.ok, mode: 'live', status: res.status };
}

function health() {
    return CHANNELS.map((c) => ({ name: c.name, mode: mode(c.name) }));
}

module.exports = { CHANNELS, mode, send, health };
