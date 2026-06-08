'use strict';
/**
 * Reacts to order + quality events: pre-create the draft dossier on order creation,
 * and attach an inspection certificate when a quality inspection passes.
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { runWithTenant } = require('@baalvion/tenancy');
const db = require('../models');

let _subscription = null;

async function ensureDraft(orgId, orderId, docType, metadata = {}) {
    return runWithTenant({ tenantId: orgId, bypass: false }, () => db.sequelize.transaction(async (t) => {
        const [doc] = await db.Document.findOrCreate({
            where: { org_id: orgId, order_id: String(orderId), doc_type: docType, version: 1 },
            defaults: { org_id: orgId, order_id: String(orderId), doc_type: docType, status: 'draft', metadata },
            transaction: t,
        });
        return doc;
    }));
}

async function dispatch(eventType, payload) {
    switch (eventType) {
        case 'gtos.order.created.v1':
            if (payload.orderId) {
                const org = payload.tenantId || payload._tenantId;
                if (org) { await ensureDraft(org, payload.orderId, 'commercial_invoice'); await ensureDraft(org, payload.orderId, 'packing_list'); }
            }
            break;
        case 'gtos.quality.inspection.completed.v1':
            if (payload.passed && payload.orderId && payload.orgId) {
                await ensureDraft(payload.orgId, payload.orderId, 'inspection_cert', { inspectionId: payload.inspectionId });
            }
            break;
        default: break;
    }
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, { ...(event.payload || {}), tenantId: event.tenantId }));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }
module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
