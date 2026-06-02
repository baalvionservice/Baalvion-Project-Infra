# search-service — Baalvion Search (OpenSearch)

Deployable HTTP service over **`@baalvion/search`** (OpenSearch). One search API for
every domain — full-text + fuzzy, autocomplete, facets, and indexing — with built-in
**tenant scoping**.

- **Domain:** infrastructure · **Port:** `3036` · **Engine:** OpenSearch
- **Stack:** Node + Express. Verify-only RS256 via `@baalvion/auth-node`. Wraps
  `@baalvion/search`; tenant scoping via `@baalvion/tenancy`.

## Tenant scoping
Every index carries an `orgId` field. Search/facet requests are **automatically
filtered to the caller's tenant** (from `req.auth.orgId` / `X-Tenant-Id`); `super_admin`
bypasses, and a request may opt out with `scoped=false` for cross-tenant search.

## API (`/v1`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/search/:index?q=&from=&size=&fuzzy=&sort=field:asc&scoped=` | user | full-text search |
| POST | `/search/:index` | user | search (body: query/filters/sort/highlight/fuzzy) |
| POST | `/search/:index/facets` | user | faceted search (term aggregations) |
| GET  | `/autocomplete/:index?field=&prefix=&size=` | user | typeahead |
| GET  | `/indices` | user | list searchable indices |
| POST | `/index/:index` | internal/admin | index one doc `{id, doc}` |
| POST | `/index/:index/bulk` | internal/admin | bulk index `{items:[{id,doc}]}` |
| PATCH| `/index/:index/:id` | internal/admin | partial update `{doc}` |
| DELETE | `/index/:index/:id` | internal/admin | delete a doc |
| POST | `/admin/indices` | internal/admin | create/ensure all index mappings |

Indices (from `@baalvion/search`): `baalvion_jobs`, `baalvion_articles`,
`baalvion_products`, `baalvion_companies`, `baalvion_creators`.

## Run locally
```bash
cp .env.example .env
# bring up OpenSearch (dev, single-node, security off):
docker run -d --name baalvion-opensearch -p 9200:9200 \
  -e discovery.type=single-node -e DISABLE_SECURITY_PLUGIN=true \
  -e OPENSEARCH_JAVA_OPTS="-Xms512m -Xmx512m" opensearchproject/opensearch:2
pnpm install
pnpm --filter @baalvion/search build   # build the package this service consumes
pnpm --filter search-service dev
pnpm --filter search-service test       # tenant-scope unit tests (no OpenSearch needed)
node scripts/smoke.mjs                   # live E2E (needs OpenSearch + the service running)
```
The service **boots even if OpenSearch is down** (serves `/health` as `degraded`); search calls then return `503 SEARCH_UNAVAILABLE` until OpenSearch is reachable.

## Notes
- `datastores: []` in the catalog because OpenSearch isn't in the catalog enum yet (postgres/redis/clickhouse/...); the real store is OpenSearch.
- Scale target (50M docs, <50ms) is an OpenSearch-cluster sizing concern; this service is the stateless query/index layer.
