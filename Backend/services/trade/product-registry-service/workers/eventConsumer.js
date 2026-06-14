'use strict';
// product-registry consumes no upstream domain events today; the consumer is wired
// for future external product feeds. Pattern preserved for platform uniformity.
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');

let _subscription = null;
async function dispatch(_eventType, _payload) { /* no inbound handlers yet */ }
async function handle(event) { await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () => dispatch(event.eventType, event.payload || {})); }
async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.product.external.>', config.eventBus.consumerGroup, handle);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }
module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle };
