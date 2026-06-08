'use strict';
/**
 * Subscribes to authoritative domain events and projects them into the graph.
 * Idempotent (MERGE is upsert); throwing leaves the entry pending for redelivery.
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { upsertNode, upsertEdge } = require('../services/projectionService');

let _subscription = null;

async function dispatch(eventType, payload) {
    switch (eventType) {
        case 'gtos.order.created.v1':
            if (payload.buyerOrgId) await upsertNode('Organization', payload.buyerOrgId, { orgId: payload.buyerOrgId });
            if (payload.sellerOrgId) await upsertNode('Organization', payload.sellerOrgId, { orgId: payload.sellerOrgId });
            if (payload.buyerOrgId && payload.sellerOrgId) await upsertEdge('BUYS_FROM', payload.buyerOrgId, payload.sellerOrgId, {});
            break;
        case 'gtos.product.upserted.v1':
            await upsertNode('Product', payload.productId, { orgId: payload.orgId, sku: payload.sku, hsCode: payload.hsCode });
            if (payload.orgId) await upsertEdge('OWNS', payload.orgId, payload.productId, {});
            break;
        case 'gtos.supplier.stage_changed.v1':
            await upsertNode('Organization', payload.supplierId, { orgId: payload.orgId, stage: payload.toStage });
            break;
        default: break; // not projected
    }
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, event.payload || {}));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'graph event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }

module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
