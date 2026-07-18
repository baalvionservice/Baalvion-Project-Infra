'use strict';
// Fans chat messages out to realtime-service's connected sockets over the plain
// `baalvion:events` pub/sub channel — the wire format realtime-service/index.js's
// subscriber expects: { namespace, room, type, data }. This is deliberately a
// DIFFERENT channel/shape than eventsClient.js's `baalvion:events:<type>` + XADD stream
// (that one feeds audit-service's tamper-evident log, not live WS fan-out) — see
// eventsClient.js's header comment for why the two buses aren't interchangeable.
const Redis = require('ioredis');
const config = require('../config/appConfig');

const CHANNEL = 'baalvion:events';

let client = null;
function getClient() {
    if (client) return client;
    try {
        client = new Redis({ host: config.redis.host, port: config.redis.port, lazyConnect: true, maxRetriesPerRequest: 1 });
        client.on('error', () => { /* non-fatal — fan-out is best-effort; REST read path still works */ });
    } catch { client = null; }
    return client;
}

async function publishToRoom(namespace, room, type, data) {
    const c = getClient();
    if (!c) return;
    try {
        await c.connect().catch(() => {});
        await c.publish(CHANNEL, JSON.stringify({ namespace, room, type, data }));
    } catch {
        // Best-effort — a dropped fan-out event doesn't lose the message (it's already
        // persisted before this is called), it just means live listeners miss the push
        // and pick it up on their next history poll/reconnect.
    }
}

module.exports = { publishToRoom };
