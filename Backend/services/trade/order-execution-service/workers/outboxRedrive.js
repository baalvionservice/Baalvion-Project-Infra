'use strict';
/**
 * Outbox REDRIVE worker — the recovery half of the outbox reliability story.
 *
 * reconciliation.js DETECTS delivery failures (rows stuck PENDING past a staleness
 * threshold, or parked FAILED) but never acts on them. The relay (outboxPublisher
 * drainOnce) only drains fresh PENDING rows and abandons a row as FAILED after its
 * attempt cap. Nothing ever retries a FAILED row, and a row stuck PENDING (e.g. its
 * owning instance died mid-publish) is only retried whenever the relay happens to
 * pick it up. This worker closes that gap by RE-PUBLISHING such rows through the
 * EXISTING publish path (sdk.events.publish) — it never invents a second bus.
 *
 * MONEY SAFETY: redrive only re-emits the already-persisted outbox event payload.
 * It NEVER recomputes or mutates order money fields — that stays detection-only.
 *
 * Concurrency / idempotency: claiming uses `FOR UPDATE SKIP LOCKED` and a lease
 * (push `available_at` forward at claim time, in the claim's own committed
 * transaction). A second instance's SKIP LOCKED skips locked rows, and once the
 * lease commits the row is no longer due, so two instances cannot publish the same
 * row in the same window. Publishing happens AFTER the claim commits, so a slow bus
 * never holds row locks. Re-delivery is at-least-once; downstream consumers already
 * dedupe on the event id (_eventId), so a duplicate publish on crash-after-publish/
 * before-mark is safe.
 */
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');
const config = require('../config/appConfig');
const { withAdvisoryLock, ADVISORY_LOCK_KEYS } = require('../services/leaderLock');

const REDRIVE_POLL_MS = Number(process.env.OUTBOX_REDRIVE_POLL_MS || 30000);
const REDRIVE_BATCH = Number(process.env.OUTBOX_REDRIVE_BATCH || 50);
// A PENDING row whose available_at is older than this is considered "stuck"
// (its owning publish attempt likely died) and is eligible for redrive.
const STUCK_PENDING_MS = Number(process.env.OUTBOX_REDRIVE_STUCK_MS || 60000);
// FAILED rows are retried only while under this attempt cap; past it they stay
// FAILED and raise an alert for a human/owning process.
const MAX_ATTEMPTS = Number(process.env.OUTBOX_REDRIVE_MAX_ATTEMPTS || 15);
// Lease window: how far forward we push available_at when claiming, so a
// concurrent sweep (or the relay) won't re-pick a row while we publish it.
const LEASE_MS = Number(process.env.OUTBOX_REDRIVE_LEASE_MS || 30000);
// Bounded exponential backoff cap (seconds exponent) when a redrive attempt fails.
const BACKOFF_MAX_EXP = 8;

const backoffMs = (attempts) => 1000 * 2 ** Math.min(Math.max(attempts, 1), BACKOFF_MAX_EXP);

// Sanitize an error message before persisting it as last_error: strip CR/LF/TAB
// (log-injection / row-spoofing into the stored value) and bound its length.
const sanitizeError = (msg, max = 1000) => String(msg).replace(/[\r\n\t]/g, '_').slice(0, max);
const errMessage = (err) => (err && err.message ? err.message : err);

/**
 * Atomically claim a batch of redrive-eligible rows on a dedicated transaction,
 * leasing them forward so no other instance re-picks them. Returns plain row
 * snapshots { id, event_type, payload, tenant_id, status, attempts }.
 *
 * Eligible = (PENDING and available_at < stuck-cutoff) OR (FAILED and attempts < cap).
 */
async function claimRedriveRows({ now, schema, sequelize, Sequelize }) {
    const stuckCutoff = new Date(now - STUCK_PENDING_MS);
    const leaseUntil = new Date(now + LEASE_MS);
    const table = `${schema}.outbox_events`;
    return runWithTenant({ tenantId: null, bypass: true }, () =>
        sequelize.transaction(async (t) => {
            const [claimed] = await sequelize.query(
                `SELECT id, event_type, payload, tenant_id, status, attempts
                   FROM ${table}
                  WHERE (status = 'PENDING' AND available_at < :stuckCutoff)
                     OR (status = 'FAILED'  AND attempts < :maxAttempts)
                  ORDER BY available_at ASC
                  LIMIT :batch
                  FOR UPDATE SKIP LOCKED`,
                {
                    replacements: { stuckCutoff, maxAttempts: MAX_ATTEMPTS, batch: REDRIVE_BATCH },
                    transaction: t,
                    type: Sequelize.QueryTypes.SELECT,
                });
            const rows = Array.isArray(claimed) ? claimed : (claimed ? [claimed] : []);
            if (!rows.length) return [];
            const ids = rows.map((r) => r.id);
            // Lease: push available_at forward and normalise status to PENDING so the
            // relay/this worker treats them as in-flight retries, not parked failures.
            await sequelize.query(
                `UPDATE ${table}
                    SET available_at = :leaseUntil, status = 'PENDING'
                  WHERE id IN (:ids)`,
                { replacements: { leaseUntil, ids }, transaction: t });
            return rows;
        }));
}

/**
 * Mark a successfully re-published row SENT.
 */
async function markSent({ id, schema, sequelize }) {
    return runWithTenant({ tenantId: null, bypass: true }, () =>
        sequelize.query(
            `UPDATE ${schema}.outbox_events
                SET status = 'SENT', sent_at = now(), last_error = NULL
              WHERE id = :id`,
            { replacements: { id } }));
}

/**
 * Record a failed redrive attempt: bump attempts, set bounded backoff on
 * available_at, store last_error. Past the cap, park FAILED (caller emits alert).
 */
async function markRetryOrFail({ row, error, now, schema, sequelize }) {
    const attempts = (Number(row.attempts) || 0) + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    const available_at = failed ? new Date(now) : new Date(now + backoffMs(attempts));
    await runWithTenant({ tenantId: null, bypass: true }, () =>
        sequelize.query(
            `UPDATE ${schema}.outbox_events
                SET attempts = :attempts,
                    status = :status,
                    available_at = :available_at,
                    last_error = :lastError
              WHERE id = :id`,
            {
                replacements: {
                    attempts,
                    status: failed ? 'FAILED' : 'PENDING',
                    available_at,
                    lastError: sanitizeError(errMessage(error)),
                    id: row.id,
                },
            }));
    return { attempts, failed };
}

/**
 * One redrive pass. `publish(type, payload, meta)` is the EXISTING bus publish.
 * Optional `alert(type, payload, meta)` (defaults to publish) emits the
 * exhausted-redrive alert. `deps` allows tests to inject a fake claim/mark layer.
 * Returns a structured summary for callers/tests.
 */
async function redriveOnce(publish, opts = {}) {
    if (typeof publish !== 'function') throw new TypeError('redriveOnce requires a publish(type, payload, meta) function');
    const now = opts.now ?? Date.now();
    const alert = opts.alert ?? publish;
    const schema = opts.schema ?? config.schema;
    const sequelize = opts.sequelize ?? db.sequelize;
    const Sequelize = opts.Sequelize ?? db.Sequelize;
    const deps = opts.deps ?? {};
    const claim = deps.claimRedriveRows ?? claimRedriveRows;
    const onSent = deps.markSent ?? markSent;
    const onRetryOrFail = deps.markRetryOrFail ?? markRetryOrFail;

    const rows = await claim({ now, schema, sequelize, Sequelize });
    let sent = 0; let retried = 0; let exhausted = 0;

    for (const row of rows) {
        try {
            // payload is JSONB and may be a non-object (array/string/null); spreading
            // those would misbehave or throw and exhaust retries on a data-shape error
            // rather than a transient bus error. Wrap non-objects under `_raw`.
            const safePayload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
                ? row.payload
                : { _raw: row.payload };
            await publish(row.event_type, { ...safePayload, _eventId: row.id }, { tenantId: row.tenant_id });
            await onSent({ id: row.id, schema, sequelize });
            sent += 1;
        } catch (err) {
            let outcome;
            try {
                outcome = await onRetryOrFail({ row, error: err, now, schema, sequelize });
            } catch (markErr) {
                // Never swallow silently — surface the bookkeeping failure to stderr.
                process.stderr.write(`[outboxRedrive] failed to record retry for ${row.id}: ${markErr.message}\n`);
                continue;
            }
            if (outcome.failed) {
                exhausted += 1;
                try {
                    await alert('oms.outbox.redrive.exhausted.v1',
                        { outboxId: row.id, eventType: row.event_type, attempts: outcome.attempts, lastError: sanitizeError(errMessage(err), 500) },
                        { tenantId: row.tenant_id });
                } catch (alertErr) {
                    process.stderr.write(`[outboxRedrive] alert emit failed for ${row.id}: ${alertErr.message}\n`);
                }
            } else {
                retried += 1;
            }
        }
    }
    return { claimed: rows.length, sent, retried, exhausted };
}

/**
 * Scheduling wrapper. Runs redriveOnce on an interval, but ONLY on the instance
 * that holds the OUTBOX_REDRIVE advisory lock (leader guard) — others skip cleanly.
 * The lock is in the wrapper, not in redriveOnce, so redriveOnce stays pure/testable.
 */
function startOutboxRedrive(sdk) {
    if (!sdk || !sdk.events) {
        process.stderr.write('[outboxRedrive] no sdk.events — redrive worker not started\n');
        return () => {};
    }
    const publish = (type, payload, meta) => sdk.events.publish(type, payload, meta);
    const tick = async () => {
        try {
            const r = await withAdvisoryLock(db.sequelize, ADVISORY_LOCK_KEYS.OUTBOX_REDRIVE, () => redriveOnce(publish));
            if (r.acquired && r.result && (r.result.sent || r.result.exhausted)) {
                process.stderr.write(`[outboxRedrive] sent=${r.result.sent} retried=${r.result.retried} exhausted=${r.result.exhausted}\n`);
            }
        } catch (e) {
            process.stderr.write(`[outboxRedrive] tick error: ${e.message}\n`);
        }
    };
    const timer = setInterval(tick, REDRIVE_POLL_MS);
    timer.unref();
    return () => clearInterval(timer);
}

module.exports = {
    redriveOnce,
    startOutboxRedrive,
    claimRedriveRows,
    markSent,
    markRetryOrFail,
    backoffMs,
    MAX_ATTEMPTS,
    STUCK_PENDING_MS,
};
