'use strict';
/**
 * Allowlisted, parameterized Cypher. No free-form Cypher reaches the driver — the
 * /query endpoint dispatches by template key only (injection-safe). Every read is
 * tenant-scoped by orgId unless the caller bypasses (super_admin).
 */
const NODE_LABELS = new Set(['Organization', 'Person', 'Product', 'Shipment', 'Bank', 'SanctionedEntity']);
const EDGE_TYPES = new Set(['SUPPLIES', 'BUYS_FROM', 'OWNS', 'SHIPPED', 'BANKS_WITH', 'DIRECTOR_OF', 'MATCHES_SANCTION']);

// F5: Neo4j does NOT allow a parameter inside a variable-length bound (`[*..$n]`)
// — it is a Cypher syntax error. The bound must be a literal, so we sanitize the
// caller value to a clamped integer and inline it. Injection-safe: the result is
// always an integer in [1, max].
const clampHops = (value, fallback, max) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(n, max);
};

const TEMPLATES = Object.freeze({
    neighbors: ({ id, direction = 'both' }) => {
        const pat = direction === 'out' ? '(n {id:$id})-[r]->(m)'
            : direction === 'in' ? '(n {id:$id})<-[r]-(m)'
                : '(n {id:$id})-[r]-(m)';
        return { cypher: `MATCH ${pat} WHERE (n.orgId = $orgId OR $bypass) RETURN type(r) AS rel, m LIMIT 200`, params: {} };
    },
    shortestPath: ({ maxHops } = {}) => {
        const hops = clampHops(maxHops, 6, 10);
        return {
            cypher: `MATCH (a {id:$fromId}), (b {id:$toId}),
                     p = shortestPath((a)-[*..${hops}]-(b))
                     WHERE (a.orgId = $orgId OR $bypass)
                     RETURN [x IN nodes(p) | x.id] AS nodeIds, length(p) AS hops`,
            params: {},
        };
    },
    sanctionPath: ({ maxHops } = {}) => {
        const hops = clampHops(maxHops, 4, 8);
        return {
            cypher: `MATCH (o:Organization {id:$orgId}),
                     p = shortestPath((o)-[*..${hops}]-(x:SanctionedEntity))
                     RETURN [n IN nodes(p) | coalesce(n.id, n.name)] AS path,
                            reduce(s = 0.0, r IN relationships(p) | s + coalesce(r.score, 0)) AS score
                     ORDER BY score DESC LIMIT 5`,
            params: {},
        };
    },
});

module.exports = { NODE_LABELS, EDGE_TYPES, TEMPLATES, clampHops };
