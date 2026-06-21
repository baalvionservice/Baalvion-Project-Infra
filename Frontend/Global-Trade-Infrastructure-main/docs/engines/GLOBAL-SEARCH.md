# Global Search & Metadata — Phase 1 (Module 8)

> **Status:** ✅ Implemented & tested (search service + API; integration tests
> green on real PostgreSQL).
> **Principle:** *Reuse, don't duplicate.* One search surface over every registry
> entity — all of which already live in `gckb_records`. No parallel search index;
> relevance ranking, facets, suggestions and a self-describing metadata catalog
> are computed over the generic store.

Global Search spans **products, organizations, countries, HS codes, certificates,
documents, workflows, authorities, ports, policies** and every other registered
entity, with full-text-style keyword matching, filters, tags, relationship-aware
facets, ranking and type-ahead suggestions.

---

## 1. Architecture

| Layer | File | Responsibility |
|------|------|----------------|
| Repository | `src/server/repositories/global-search-repository.ts` | Tenant-scoped candidate window, accurate count, entity-type facet `groupBy`, prefix suggestions. New, additive. |
| Service | `src/server/gckb/global-search.ts` | Ranking, entity-type + domain facets, suggestions, metadata catalog. |
| API | `src/app/api/gckb/search/route.ts` | One endpoint, three modes (`search` / `suggest` / `metadata`). |

---

## 2. Search

`globalSearchService.search(orgId, { keyword, entityTypes?, domains?, tags?, status?, page?, pageSize? })`:

- **Keyword** matches `name`, `recordKey`, `code`, `hsCode`, `productCategory`
  (case-insensitive `contains`) and exact `tags`.
- **Filters** — restrict to a set of `entityTypes`, whole `domains` (expanded to
  their entity types via the registry), `tags` and `status`.
- **Ranking** — a relevance `score` per hit: exact-name (100) › name-prefix (60) ›
  name-substring (40), plus key/code/HS/category/tag boosts; ties broken by recency.
- **Facets** — accurate counts per `entityType` and per `domain` across the whole
  match set (DB `groupBy`), not just the page.
- **Bound** — ranking runs over a 500-record candidate window; `capped` flags when
  the match set is larger (deep pages then fall back to recency). At-scale full-text
  is a Postgres-FTS follow-up (would add a `tsvector` column + migration — out of
  this no-migration slice).

Returns `{ items[], total, page, pageSize, facets: { entityType[], domain[] }, capped }`.

---

## 3. Suggestions & Metadata

- `suggest(orgId, prefix, limit)` — type-ahead: prefix matches on `name` /
  `recordKey` / `code`, returning `{ id, entityType, name, recordKey }`.
- `metadata(orgId)` — the self-describing catalog: every registered entity type
  grouped by domain with **live counts** (zero-count types included), so a UI can
  build its navigation entirely from data.

---

## 4. API

```
GET /api/gckb/search?q=rice&entityType=product,hs_code&domain=organization&tag=grain&status=PUBLISHED&page=1&pageSize=20
GET /api/gckb/search?mode=suggest&q=Bas&limit=10
GET /api/gckb/search?mode=metadata
```

### OpenAPI (fragment)

```yaml
openapi: 3.0.3
info: { title: Global Search & Metadata API, version: "1.0" }
paths:
  /api/gckb/search:
    get:
      summary: Cross-entity search / suggest / metadata
      parameters:
        - { name: mode, in: query, schema: { type: string, enum: [search, suggest, metadata] } }
        - { name: q, in: query, schema: { type: string } }
        - { name: entityType, in: query, schema: { type: string, description: "comma-separated" } }
        - { name: domain, in: query, schema: { type: string, description: "comma-separated" } }
        - { name: tag, in: query, schema: { type: string, description: "comma-separated" } }
        - { name: status, in: query, schema: { type: string } }
        - { name: page, in: query, schema: { type: integer } }
        - { name: pageSize, in: query, schema: { type: integer } }
      responses:
        "200":
          description: Search result / suggestions / metadata catalog
```

---

## 5. Testing

```bash
npx vitest run src/server/gckb/__tests__/global-search.integration.test.ts
```

Seeds a cross-domain corpus and asserts: cross-entity keyword search, ranking
(every hit scored), entity-type + domain facets, entity-type / domain filters,
type-ahead suggestions, the metadata catalog (with zero-count types), and RLS
tenant scoping.

---

## 6. Scope boundary

**In this module:** the search repository, the search service (search / suggest /
metadata), the API route, integration tests, this doc.

**Reused, not duplicated:** the generic `gckb_records` store and registry config;
no parallel index.

**Deliberately not here:** Postgres full-text (`tsvector`) ranking at very large
scale (a migration-bearing follow-up); cross-subsystem search into non-GCKB tables
(trades, ledger) — those have their own query surfaces.
