'use strict';
/**
 * Redis Streams consumer — reads from baalvion:events (the same stream
 * notification-service consumes) and syncs short-titled CMS content into the
 * glossary `entities` table. Own consumer group ('imperialpedia-service'), so this
 * service gets its own independent copy of every event.
 *
 * No separate idempotency store: the entities upsert/delete in glossarySyncService
 * is already keyed on the unique (type, slug) constraint, so a redelivered event is
 * a safe no-op on its own — an extra dedup layer would add a redis dependency for
 * no behavioral gain here.
 */
const { initSdk } = require('../platform/sdk');
const config = require('../config/appConfig');
const glossarySyncService = require('../service/glossarySyncService');

let _subscription = null;

async function handle(event) {
    const eventType = event && event.eventType;
    const payload = (event && event.payload) || {};
    switch (eventType) {
        case 'cms.content.published':
            await glossarySyncService.handlePublished(payload);
            break;
        case 'cms.content.unpublished':
            await glossarySyncService.handleUnpublished(payload);
            break;
        default:
        // no handler for other event types — ignore
    }
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('>', config.eventBus.consumerGroup, handle);
    console.log(`[Imperialpedia] event consumer started (group=${config.eventBus.consumerGroup})`);
    return _subscription;
}

async function stopEventConsumer() {
    if (_subscription) {
        await _subscription.unsubscribe();
        _subscription = null;
    }
}

module.exports = { startEventConsumer, stopEventConsumer, handle };
