'use strict';
/**
 * Drains marketplace.audit_outbox into audit-service.
 *
 * At-least-once: a row is only marked `sent` once audit-service has accepted it. A failure
 * increments `attempts` and records the error, and the row is retried on the next tick — an
 * outage delays the trail rather than losing it. audit-service hash-chains what it receives, so
 * a duplicate on retry is visible as a duplicate rather than corrupting the chain.
 *
 * Runs outside the request lifecycle, so it uses the un-routed query (no tenant transaction).
 */
const db = require('../models');
const { setAuditUndelivered } = require('../middleware/metrics');

const AUDIT_URL = process.env.AUDIT_SERVICE_URL || 'http://127.0.0.1:3032';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || process.env.INTERNAL_SERVICE_SECRET || '';
const INTERVAL_MS = Number(process.env.AUDIT_RELAY_INTERVAL_MS || 5000);
const BATCH = Number(process.env.AUDIT_RELAY_BATCH || 100);
const TIMEOUT_MS = Number(process.env.AUDIT_TIMEOUT_MS || 5000);
// Keep retrying well past a long outage, but stop eventually so one poison row cannot spin.
const MAX_ATTEMPTS = Number(process.env.AUDIT_RELAY_MAX_ATTEMPTS || 50);

const q = (sql, opts) => (db.sequelize.__origQuery || db.sequelize.query.bind(db.sequelize))(sql, opts);

let timer = null;
let draining = false;

async function post(payload) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${AUDIT_URL}/api/v1/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-key': INTERNAL_KEY },
            body: JSON.stringify(payload),
            signal: ctl.signal,
        });
        if (!res.ok) throw new Error(`audit-service ${res.status}`);
    } finally {
        clearTimeout(t);
    }
}

async function drainOnce() {
    if (draining) return { sent: 0, failed: 0 };
    draining = true;
    let sent = 0; let failed = 0;
    try {
        const [rows] = await q(
            `SELECT id, payload FROM marketplace.audit_outbox
              WHERE status <> 'sent' AND attempts < $max
              ORDER BY created_at ASC LIMIT $batch`,
            { bind: { max: MAX_ATTEMPTS, batch: BATCH } },
        );
        for (const row of rows || []) {
            try {
                await post(row.payload);
                await q(`UPDATE marketplace.audit_outbox SET status='sent', delivered_at=now(), attempts=attempts+1 WHERE id=$id`,
                    { bind: { id: row.id } });
                sent++;
            } catch (err) {
                await q(`UPDATE marketplace.audit_outbox SET status='failed', attempts=attempts+1, last_error=$e WHERE id=$id`,
                    { bind: { id: row.id, e: String(err.message).slice(0, 500) } });
                failed++;
                break; // sink is down — stop hammering it, the next tick retries
            }
        }
    } catch (err) {
        console.error(`[Marketplace] audit relay could not read the outbox — ${err.message}`);
    } finally {
        draining = false;
    }
    await reportExhausted();
    return { sent, failed };
}

// Rows past MAX_ATTEMPTS are skipped by the query above so one poison event cannot spin the
// relay. That guard is right, but it also means those events stay undelivered FOREVER and,
// without this, silently — the outbox exists precisely so an audit event is never quietly lost.
// Surface them on a cooldown so the log says it periodically, not every tick.
let lastExhaustedWarn = 0;
async function reportExhausted() {
    const COOLDOWN_MS = Number(process.env.AUDIT_RELAY_WARN_INTERVAL_MS || 300000);
    if (Date.now() - lastExhaustedWarn < COOLDOWN_MS) return;
    try {
        const [rows] = await q(
            `SELECT count(*)::int AS n, min(id) AS first_id, max(last_error) AS err
               FROM marketplace.audit_outbox WHERE status <> 'sent' AND attempts >= $max`,
            { bind: { max: MAX_ATTEMPTS } },
        );
        const n = rows && rows[0] ? rows[0].n : 0;
        setAuditUndelivered(n);   // alert on this being non-zero: the trail has a hole
        if (n > 0) {
            lastExhaustedWarn = Date.now();
            console.error(
                `[Marketplace] AUDIT EVENTS UNDELIVERED: ${n} outbox row(s) exhausted ${MAX_ATTEMPTS} attempts and are no longer retried. `
                + `First id ${rows[0].first_id}. Last error: ${rows[0].err}. `
                + `Fix the sink, then requeue: UPDATE marketplace.audit_outbox SET attempts = 0, status = 'pending' WHERE status <> 'sent';`,
            );
        }
    } catch { /* the drain already reported an unreadable outbox */ }
}

function startAuditRelay() {
    if (timer) return timer;
    timer = setInterval(() => { drainOnce().catch(() => {}); }, INTERVAL_MS);
    if (timer.unref) timer.unref();
    return timer;
}

function stopAuditRelay() {
    if (timer) { clearInterval(timer); timer = null; }
}

module.exports = { startAuditRelay, stopAuditRelay, drainOnce, reportExhausted };
