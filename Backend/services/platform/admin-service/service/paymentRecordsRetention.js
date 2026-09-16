'use strict';
/**
 * Scheduled retention sweep for `admin.payment_records`.
 *
 * The read model is derived — every row can be rebuilt from the events that produced it — so old
 * rows are safe to archive. Left unattended it grows forever, and the panel's indexes with it.
 *
 * Three properties make an unattended deleter of financial records acceptable:
 *
 *   1. OFF unless a retention window is set. There is no default number of days, because there
 *      is no number of days that is right for a business the service does not know about.
 *   2. A hard floor. A typo of `30` where `730` was meant would silently delete two years of
 *      history on the next tick; anything under MIN_RETENTION_DAYS refuses to start and says so.
 *   3. One sweeper at a time. A Postgres advisory lock means N console instances do not run N
 *      concurrent deletes over the same rows.
 *
 * Deletes in bounded batches with a cap per tick, so a first run against a large table cannot
 * hold a long transaction or saturate the database.
 */
const logger = require('../utils/logger');
const records = require('./paymentRecordsService');
const db = () => require('../models');

// A retention window shorter than a year is almost never intended for financial records, and
// the sweep cannot ask. Refuse and let an operator raise it deliberately.
const MIN_RETENTION_DAYS = 365;

// Advisory lock key — arbitrary but fixed, and namespaced so it cannot collide with another job.
const LOCK_KEY = 8_421_507;

let timer = null;
let running = false;
let sweeping = false;

function config(env = process.env) {
    const raw = env.PAYMENT_RECORDS_RETENTION_DAYS;
    if (!raw || String(raw).trim() === '') return { enabled: false };

    const days = Number(raw);
    if (!Number.isFinite(days) || !Number.isInteger(days) || days < MIN_RETENTION_DAYS) {
        return {
            enabled: false,
            error: `PAYMENT_RECORDS_RETENTION_DAYS must be a whole number of days >= ${MIN_RETENTION_DAYS}, got "${raw}"`,
        };
    }
    const num = (value, fallback, min, max) => {
        const n = Number(value);
        return Number.isFinite(n) && n >= min && n <= max ? Math.floor(n) : fallback;
    };
    return {
        enabled: true,
        days,
        intervalMs: num(env.PAYMENT_RECORDS_RETENTION_INTERVAL_HOURS, 24, 1, 24 * 30) * 60 * 60 * 1000,
        batch: num(env.PAYMENT_RECORDS_RETENTION_BATCH, 5000, 1, 100000),
        maxBatches: num(env.PAYMENT_RECORDS_RETENTION_MAX_BATCHES, 20, 1, 1000),
    };
}

/** Only one instance sweeps. Returns false when another already holds the lock. */
async function acquireLock() {
    const [[row]] = await db().sequelize.query('SELECT pg_try_advisory_lock($1) AS locked', { bind: [LOCK_KEY] });
    return row && row.locked === true;
}

async function releaseLock() {
    await db().sequelize.query('SELECT pg_advisory_unlock($1)', { bind: [LOCK_KEY] }).catch(() => {});
}

/**
 * One pass. Deletes in batches until a batch comes back short (nothing left) or the per-tick
 * cap is reached — the cap is what stops a first run against years of history from becoming one
 * enormous delete.
 */
async function sweepOnce(cfg = config()) {
    if (!cfg.enabled) return { swept: false, reason: cfg.error || 'not_configured' };
    if (sweeping) return { swept: false, reason: 'already_running' };
    sweeping = true;
    try {
        if (!(await acquireLock())) return { swept: false, reason: 'lock_held_elsewhere' };
        try {
            const before = await records.retentionReport({ olderThanDays: cfg.days });
            let pruned = 0;
            let batches = 0;
            for (; batches < cfg.maxBatches; batches += 1) {
                const res = await records.pruneOlderThan({ olderThanDays: cfg.days, confirm: true, limit: cfg.batch });
                pruned += res.pruned;
                if (res.pruned < cfg.batch) break;
            }
            const remaining = Math.max(before.eligibleForArchive - pruned, 0);
            logger.info(
                { pruned, batches, olderThanDays: cfg.days, remaining, tableSize: before.tableSize },
                '[payment-retention] sweep complete',
            );
            return { swept: true, pruned, batches, remaining, olderThanDays: cfg.days };
        } finally {
            await releaseLock();
        }
    } catch (err) {
        // Never fatal: the console must keep serving even if retention cannot run.
        logger.error({ err: err.message }, '[payment-retention] sweep failed');
        return { swept: false, reason: 'error', error: err.message };
    } finally {
        sweeping = false;
    }
}

function startRetentionSweep(env = process.env) {
    if (running) return { started: false, reason: 'already_running' };
    const cfg = config(env);
    if (!cfg.enabled) {
        if (cfg.error) logger.error({ err: cfg.error }, '[payment-retention] refusing to start');
        return { started: false, reason: cfg.error || 'not_configured' };
    }
    running = true;

    // First sweep is delayed by a random slice of the interval so that a fleet restarting
    // together does not have every instance contend for the lock at the same instant.
    const jitter = Math.floor(Math.random() * Math.min(cfg.intervalMs, 5 * 60 * 1000));
    const tick = () => { void sweepOnce(cfg); };
    timer = setTimeout(function first() {
        tick();
        timer = setInterval(tick, cfg.intervalMs);
        if (timer.unref) timer.unref();
    }, jitter);
    if (timer.unref) timer.unref(); // never hold the process open

    logger.info({ olderThanDays: cfg.days, intervalHours: cfg.intervalMs / 3600000 }, '[payment-retention] scheduled');
    return { started: true, olderThanDays: cfg.days };
}

function stopRetentionSweep() {
    if (timer) { clearTimeout(timer); clearInterval(timer); timer = null; }
    running = false;
}

module.exports = { startRetentionSweep, stopRetentionSweep, sweepOnce, config, MIN_RETENTION_DAYS };
