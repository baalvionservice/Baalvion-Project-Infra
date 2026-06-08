'use strict';
/**
 * Auto-schedules a pre-shipment inspection when an order's payment is confirmed.
 * Idempotent via findOrCreate on (org_id, order_id, type).
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { runWithTenant } = require('@baalvion/tenancy');
const db = require('../models');

let _subscription = null;

async function dispatch(eventType, payload) {
    if (eventType !== 'gtos.order.payment_confirmed.v1') return;
    const org = payload.tenantId || payload._tenantId;
    if (!org || !payload.orderId) return;
    await runWithTenant({ tenantId: org, bypass: false }, () => db.sequelize.transaction(async (t) => {
        await db.Inspection.findOrCreate({
            where: { org_id: org, order_id: String(payload.orderId), type: 'pre_shipment' },
            defaults: { org_id: org, order_id: String(payload.orderId), type: 'pre_shipment', status: 'scheduled' },
            transaction: t,
        });
    }));
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, { ...(event.payload || {}), tenantId: event.tenantId }));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.order.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }
module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
