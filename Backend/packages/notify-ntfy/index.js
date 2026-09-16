'use strict';
/**
 * ntfy publisher — the platform's phone-reaching alert channel.
 *
 * This lives in a package rather than in a service because two callers need it and one of them
 * cannot depend on the other:
 *   - notification-service, as a first-class channel alongside email/sms/push/webhook
 *   - admin-service's status prober, which must be able to alert WHEN notification-service is
 *     the thing that is down (it monitors it, and that service currently exits on boot without
 *     an email provider configured)
 *
 * Chosen because it is the only channel on this platform that works with no credentials: a
 * topic URL is the entire configuration. Email, SMS and push all have implemented adapters and
 * absent secrets, so they silently fall back to a log sink that reaches nobody.
 *
 * Publishing to a public ntfy topic is publishing to anyone who guesses the topic name — so the
 * body carries what broke and never why it is reachable: no tokens, no hostnames beyond the
 * public domain, no customer data.
 */

const DEFAULT_SERVER = 'https://ntfy.sh';

/** ntfy maps 1 (min) .. 5 (max); anything else is rejected by the server. */
const PRIORITY = { critical: 5, warning: 4, info: 3 };

function resolveConfig(overrides = {}) {
    const topic = overrides.topic ?? process.env.NTFY_TOPIC ?? null;
    return {
        topic,
        server: (overrides.server ?? process.env.NTFY_SERVER ?? DEFAULT_SERVER).replace(/\/+$/, ''),
        token: overrides.token ?? process.env.NTFY_TOKEN ?? null,
        timeoutMs: Number(overrides.timeoutMs ?? process.env.NTFY_TIMEOUT_MS ?? 5000),
    };
}

const isConfigured = (overrides) => Boolean(resolveConfig(overrides).topic);

/**
 * @param {object} msg
 * @param {string} msg.title    short headline — what broke
 * @param {string} msg.body     one or two lines of detail
 * @param {'critical'|'warning'|'info'} [msg.severity]
 * @param {string[]} [msg.tags] ntfy emoji/tag shortcodes
 * @param {string}  [msg.clickUrl] deep link, e.g. straight to the Mission Control page
 * @returns {Promise<{sent: boolean, skipped?: string, error?: string}>} never throws
 */
async function sendNtfy(msg, overrides = {}) {
    const cfg = resolveConfig(overrides);
    // Fail soft, always. An alerting path that can throw takes down the prober whose whole job
    // is to still be running when other things are not.
    if (!cfg.topic) return { sent: false, skipped: 'NTFY_TOPIC not set' };

    const headers = {
        'Content-Type': 'text/plain; charset=utf-8',
        Title: String(msg.title || 'Baalvion alert').slice(0, 250),
        Priority: String(PRIORITY[msg.severity] ?? PRIORITY.info),
    };
    if (msg.tags?.length) headers.Tags = msg.tags.join(',');
    if (msg.clickUrl) headers.Click = msg.clickUrl;

    try {
        if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
        const res = await fetch(`${cfg.server}/${encodeURIComponent(cfg.topic)}`, {
            method: 'POST',
            headers,
            body: String(msg.body ?? ''),
            signal: AbortSignal.timeout(cfg.timeoutMs),
        });
        if (!res.ok) return { sent: false, error: `ntfy returned HTTP ${res.status}` };
        return { sent: true };
    } catch (err) {
        return { sent: false, error: err.message };
    }
}

/**
 * Dead-man's switch. Every other mechanism here is blind to its own death: if the box dies, the
 * prober dies with it and nothing reports the silence. This pings an external monitor
 * (healthchecks.io or any URL that alerts when it stops being called) on every tick, so absence
 * of a heartbeat becomes the alert.
 */
async function sendHeartbeat(url = process.env.STATUS_HEARTBEAT_URL, timeoutMs = 5000) {
    if (!url) return { sent: false, skipped: 'STATUS_HEARTBEAT_URL not set' };
    try {
        const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(timeoutMs) });
        return res.ok ? { sent: true } : { sent: false, error: `heartbeat returned HTTP ${res.status}` };
    } catch (err) {
        return { sent: false, error: err.message };
    }
}

module.exports = { sendNtfy, sendHeartbeat, isConfigured, resolveConfig, PRIORITY, DEFAULT_SERVER };
