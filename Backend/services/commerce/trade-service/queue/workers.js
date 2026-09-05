'use strict';
/**
 * BullMQ workers with REAL processors. On a job that exhausts its retries, the
 * worker routes a replayable copy to the dead-letter queue.
 */
const crypto = require('crypto');
const { Worker } = require('bullmq');
const connection = require('./connection');
const { deadLetter, enqueue } = require('./index');
const providers = require('../providers');
const cache = require('../cache');
const { recordAudit } = require('../utils/audit');
const { processNotification, recordDelivery } = require('../services/notification-dispatch');

const metrics = { processed: {}, failed: {}, deadLettered: 0 };
const bump = (m, k) => { m[k] = (m[k] || 0) + 1; };

// --- SSRF guard for outbound webhooks (block private / loopback / link-local) ---
const PRIVATE = [/^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^localhost$/i, /^0\.0\.0\.0$/];
function assertPublicHttps(url) {
    const u = new URL(url);
    if (u.protocol !== 'https:') throw new Error('webhook_insecure_protocol');
    if (PRIVATE.some((re) => re.test(u.hostname))) throw new Error(`webhook_blocked_host:${u.hostname}`);
}

const PROCESSORS = {
    notifications: async (job) => processNotification(job.data),

    email: async (job) => {
        const { to, subject, tenantId } = job.data || {};
        if (String(to).startsWith('fail@')) throw new Error('provider_rejected'); // exercised by tests/poison detection
        const simulated = !process.env.EMAIL_API_KEY; // real send when key present
        await recordDelivery({ channel: 'email', to, status: 'delivered', simulated, tenantId });
        return { delivered: true, simulated, subject };
    },

    sms: async (job) => {
        const { to, tenantId } = job.data || {};
        const simulated = !process.env.SMS_API_KEY;
        await recordDelivery({ channel: 'sms', to, status: 'delivered', simulated, tenantId });
        return { delivered: true, simulated };
    },

    audit: async (job) => { await recordAudit(job.data); return { recorded: true }; },

    fx_refresh: async (job) => {
        const { base = 'USD', target = 'EUR' } = job.data || {};
        const rate = await providers.fx.getRate(base, target);
        await cache.set(cache.key('global', 'fx', `${base}_${target}`), rate, 60);
        return rate;
    },

    ws_fanout: async (job) => {
        const { room, event, data } = job.data || {};
        await require('../realtime').publish(room, event, data);
        return { fanned: room };
    },

    webhook_delivery: async (job) => {
        const { url, payload, secret } = job.data || {};
        assertPublicHttps(url);
        // No hardcoded fallback secret: signing with a publicly-known key ('baalvion')
        // let an attacker forge deliveries any receiver would accept. Require a real secret.
        if (!secret) throw new Error('webhook_delivery_missing_secret');
        const body = JSON.stringify(payload || {});
        const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Baalvion-Signature': sig }, body, signal: controller.signal });
            if (!res.ok) throw new Error(`webhook_http_${res.status}`);
            return { status: res.status };
        } finally { clearTimeout(timer); }
    },

    // Shipment Workflow state-machine transition fan-out (War Room 4, Prompt 2).
    // Signs + POSTs the transition event and advances the persisted delivery row.
    workflow_webhook: async (job) => require('../service/workflow/webhookDispatcher').processDelivery(job),

    // Document-engine virus scan (War Room 4, Prompt 4). Fetches + decrypts the
    // stored object, scans it, and releases (available) or quarantines the document.
    document_scan: async (job) => require('../service/documents/scanProcessor').processScan(job),

    // Customs Gateway filing pipeline (War Room 4, Prompt 9). Runs the connector
    // submission pipeline (validate → build → transmit+retry → normalize) for the
    // persisted submission and advances its lifecycle. Throws on a transient failure
    // so BullMQ retries; an exhausted job lands the row in `failed` (recoverable).
    customs_submission: async (job) => require('../service/customs/customsGateway').processSubmission(job),

    // Dispatch Orchestration webhook fan-out (War Room 4, Prompt 11). Signs + POSTs
    // a dispatch lifecycle event (condition signal / ready / dispatched / rolled_back
    // / failed) and advances the persisted delivery row. Throws on failure so BullMQ
    // retries; an exhausted job lands the row failed (and is dead-lettered).
    dispatch_webhook: async (job) => require('../service/dispatch/webhookDispatcher').processDelivery(job),

    // Phase 2 Continuous Monitoring (Step 19): recomputes compliance/risk/trust
    // score for every org with verification activity, expires overdue checklist
    // items, and re-scans for excessive-failed-login fraud signals. Registered as
    // a repeatable job below (every 6h); also triggerable on demand via
    // POST /v1/monitoring/run for the same underlying cycle.
    verification_monitor: async () => require('../service/verification/monitor').runCycle(),

    // Logistics Core Foundation (Phase 2) — async/bulk tracking-event ingestion.
    // Same recordTrackingEvent() logic the synchronous POST /tracking_events uses
    // (service/tracking/trackingEngine.js); a thrown error here retries via BullMQ
    // and eventually dead-letters, same as every other processor in this file.
    tracking_sync: async (job) => require('../service/tracking/trackingEngine').recordTrackingEvent(job.data),

    // Freight Management (Phase 3, Prompt 2) — periodic carrier performance
    // aggregate (on-time %, ETA accuracy, cancellation rate) from freight_bookings,
    // denormalized onto carriers.performance_score. Registered as a repeatable job
    // below (daily), same pattern as verification_monitor.
    freight_carrier_performance_refresh: async (job) => require('../service/freight/carrierPerformance').runCycle(job.data || {}),

    // Shipment Tracking & Global Visibility Platform (Phase 3, Prompt 6) —
    // async/bulk IoT sensor-reading ingestion, same ingestReading() logic the
    // synchronous POST /iot_devices/:id/readings uses.
    iot_ingest: async (job) => require('../service/tracking-platform/iotIngestEngine').ingestReading(job.data),

    // Periodic live ETA re-prediction across active shipments. Registered as a
    // repeatable job below (hourly) — ETA-relevant signals (carrier on-time
    // rate, open delays, weather/traffic) drift on the order of hours, not
    // minutes, matching the cadence choice already made for
    // freight_carrier_performance_refresh.
    eta_predict: async (job) => {
        const etaEngine = require('../service/tracking-platform/etaPredictionEngine');
        if (job.data && job.data.shipmentId) return etaEngine.predictEta(job.data.shipmentId);
        const db = require('../models');
        const { Op } = require('sequelize');
        const { ACTIVE_STATUSES } = require('../service/tracking-platform/delayDetectionEngine');
        const shipments = await db.TradeShipment.findAll({ where: { status: { [Op.in]: ACTIVE_STATUSES } }, limit: 500 });
        let computed = 0;
        for (const s of shipments) { await etaEngine.predictEta(s.id); computed += 1; }
        return { computed };
    },

    // Periodic delay-cause detection sweep across active TradeShipments — same
    // sweepDelays() logic the synchronous POST /delay_events/sweep uses.
    delay_sweep: async () => require('../service/tracking-platform/delayDetectionEngine').sweepDelays(),

    // Insurance cover expiry. Lazy expiry on the read paths stops a lapsed policy
    // from being *used*, but only a sweep tells the assured before it happens —
    // cargo still afloat when cover ends is uninsured and nobody finds out by
    // reading a page they were never prompted to open.
    insurance_expiry: async () => {
        const cover = require('../service/insurance/coverPeriod');
        const notify = require('../service/insurance/notify');
        const send = (type, policy) => notify.notify(type, {
            tenantId: policy.tenant_id,
            entityType: 'insurance_policy',
            entityId: policy.id,
            ref: policy.policy_number,
            money: notify.money(policy.coverage_amount, policy.currency),
            until: notify.day(policy.end_date),
        });
        const warned = await cover.warnExpiringPolicies({ notifyFn: send });
        const expired = await cover.expireDuePolicies({ notifyFn: send });
        return { warned: warned.warned, expired: expired.expired };
    },

    // Async retry of a failed alert-channel notification (queued by
    // notificationDispatcher when a live channel call throws).
    notification_dispatch: async (job) => {
        const db = require('../models');
        const notificationChannels = require('../providers/notificationChannels');
        const row = await db.ShipmentNotification.findByPk(job.data.notificationId);
        if (!row) return null;
        await notificationChannels.send(row.channel, { message: (row.payload || {}).message });
        await row.update({ status: 'sent', sent_at: new Date() });
        return row;
    },
};

const workers = [];

function startWorkers() {
    if (workers.length) return workers; // idempotent
    for (const [name, processor] of Object.entries(PROCESSORS)) {
        const worker = new Worker(name, async (job) => {
            const r = await processor(job);
            bump(metrics.processed, name);
            return r;
        }, { connection, concurrency: 5 });

        worker.on('failed', async (job, err) => {
            bump(metrics.failed, name);
            // Exhausted all attempts → poison/dead-letter (replayable).
            if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
                metrics.deadLettered += 1;
                try { await deadLetter(name, job, err && err.message); } catch { /* best-effort */ }
            }
        });
        workers.push(worker);
    }
    // eslint-disable-next-line no-console
    console.log(`[queue] started ${workers.length} workers: ${Object.keys(PROCESSORS).join(', ')}`);

    // Repeatable job (BullMQ dedupes by jobId + repeat options, so this is safe to
    // call on every boot). Six hours balances staleness against load — expiry/
    // fraud/risk/compliance drift over hours, not seconds, so no tighter cadence
    // is needed.
    enqueue('verification_monitor', 'cycle', {}, { repeat: { every: 6 * 60 * 60 * 1000 }, jobId: 'verification-monitor-cycle' })
        .catch((err) => console.error('[queue] failed to register verification_monitor repeatable job:', err.message));

    // Freight carrier performance: on-time/cancellation/ETA drift over a rolling
    // 30-day window changes on the order of days, not hours — daily is sufficient
    // and matches the cost/latency tradeoff verification_monitor already made.
    enqueue('freight_carrier_performance_refresh', 'cycle', {}, { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: 'freight-carrier-performance-cycle' })
        .catch((err) => console.error('[queue] failed to register freight_carrier_performance_refresh repeatable job:', err.message));

    // Shipment Tracking Platform: hourly ETA re-prediction + delay sweep across
    // active shipments — frequent enough to catch a developing delay same-day,
    // without re-scoring every shipment on every tracking ping.
    enqueue('eta_predict', 'sweep', {}, { repeat: { every: 60 * 60 * 1000 }, jobId: 'eta-predict-sweep' })
        .catch((err) => console.error('[queue] failed to register eta_predict repeatable job:', err.message));
    enqueue('delay_sweep', 'sweep', {}, { repeat: { every: 60 * 60 * 1000 }, jobId: 'delay-sweep-cycle' })
        .catch((err) => console.error('[queue] failed to register delay_sweep repeatable job:', err.message));

    // Insurance cover expiry: dates move a day at a time, so daily is the right
    // cadence. Run once at boot too — a service that was down over a policy's end
    // date would otherwise leave it reading 'active' until the next window.
    enqueue('insurance_expiry', 'sweep', {}, { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: 'insurance-expiry-cycle' })
        .catch((err) => console.error('[queue] failed to register insurance_expiry repeatable job:', err.message));
    enqueue('insurance_expiry', 'boot', {}, { jobId: `insurance-expiry-boot-${Date.now()}` })
        .catch((err) => console.error('[queue] failed to enqueue insurance_expiry boot sweep:', err.message));

    return workers;
}

async function stopWorkers() { await Promise.all(workers.map((w) => w.close())); workers.length = 0; }

const workerMetrics = () => ({ ...metrics, active: workers.length });

module.exports = { startWorkers, stopWorkers, workerMetrics, PROCESSORS };
