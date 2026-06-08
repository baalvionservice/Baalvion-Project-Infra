'use strict';
/**
 * Redis Streams consumer (sdk.events.subscribe). Reacts to finance events that
 * arrive over the bus (in addition to the HMAC webhook bridge) and to upstream
 * domain events. Idempotent via the SDK event id; throwing leaves the entry pending
 * for XAUTOCLAIM redelivery (at-least-once).
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { orderTransitionFor } = require('../services/orderSaga');
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');

let _subscription = null;

async function dispatch(eventType, payload) {
    const tr = orderTransitionFor(eventType);
    if (!tr) return; // not an event we cascade off the bus
    const orderId = payload.orderId || payload.order_id;
    if (!orderId) return;
    await runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
            const order = await db.Order.findByPk(String(orderId), { transaction: t });
            if (!order) return;
            order.payment_status = tr.payment_status;
            if (tr.order_status) order.status = tr.order_status;
            await order.save({ transaction: t });
            await db.OrderSagaState.upsert({ order_id: String(order.id), tenant_id: order.tenant_id, state: tr.state, last_event: eventType, updated_at: new Date() }, { transaction: t });
        }));
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, event.payload || {}));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('payments.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }

module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
