# Marketplace Search Engine — Full-text + Country / Price / Category facets

> **Status:** ✅ Implemented & tested (pure engine + parity backend unit/integration
> tests green on real PostgreSQL; `tsc` clean). **Prompt 8.**
> **Principle:** *One engine, two backends.* OpenSearch in production; an in-process
> Postgres/GCKB parity backend everywhere else — so search runs with **zero new
> infrastructure** in dev, CI and the embedded-Postgres test run, while production
> uses a real cluster. No new table or migration: it reads the catalogue that
> already lives in `gckb_records`.

---

## 1. What it does

Full-text search across the marketplace catalogue (GCKB `product` / `product_variant`
records) with three faceted filters:

| Facet | Source on the record |
|-------|----------------------|
| **Country** | `attributes.originCountryCode` (ISO-3166-1 alpha-2, uppercased) |
| **Price** | `commercialTerms.unitPrice` › `tradeMetadata.indicativeUnitPrice` › variant `price.amount` |
| **Category** | promoted `productCategory` column › `attributes.categoryKey` |

Facets follow the standard rule: **a facet excludes its own selection from its
counts** (so you can still see/switch other values in that dimension) while every
other active filter is applied. Keyword constrains all counts.

---

## 2. Architecture

```
            ┌─────────────────────────── pure, unit-tested ───────────────────────────┐
 GckbRecord → document.projectRecord → SearchDocument
 SearchQuery → engine.searchDocuments (rank + facets)            ← Postgres parity backend
 SearchQuery → opensearch-dsl.buildSearchBody / parseSearchResponse ← OpenSearch backend
            └──────────────────────────────────────────────────────────────────────────┘

 backend.getSearchBackend()  ──selects──▶  PostgresSearchBackend | OpenSearchBackend
 search-service              ──orchestrates──▶ search / suggest / reindex / syncRecord
 routes  /api/search · /api/search/suggest · /api/search/reindex
 UI      /marketplace/search  (SearchBar · FacetSidebar · ResultCard · SearchExperience)
```

- **`src/server/search/types.ts`** — the backend-neutral contract (`SearchDocument`,
  `SearchQuery`, `SearchResult`, `SearchBackend`, price buckets, caps).
- **`document.ts`** — pure GCKB-record → `SearchDocument` projection.
- **`engine.ts`** — pure keyword match + ranking + faceting (used by the parity backend).
- **`opensearch-dsl.ts`** — pure query-body builder + response parser (used by the OS backend).
- **`postgres-backend.ts`** — bounded candidate window from `gckb_records` → engine. `index`/`remove` are no-ops (live reads).
- **`opensearch-backend.ts`** — lazy client (optional dependency), bulk index + search.
- **`search-repository.ts`** — tenant-scoped (`global ⊕ tenant`), soft-delete-aware reads + reindex paging.
- **`search-service.ts`** — orchestration + `reindex` + `syncRecord` (incremental sync hook).

---

## 3. API

| Method · Path | Purpose |
|---------------|---------|
| `GET /api/search?q=&country=IN,CN&category=&minPrice=&maxPrice=&sort=&page=&pageSize=` | Full-text + faceted search (tenant-scoped) |
| `GET /api/search/suggest?q=<prefix>&limit=` | Type-ahead suggestions |
| `POST /api/search/reindex` `{ batchSize? }` | Rebuild the external index (platform/admin role; no-op for the parity backend) |

Facet params accept repeated (`?country=IN&country=CN`) or comma lists (`?country=IN,CN`).
All responses use the GTI `{ success, data, error }` envelope. Identity/tenant come
from the verified principal — never from the client.

---

## 4. Backend selection (env)

| Var | Meaning |
|-----|---------|
| `SEARCH_BACKEND` | `opensearch` \| `postgres`. If unset: OpenSearch when `OPENSEARCH_NODE` is set, else the Postgres parity backend. |
| `OPENSEARCH_NODE` | Cluster URL, e.g. `https://opensearch:9200`. |
| `OPENSEARCH_INDEX` | Index name (default `baalvion_catalog`). |
| `OPENSEARCH_USERNAME` / `OPENSEARCH_PASSWORD` | Basic auth (optional). |
| `OPENSEARCH_INSECURE_TLS` | `1` to skip TLS verification (self-signed dev only). |

**Enabling OpenSearch in production:** the client is an **optional dependency** loaded
lazily, so it never blocks the build/test run.

```bash
pnpm add @opensearch-project/opensearch
export OPENSEARCH_NODE=https://your-cluster:9200
export SEARCH_BACKEND=opensearch
# then build the index:
curl -X POST https://app/api/search/reindex
```

---

## 5. Testing

```bash
npx vitest run src/server/search
```

- `document.test.ts` — projection + Country/Price/Category extraction precedence.
- `engine.test.ts` — keyword/ranking/pagination + the exclude-own-dimension facet rule.
- `opensearch-dsl.test.ts` — request-body shape (tenant scope, post_filter, agg filters) + response mapping (no live cluster).
- `search-service.integration.test.ts` — the parity backend end-to-end on real PostgreSQL, incl. RLS scoping.

---

## 6. Scope boundary

**In this slice:** the search engine (pure core + dual backend), the repository,
the service, the three routes, the `/marketplace/search` UI (search bar with
type-ahead, Country/Price/Category facet rail, ranked results, URL-driven state),
tests and this doc. **No new migration** — it reads `gckb_records`.

**Parity-backend limitations (documented, not bugs):** keyword matching covers the
promoted columns + `attributes.description`/`brand`; the candidate window is capped
(`capped: true` signals truncation). OpenSearch does true full-text at scale.
Cross-currency price faceting buckets on the numeric value — normalise upstream if a
single display currency is required.

**Deliberately not here:** near-real-time index sync is exposed via `syncRecord()`
but not yet wired to the GCKB outbox consumer (follow-up); image binaries (URLs only).
