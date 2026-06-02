'use strict';

/**
 * Webhook delivery worker. Every WEBHOOK_TICK_MS it claims due deliveries
 * (pending/retrying with next_attempt_at ≤ now) and attempts each. A short Redis
 * lock keeps multiple replicas from double-sending the same tick window.
 */

const redis = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const webhookService = require('../services/webhookService');

let _timer = null;
const LOCK_KEY = 'developer-service:delivery:lock';

async function acquireTickLock(ttlMs) {
    const r = redis.getClient();
    if (!r) return true;
    try { return (await r.set(LOCK_KEY, String(process.pid), 'PX', ttlMs, 'NX')) === 'OK'; }
    catch { return true; }
}

async function tick() {
    try {
        if (!(await acquireTickLock(Math.max(1000, config.webhooks.tickMs - 500)))) return;
        const due = await webhookService.dueDeliveries(new Date(), 50);
        if (!due.length) return;
        for (const del of due) {
            const r = await webhookService.attemptDelivery(del);
            if (r.status === 'failed') logger.warn({ deliveryId: r.id, statusCode: r.statusCode }, 'webhook delivery exhausted retries');
        }
    } catch (err) {
        logger.error({ err: err.message }, '[developer-service] delivery tick error');
    }
}

function startDeliveryWorker() {
    if (!config.webhooks.deliveryEnabled) { logger.info('[developer-service] webhook delivery disabled'); return; }
    _timer = setInterval(tick, config.webhooks.tickMs);
    if (_timer.unref) _timer.unref();
    logger.info({ tickMs: config.webhooks.tickMs }, '[developer-service] webhook delivery worker started');
}

function stopDeliveryWorker() { if (_timer) { clearInterval(_timer); _timer = null; } }

module.exports = { startDeliveryWorker, stopDeliveryWorker, tick };
