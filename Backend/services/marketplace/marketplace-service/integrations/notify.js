'use strict';
/**
 * Deal-room notifications → notification-service.
 *
 * A two-sided room only works if the other side learns something happened. Until now the deal
 * room sent nothing at all: a founder had no way to know an investor had opened a room, asked for
 * documents, or countered their terms — they would only find out by opening the page. That is the
 * difference between a shared workspace and a form.
 *
 * Notifications are advisory, so this is fire-and-forget and never blocks or fails a deal action:
 * failing to send an email must not prevent a term sheet being accepted. That is the opposite of
 * the audit trail (utils/audit.js), which is evidence and therefore goes through a durable outbox.
 * A drop is logged, not swallowed.
 *
 * Idempotency keys are derived from the event so a retry cannot email someone twice.
 */
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3031';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || process.env.INTERNAL_API_KEY || '';
const TIMEOUT_MS = Number(process.env.NOTIFY_TIMEOUT_MS || 3000);
const ENABLED = process.env.DEAL_NOTIFICATIONS !== 'off';

/**
 * @param {object} e
 * @param {string} e.to             recipient email
 * @param {string} e.templateName   notification-service template
 * @param {object} e.data           template variables
 * @param {string} e.idempotencyKey stable per event, so retries collapse
 */
function send(e) {
    if (!ENABLED || !e?.to) return Promise.resolve();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    return fetch(`${NOTIFY_URL}/api/v1/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
        body: JSON.stringify({
            to: e.to,
            templateName: e.templateName,
            data: e.data || {},
            idempotencyKey: e.idempotencyKey,
        }),
        signal: ctl.signal,
    })
        .then((res) => {
            if (!res.ok) console.error(`[Marketplace] notification dropped (${res.status}): ${e.templateName} -> ${e.to}`);
        })
        .catch((err) => console.error(`[Marketplace] notification unreachable: ${e.templateName} — ${err.message}`))
        .finally(() => clearTimeout(timer));
}

module.exports = { send, ENABLED };
