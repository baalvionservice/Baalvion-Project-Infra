'use strict';
/**
 * Projects authoritative domain rows (from the event bus) into graph nodes/edges.
 * The graph is a derived read model — never a system of record.
 */
const { write } = require('../config/neo4j');
const { NODE_LABELS, EDGE_TYPES } = require('../graph/queries');

async function upsertNode(label, id, props = {}) {
    if (!NODE_LABELS.has(label)) throw new Error(`unknown label ${label}`);
    await write(`MERGE (n:${label} {id:$id}) SET n += $props`, { id: String(id), props });
}

async function upsertEdge(type, fromId, toId, props = {}) {
    if (!EDGE_TYPES.has(type)) throw new Error(`unknown edge ${type}`);
    await write(
        `MATCH (a {id:$fromId}), (b {id:$toId}) MERGE (a)-[r:${type}]->(b) SET r += $props`,
        { fromId: String(fromId), toId: String(toId), props },
    );
}

module.exports = { upsertNode, upsertEdge };
