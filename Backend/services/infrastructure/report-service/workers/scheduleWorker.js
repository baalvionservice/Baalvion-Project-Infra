'use strict';

/**
 * Scheduler tick. Every REPORT_SCHEDULER_TICK_MS it claims due schedules and fires
 * them. A short Redis lock makes the tick safe to run with multiple replicas (only
 * one instance fires a given tick window); without Redis it still runs single-node.
 */

const redis = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const reportService = require('../services/reportService');

let _timer = null;
const LOCK_KEY = 'report-service:scheduler:lock';

async function acquireTickLock(ttlMs) {
    const r = redis.getClient();
    if (!r) return true; // no redis → single node, proceed
    try {
        const ok = await r.set(LOCK_KEY, String(process.pid), 'PX', ttlMs, 'NX');
        return ok === 'OK';
    } catch { return true; }
}

async function tick() {
    try {
        if (!(await acquireTickLock(config.reports.schedulerTickMs - 1000))) return;
        const due = await reportService.dueSchedules(new Date());
        if (!due.length) return;
        logger.info({ count: due.length }, '[report-service] firing due schedules');
        for (const sched of due) {
            const r = await reportService.fireSchedule(sched);
            if (r.status === 'error') logger.warn({ scheduleId: r.scheduleId, err: r.error }, 'scheduled report failed');
        }
    } catch (err) {
        logger.error({ err: err.message }, '[report-service] scheduler tick error');
    }
}

function startScheduler() {
    if (!config.reports.schedulerEnabled) { logger.info('[report-service] scheduler disabled'); return; }
    _timer = setInterval(tick, config.reports.schedulerTickMs);
    if (_timer.unref) _timer.unref();
    logger.info({ tickMs: config.reports.schedulerTickMs }, '[report-service] scheduler started');
}

function stopScheduler() { if (_timer) { clearInterval(_timer); _timer = null; } }

module.exports = { startScheduler, stopScheduler, tick };
