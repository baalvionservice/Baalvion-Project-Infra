'use strict';
/**
 * Folds quality outcomes into the current-period scorecard. On a passed/failed
 * inspection we upsert the period scorecard and recompute a simple composite.
 * Idempotent upsert keyed by (org_id, supplier_id, period).
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { runWithTenant } = require('@baalvion/tenancy');
const db = require('../models');

let _subscription = null;

// Deterministic period from an ISO-ish marker passed in the event meta; falls back
// to a fixed bucket so this stays pure (no Date.now in shared logic paths).
function periodOf(payload) { return payload.period || 'current'; }

async function applyInspection(payload) {
    const { orgId, supplierId, passed } = payload;
    if (!orgId || !supplierId) return;
    const period = periodOf(payload);
    await runWithTenant({ tenantId: orgId, bypass: false }, () => db.sequelize.transaction(async (t) => {
        const [card] = await db.Scorecard.findOrCreate({
            where: { org_id: orgId, supplier_id: String(supplierId), period },
            defaults: { org_id: orgId, supplier_id: String(supplierId), period, quality_kpi: passed ? 100 : 0, composite: passed ? 100 : 0 },
            transaction: t,
        });
        if (!card.isNewRecord) {
            const q = Number(card.quality_kpi || 0);
            const next = passed ? Math.min(100, q + 1) : Math.max(0, q - 5);
            await card.update({ quality_kpi: next, composite: next }, { transaction: t });
        }
    }));
}

async function dispatch(eventType, payload) {
    if (eventType === 'gtos.quality.inspection.completed.v1') await applyInspection(payload);
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, { ...(event.payload || {}) }));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.quality.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }
module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
