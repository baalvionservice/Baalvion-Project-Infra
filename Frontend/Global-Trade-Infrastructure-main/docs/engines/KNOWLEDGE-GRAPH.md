# Knowledge Graph — Phase 1 (Module 7)

> **Status:** ✅ Implemented & tested (traversal service + Graph API; integration
> tests green on real PostgreSQL).
> **Principle:** *Reuse, don't duplicate.* There is **no separate graph store** —
> the graph **is** the `gckb_records` (nodes) and `gckb_relationships` (typed,
> directed edges) that every registry already writes. This module adds a
> read-only, tenant-scoped traversal layer over them.

Every Phase-1 module emits typed edges into `gckb_relationships` (a product is
`MANUFACTURED_BY` a manufacturer and `CLASSIFIED_UNDER_HS` an HS code; an
organization `SUPPLIES` a buyer and `HOLDS_CERTIFICATE`; a certificate type is
`ISSUED_BY` an authority and `VERIFIED_BY_WORKFLOW`; a policy is `ENFORCED_BY_RULE`
…). The Knowledge Graph connects them: **organizations, products, rules,
countries, documents, certificates, ports, authorities, users** and more.

---

## 1. Architecture

| Layer | File | Responsibility |
|------|------|----------------|
| Repository | `src/server/repositories/knowledge-graph-repository.ts` | Tenant-scoped, batched reads of nodes + outgoing/incoming edges. New, additive — existing repos untouched. |
| Service | `src/server/gckb/knowledge-graph.ts` | `getNode`, bounded BFS `traverse`, `shortestPath`. Pure traversal over the repo. |
| API | `src/app/api/gckb/graph/[id]/route.ts` | `GET` the reachable subgraph, principal-scoped. |

Nodes are mapped to a lean shape (`id, entityType, domain, recordKey, name,
status`); the `domain` is resolved from the registry, so the graph is
self-describing across all entity types.

---

## 2. Traversal model

- **Direction** — `out` (follow `fromId → toId`), `in` (`toId → fromId`), or `both`.
- **Depth** — breadth-first to `depth` hops (1–6, hard-capped).
- **Relation filter** — restrict to a set of `relationType`s.
- **Safety** — `maxNodes` cap (default 250); `truncated` flags early stop.
- **Tenant scope** — every node and edge read is scoped to the global baseline ⊕
  the caller's tenant, so a tenant can never traverse into another tenant's graph
  (enforced + tested).

Internal edges (`toId`) are traversable; external-reference edges (`toRef`, e.g.
to a `rule` or `trade`) are surfaced on the edge but not expanded.

---

## 3. Service API

| Function | Returns |
|----------|---------|
| `getNode(orgId, id)` | `{ node, edges[], neighbours[] }` — a node + its immediate edges and resolved neighbours |
| `traverse(orgId, id, { depth, direction, relationTypes, maxNodes })` | `Subgraph { root, nodes[], edges[], truncated }` |
| `shortestPath(orgId, fromId, toId, { direction, maxDepth })` | ordered node-id path, or null if unreachable |

---

## 4. Graph API

```
GET /api/gckb/graph/{id}?depth=2&direction=both&relationType=MANUFACTURED_BY,CLASSIFIED_UNDER_HS&maxNodes=200
→ 200 { success, data: { root, nodes[], edges[], truncated }, error: null }
→ 404 when the node is absent or out of the caller's tenant scope
```

### OpenAPI (fragment)

```yaml
openapi: 3.0.3
info: { title: Knowledge Graph API, version: "1.0" }
paths:
  /api/gckb/graph/{id}:
    get:
      summary: Reachable subgraph from a node
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
        - { name: depth, in: query, schema: { type: integer, minimum: 1, maximum: 6 } }
        - { name: direction, in: query, schema: { type: string, enum: [out, in, both] } }
        - { name: relationType, in: query, schema: { type: string, description: "comma-separated" } }
        - { name: maxNodes, in: query, schema: { type: integer } }
      responses:
        "200": { description: Subgraph }
        "404": { description: Node not found / not in tenant scope }
```

---

## 5. Events / Audit

The graph is derived from `gckb_relationships`, whose creation already emits the
owning record's lifecycle events and audit rows (via `gckbService`). Traversal is
read-only and side-effect-free; no new events are introduced.

---

## 6. Testing

```bash
npx vitest run src/server/gckb/__tests__/knowledge-graph.integration.test.ts
```

Builds a cross-domain graph (organization → product → manufacturer / HS code)
from the real registries and asserts: neighbour lookup, bounded traversal,
relation-type filtering, shortest path, and RLS scoping (a second tenant cannot
traverse a private graph).

---

## 7. Scope boundary

**In this module:** the traversal repository, the graph service (`getNode`,
`traverse`, `shortestPath`), the Graph API route, integration tests, this doc.

**Reused, not duplicated:** the graph is the existing `gckb_records` +
`gckb_relationships`; no parallel graph database.

**Deliberately not here:** external-reference (`toRef`) expansion into
non-GCKB subsystems (trades, rules) beyond surfacing the edge; graph analytics /
centrality metrics (a later phase).
