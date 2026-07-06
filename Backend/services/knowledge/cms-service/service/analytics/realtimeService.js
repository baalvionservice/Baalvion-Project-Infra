'use strict';
/**
 * Realtime fanout over Redis pub/sub, sharded by website_id.
 *
 * The ingest worker publishes a compact message per persisted event; the SSE
 * endpoint subscribes per website and streams to connected dashboards. One shared
 * subscriber connection multiplexes all website channels. Fully fail-open — if
 * Redis is unavailable, realtime silently degrades and the dashboard falls back
 * to its polling query.
 */
const { getRedis, getSubscriber } = require('./redisClient');

const channelFor = (websiteId) => `an:rt:${websiteId}`;

/** Publish a persisted event to its website channel (fire-and-forget). */
async function publish(evt) {
    try {
        const msg = JSON.stringify({
            event: evt.event,
            page: evt.page || null,
            ts: evt.occurredAt,
            module: evt.module,
            country: (evt.geo && evt.geo.country) || null,
        });
        await getRedis().publish(channelFor(evt.websiteId), msg);
    } catch {
        /* fail-open */
    }
}

/**
 * Subscribe to a website's realtime stream. `onMessage(obj)` is called per event.
 * Returns an unsubscribe function that detaches this listener.
 */
function subscribe(websiteId, onMessage) {
    const sub = getSubscriber();
    const ch = channelFor(websiteId);
    const handler = (incoming, payload) => {
        if (incoming !== ch) return;
        try { onMessage(JSON.parse(payload)); } catch { /* ignore malformed */ }
    };
    sub.subscribe(ch).catch(() => { /* fail-open */ });
    sub.on('message', handler);
    return () => { try { sub.off('message', handler); } catch { /* noop */ } };
}

module.exports = { publish, subscribe, channelFor };
