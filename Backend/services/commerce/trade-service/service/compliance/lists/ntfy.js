'use strict';
/**
 * Minimal ntfy publisher for the sanctions-list alerts.
 *
 * The platform has a shared publisher (packages/notify-ntfy), but the architecture contract
 * (C2) forbids a service importing across its boundary into packages/, and depending on it
 * properly would change the lockfile and need a full backend image rebuild. The wire format
 * is one HTTP POST, so this keeps the same environment variables and behaviour instead:
 * NTFY_TOPIC, NTFY_SERVER, NTFY_TOKEN. It never throws — an alerting path that can throw
 * takes down the job it is reporting on.
 */
const PRIORITY = { critical: 5, warning: 4, info: 3 };

function resolveConfig(env = process.env) {
    return {
        topic: env.NTFY_TOPIC || null,
        server: String(env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/+$/, ''),
        token: env.NTFY_TOKEN || null,
        timeoutMs: Number(env.NTFY_TIMEOUT_MS) || 5000,
    };
}

async function sendNtfy(msg, { env = process.env, fetchImpl = fetch } = {}) {
    const cfg = resolveConfig(env);
    if (!cfg.topic) return { sent: false, skipped: 'NTFY_TOPIC not set' };
    const headers = {
        'Content-Type': 'text/plain; charset=utf-8',
        Title: String(msg.title || 'Baalvion alert').slice(0, 250),
        Priority: String(PRIORITY[msg.severity] ?? PRIORITY.info),
    };
    if (msg.tags && msg.tags.length) headers.Tags = msg.tags.join(',');
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
    try {
        const res = await fetchImpl(`${cfg.server}/${encodeURIComponent(cfg.topic)}`, {
            method: 'POST', headers, body: String(msg.body ?? ''), signal: AbortSignal.timeout(cfg.timeoutMs),
        });
        return res.ok ? { sent: true } : { sent: false, error: `ntfy returned HTTP ${res.status}` };
    } catch (err) {
        return { sent: false, error: err.message };
    }
}

/** Dead-man's switch ping: an external monitor alerts when these stop arriving. */
async function sendHeartbeat(url, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
    if (!url) return { sent: false, skipped: 'heartbeat URL not set' };
    try {
        const res = await fetchImpl(url, { method: 'POST', signal: AbortSignal.timeout(timeoutMs) });
        return res.ok ? { sent: true } : { sent: false, error: `heartbeat returned HTTP ${res.status}` };
    } catch (err) {
        return { sent: false, error: err.message };
    }
}

module.exports = { sendNtfy, sendHeartbeat, resolveConfig, PRIORITY };
