'use strict';
/**
 * Scheduled financial reconciliation sweep.
 *
 * A single BullMQ repeatable job ('reconcile-sweep', cron via RECONCILE_CRON) iterates every
 * active store, runs the reconciliation report, and:
 *   - alerts ops on drift (missing/mismatched ledger entries),
 *   - alerts ops when the ledger is unreachable (posting is likely failing too),
 *   - optionally auto-backfills missing entries (RECONCILE_AUTO_BACKFILL=true) — idempotent.
 *
 * Stores are read from the shared commerce schema (order-service and commerce-service share one
 * database). The whole sweep is fail-open: a per-store error is logged and the sweep continues.
 * Disabled entirely when the ledger is not configured (nothing to reconcile against).
 */
const { Queue, Worker } = require('bullmq');
const { QueryTypes } = require('sequelize');
const config = require('../config/appConfig');
const { sequelize } = require('../models');
const reconciliationService = require('../service/reconciliationService');
const alerts = require('../service/alerts');

const QUEUE_NAME = 'order-reconciliation';
const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password || undefined };

let queue = null;
let worker = null;

async function activeStoreIds() {
    const rows = await sequelize.query(
        `SELECT id FROM commerce.commerce_stores WHERE status = 'active'`,
        { type: QueryTypes.SELECT },
    );
    return rows.map((r) => r.id);
}

function lookbackRange() {
    const to = new Date();
    const from = new Date(to.getTime() - config.reconcile.lookbackDays * 24 * 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
}

/** Reconcile one store; alert + (optionally) backfill on drift. Returns a per-store summary. */
async function reconcileStore(storeId, range) {
    const report = await reconciliationService.report(storeId, range);
    if (!report.ledgerAvailable) {
        await alerts.ledgerUnavailable(storeId, report.reason || 'unreachable');
        return { storeId, ledgerAvailable: false };
    }
    if (!report.balanced) {
        await alerts.reconciliationDrift(storeId, report);
        if (config.reconcile.autoBackfill && report.counts.missing > 0) {
            const result = await reconciliationService.backfill(storeId, range);
            console.info(JSON.stringify({ evt: 'reconcile.backfilled', storeId, ...result }));
            return { storeId, drift: true, backfilled: result };
        }
        return { storeId, drift: true, missing: report.counts.missing, mismatched: report.counts.mismatched };
    }
    return { storeId, balanced: true };
}

/**
 * Gateway "paid-but-pending" sweep across all active stores (PR3). Each store's pending payments are
 * polled against the PSP and settled via the idempotent capture path. Per-store failures are isolated.
 */
async function runPendingSweep() {
    const storeIds = await activeStoreIds();
    let settled = 0;
    let errors = 0;
    for (const storeId of storeIds) {
        try {
            const r = await reconciliationService.sweepPendingPayments(storeId, {
                graceMinutes: config.reconcile.gatewayGraceMinutes,
                windowHours: config.reconcile.gatewayWindowHours,
                delayMs: config.reconcile.gatewayDelayMs,
            });
            settled += r.settled;
            errors += r.errors;
        } catch (err) {
            errors += 1;
            console.error(JSON.stringify({ evt: 'pending_sweep.store_failed', storeId, error: err.message }));
        }
    }
    console.info(JSON.stringify({ evt: 'pending_sweep.sweep_complete', stores: storeIds.length, settled, errors }));
    return { stores: storeIds.length, settled, errors };
}

/** Sweep all active stores. Per-store failures are isolated. */
async function runSweep() {
    const range = lookbackRange();
    const storeIds = await activeStoreIds();
    let drifted = 0;
    let failed = 0;
    for (const storeId of storeIds) {
        try {
            const r = await reconcileStore(storeId, range);
            if (r.drift || r.ledgerAvailable === false) drifted += 1;
        } catch (err) {
            failed += 1;
            console.error(JSON.stringify({ evt: 'reconcile.store_failed', storeId, error: err.message }));
        }
    }
    console.info(JSON.stringify({ evt: 'reconcile.sweep_complete', stores: storeIds.length, drifted, failed }));
    return { stores: storeIds.length, drifted, failed };
}

/**
 * Start the reconciliation worker and register the repeatable sweep. No-op (logged) when the
 * sweep is disabled or the ledger is unconfigured. Call once from index.js after the DB is up.
 */
async function startReconciliationWorker() {
    if (!config.reconcile.enabled) {
        console.info('[Reconcile] disabled (RECONCILE_ENABLED=false)');
        return;
    }
    const wantLedgerSweep = config.ledger.enabled;
    const wantGatewaySweep = config.reconcile.gatewayEnabled;
    // Preserve prior behaviour: with the gateway sweep off (default) and no ledger, do nothing.
    if (!wantLedgerSweep && !wantGatewaySweep) {
        console.info('[Reconcile] skipped — ledger not configured and gateway sweep disabled');
        return;
    }
    queue = new Queue(QUEUE_NAME, { connection });
    worker = new Worker(QUEUE_NAME, async (job) => {
        if (job.name === 'reconcile-sweep') return runSweep();
        if (job.name === 'reconcile-store') return reconcileStore(job.data.storeId, lookbackRange());
        if (job.name === 'pending-sweep') return runPendingSweep();
        return null;
    }, { connection });

    worker.on('failed', (job, err) => console.error(`[Reconcile] job ${job?.id} failed:`, err.message));

    // Register the ledger reconciliation sweep (idempotent: a fixed jobId/cron upserts the schedule).
    if (wantLedgerSweep) {
        await queue.add('reconcile-sweep', {}, {
            repeat: { pattern: config.reconcile.cron },
            jobId: 'reconcile-sweep',
            removeOnComplete: 50,
            removeOnFail: 50,
        });
        console.info(`[Reconcile] ledger sweep scheduled '${config.reconcile.cron}' (autoBackfill=${config.reconcile.autoBackfill})`);
    }
    // Register the gateway "paid-but-pending" sweep — behind RECONCILE_GATEWAY_ENABLED (off by default).
    if (wantGatewaySweep) {
        await queue.add('pending-sweep', {}, {
            repeat: { pattern: config.reconcile.gatewayCron },
            jobId: 'pending-sweep',
            removeOnComplete: 50,
            removeOnFail: 50,
        });
        console.info(`[Reconcile] gateway pending-sweep scheduled '${config.reconcile.gatewayCron}'`);
    }
}

module.exports = { startReconciliationWorker, runSweep, runPendingSweep, reconcileStore, QUEUE_NAME };
