'use strict';
// Fire-and-forget publish onto the platform's baalvion:events Redis Streams bus, so
// audit-service's existing stream consumer picks up community moderation events for the
// tamper-evident cross-domain record — additive to (not a replacement for) the local
// community_moderation_logs table, which stays the fast in-app query path.
//
// Written directly against ioredis rather than @baalvion/events' typed `Events` builders,
// since those are constrained to a fixed `EventType` union in @baalvion/types that doesn't
// (yet) include a `community.*` namespace — adding one there is a shared-package change
// that ripples platform-wide (see Backend/CLAUDE.md) and isn't needed just to emit on the
// wire format audit-service already consumes (`baalvion:events:<type>` channel + XADD onto
// the `baalvion:event_stream` stream, matching Backend/packages/events/src/index.ts).
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const config = require('../config/appConfig');

const STREAM_KEY = 'baalvion:event_stream';

let client = null;
function getClient() {
    if (client) return client;
    try {
        client = new Redis({ host: config.redis.host, port: config.redis.port, lazyConnect: true, maxRetriesPerRequest: 1 });
        client.on('error', () => { /* non-fatal — emission is best-effort */ });
    } catch { client = null; }
    return client;
}

async function emit(type, payload, meta = {}) {
    const event = {
        id: uuidv4(),
        type,
        payload,
        orgId: meta.orgId ?? null,
        userId: meta.userId ?? null,
        timestamp: new Date().toISOString(),
        traceId: meta.traceId ?? uuidv4(),
    };
    const c = getClient();
    if (!c) return;
    const serialized = JSON.stringify(event);
    try {
        await c.connect().catch(() => {});
        await Promise.all([
            c.publish(`baalvion:events:${type}`, serialized),
            c.xadd(STREAM_KEY, '*', 'type', type, 'payload', serialized),
        ]);
    } catch {
        // Best-effort only — never let a bus outage block a membership/moderation write.
    }
}

module.exports = { emit };
