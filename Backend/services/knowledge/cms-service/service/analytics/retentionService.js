'use strict';
/**
 * Partition + retention maintenance (runs in the maintenance worker, nightly).
 *
 *   1. ensure upcoming monthly partitions exist (never insert into DEFAULT)
 *   2. drop event partitions older than the raw-retention window (O(1) reclaim)
 *   3. sweep expired sessions/visitors/provider_metrics/daily rollups
 *
 * rollup_monthly is kept indefinitely. All windows are configurable per-env.
 */
const { QueryTypes } = require('sequelize');
const config = require('../../config/appConfig');
const { logger } = require('../../platform/logger');

async function runMaintenance() {
    await ensureUpcomingPartitions();
    const dropped = await dropExpiredEventPartitions();
    const swept = await sweepRetention();

    // Refresh the internal CMS operational snapshot for every active website
    // (fail-open: a snapshot hiccup must not fail partition/retention upkeep).
    let internalSnapshots = 0;
    try {
        internalSnapshots = await require('../../connectors').syncAllInternal();
    } catch (err) {
        logger('analytics-maintenance').warn({ err: err && err.message }, 'internal_cms snapshot enqueue failed');
    }

    // Reconciliation + anomaly detection (fail-open).
    let anomaliesFlagged = 0;
    try {
        const rec = await require('./reconciliationService').runReconciliation();
        anomaliesFlagged = rec.flagged;
    } catch (err) {
        logger('analytics-maintenance').warn({ err: err && err.message }, 'reconciliation failed');
    }

    logger('analytics-maintenance').info({ dropped, swept, internalSnapshots, anomaliesFlagged }, 'analytics maintenance complete');
    return { dropped, swept, internalSnapshots, anomaliesFlagged };
}

/** Ensure this month + the next two months have partitions. */
async function ensureUpcomingPartitions() {
    const db = require('../../models');
    await db.sequelize.query(`
        DO $do$
        DECLARE m date;
        BEGIN
            FOR m IN
                SELECT generate_series(date_trunc('month', now()),
                                       date_trunc('month', now()) + interval '2 months',
                                       interval '1 month')::date
            LOOP
                PERFORM analytics.ensure_events_partition(m);
            END LOOP;
        END
        $do$;`);
}

/** Drop monthly event partitions whose whole range is older than the raw window. */
async function dropExpiredEventPartitions() {
    const db = require('../../models');
    const retentionDays = config.analytics.retention.rawEventDays;
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

    const parts = await db.sequelize.query(`
        SELECT c.relname
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
        JOIN pg_class p ON p.oid = i.inhparent
        JOIN pg_namespace n ON n.oid = p.relnamespace
        WHERE n.nspname = 'analytics' AND p.relname = 'events'
          AND c.relname ~ '^events_[0-9]{6}$'`,
        { type: QueryTypes.SELECT });

    let dropped = 0;
    for (const { relname } of parts) {
        const y = Number(relname.slice(7, 11));
        const mo = Number(relname.slice(11, 13));
        // Partition covers [firstOfMonth, firstOfNextMonth); safe to drop once its
        // upper bound is entirely before the cutoff.
        const partitionEnd = new Date(Date.UTC(y, mo, 1)); // month is 1-based → Date month index gives next month
        if (partitionEnd <= cutoff) {
            await db.sequelize.query(`DROP TABLE IF EXISTS analytics.${relname}`);
            dropped += 1;
            logger('analytics-maintenance').info({ partition: relname }, 'dropped expired event partition');
        }
    }
    return dropped;
}

/** Delete derived rows older than their retention windows. */
async function sweepRetention() {
    const db = require('../../models');
    const r = config.analytics.retention;
    const del = async (sql, days) => {
        const [, meta] = await db.sequelize.query(sql, { replacements: { days } });
        return (meta && meta.rowCount) || 0;
    };
    return {
        sessions: await del(`DELETE FROM analytics.sessions WHERE started_at < now() - make_interval(days => :days)`, r.sessionDays),
        visitors: await del(`DELETE FROM analytics.visitors WHERE last_seen < now() - make_interval(days => :days)`, r.sessionDays),
        providerMetrics: await del(`DELETE FROM analytics.provider_metrics WHERE period_start < (now() - make_interval(days => :days))::date`, r.providerMetricDays),
        rollupDaily: await del(`DELETE FROM analytics.rollup_daily WHERE day < (now() - make_interval(days => :days))::date`, r.rollupDailyDays),
    };
}

module.exports = { runMaintenance, ensureUpcomingPartitions, dropExpiredEventPartitions, sweepRetention };
