'use strict';
const { tryGetSdk } = require('./sdk');

const GraphEvents = Object.freeze({
    NODE_UPSERTED: 'gtos.graph.node.upserted.v1',
    EDGE_CREATED: 'gtos.graph.edge.created.v1',
});

async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return;
    try { await sdk.events.publish(eventType, payload, meta); }
    catch (err) { try { sdk.logger.warn({ err: err && err.message, eventType }, 'event publish failed'); } catch { /* never throw */ } }
}
const emitSafe = (t, p, m) => { void emit(t, p, m); };

module.exports = { GraphEvents, emit, emitSafe };
