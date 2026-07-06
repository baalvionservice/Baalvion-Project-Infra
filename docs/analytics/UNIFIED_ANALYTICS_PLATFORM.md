# Baalvion Unified Analytics Platform — Production Implementation Plan

> **v1 + v2 SHIPPED.** All 10 modules (Traffic, Content, SEO, CMS, Ecommerce, Marketing, Users, Security, Infra, AI) are live in `cms-service` with a unified per-website dashboard. **v2 trust/compliance/cost layers** are also shipped: GA-style consent enforcement, fraud/bot scoring, Redis dedupe, attribution engine (last-click + linear), cost/quota governance, watermarked+backfill-aware provider sync, GSC + AdSense connectors, reconciliation/anomaly detection, realtime SSE fanout, and schema-v2 events (`consent_state`/`fraud_score`/`attribution_id`/`dedupe_key`/`event_schema_version`). The 3 flagship sites (Imperialpedia, Law-Elite, Amarisé) are wired end-to-end incl. consent + ecommerce funnel. **v3** (ClickHouse/Kafka/edge/ML) is an infrastructure program — see [V3_MIGRATION_BLUEPRINT.md](V3_MIGRATION_BLUEPRINT.md); a forward `streamSink` seam is already in place so it migrates without a rewrite.

> Status: **PROPOSED — awaiting approval** (original v1 plan, retained for reference)
> Author: Principal Architect / Staff Engineer pass
> Scope: One unified, multi-tenant, API-driven analytics platform serving every website managed by the CMS (Imperialpedia, Law Elite, Amarisé, and all future sites), enabled per-site by configuration only.

---

## 0. Design principles (non-negotiable)

1. **Reuse, never duplicate.** The CMS is the source of truth for the website/org model, auth, tenancy, cache, queue, vault, telemetry, and exports. This platform composes those; it re-implements none of them.
2. **One architecture, many modules.** A single event schema, a single storage/aggregation layer, a single reporting API, a single dashboard. Modules (Traffic, SEO, Content, Ecommerce, …) are feature-flagged views over the same spine.
3. **Add a site = config, not code.** A new website receives analytics by setting `config.enableAnalytics = true` and selecting modules. No per-site code.
4. **Provider-agnostic via a plugin registry.** Every external provider (GA4, GSC, Meta Pixel, …) is a connector implementing one interface. Adding a provider = adding one connector file + one vault whitelist entry.
5. **Multi-tenant and fail-closed by default.** Every row is keyed by `website_id` + `organization_id`; Postgres RLS enforces isolation; the app connects as the non-superuser `baalvion_app`.
6. **Horizontally scalable.** Stateless collector tier, stateless API tier, and a separately-scalable worker tier — all coordinated only through Postgres + Redis/BullMQ.

---

## 1. Production architecture

```
                         ┌─────────────────────────────────────────────────────────┐
   First-party beacon    │                    ANALYTICS-SERVICE                     │
   (JS on each site) ───►│  Collector tier (stateless, N replicas)                  │
                         │    POST /collect  → validate → enqueue (ingest queue)    │
   Provider APIs  ──────►│  Connector tier (scheduled sync jobs, plugin registry)   │
   (GA4/GSC/pixels)      │    BullMQ repeatable → connector.sync() → enqueue         │
                         └───────────────┬─────────────────────────────────────────┘
                                         │ BullMQ (ingest / sync / rollup / DLQ)
                                         ▼
                         ┌─────────────────────────────────────────────────────────┐
                         │  Worker tier (stateless, N replicas, QUEUE_WORKERS)      │
                         │    ingest → normalize → enrich (geo/ua) → write raw       │
                         │    rollup → aggregate raw → daily/monthly rollup tables    │
                         │    sync   → pull provider metrics → write provider tables  │
                         └───────────────┬─────────────────────────────────────────┘
                                         ▼
   Postgres schema `analytics`  ┌──────────────────────────────────────────────────┐
   (RLS on every table)         │ raw events (partitioned) · sessions · visitors    │
                                │ rollup_daily · rollup_monthly · provider_metrics  │
                                │ materialized views · retention/partition mgmt     │
                                └───────────────┬──────────────────────────────────┘
                                                ▼
                         ┌─────────────────────────────────────────────────────────┐
   admin-platform  ◄─────│  Reporting API tier (stateless, versioned /v1)           │
   dashboard             │    RBAC · tenant scope · cache (getOrSet) · rate limit    │
   (one per website)     │    query rollups/MVs · realtime (Redis) · export (report) │
                         └─────────────────────────────────────────────────────────┘
```

### 1.1 Placement decision — DECIDED: extend `cms-service`

**Home: `Backend/services/knowledge/cms-service/`** (in-place, port `3018`), analytics living in its **own dedicated Postgres schema `analytics`** managed by the same service (`CREATE SCHEMA IF NOT EXISTS analytics` at boot, alongside the existing `cms` schema).

- **Why in-cms:** analytics reads the website/org model, the encrypted credential vault, and content signals directly **in-process** — no cross-service HTTP for the internal resolver, no second deployable, and it inherits cms-service's auth/RBAC/queue/telemetry wiring verbatim.
- **Scale story preserved:** the collector endpoint does no DB work (validate + enqueue only), and workers are gated by an `ANALYTICS_WORKERS` env flag so the same image can run as API-only or worker replicas — cms-service already uses this in-process/standalone toggle pattern.
- **Ingress:** existing Caddy route `/api-bff/knowledge/cms/*` → `app-platform:3018`; new routes are just `/api/v1/collect` (public) and `/api/v1/cms/websites/:websiteId/analytics/*` (authed).

**Tenancy model for Phase 0 — app-level scoping, RLS-ready (matches surrounding code):**
cms-service enforces tenant isolation at the **service layer** (`cmsAccess.loadCmsRole` verifies website membership; `integrationService.orgFilter` scopes every query to the caller's org, platform admins excepted) and does **not** use Postgres RLS or `@baalvion/tenancy`. Analytics follows that exact model: every table carries `website_id` + `organization_id` NOT NULL; every read is gated by `loadCmsRole` (membership-verified website) and org-filtered; every write is stamped with both keys. Tables are designed **RLS-ready** (tenant columns + indexes present) so `@baalvion/tenancy` `enableRlsSql` can be layered on in one migration if/when cms-service adopts RLS platform-wide. Adopting RLS piecemeal now would fail-closed under the non-superuser prod role (`baalvion_app`) unless every query set the tenant GUCs — a larger change than Phase 0 warrants and inconsistent with the rest of the service.

### 1.2 The three tiers (one codebase, three run modes)

Same image, switched by env — mirrors the existing `QUEUE_WORKERS` toggle:
- `ROLE=api` → collector + reporting API (default).
- `ROLE=worker` → BullMQ workers only (ingest/rollup/sync), no HTTP except `/health` + `/metrics`.
- Collector endpoint (`/collect`) is enabled on the api role; it does no DB work — only validate + enqueue — so it scales flat.

---

## 2. Unified event schema

One canonical event, produced by **first-party beacon**, **server-side CMS hooks**, and **provider connectors** alike.

```
analytics.events                       -- raw, append-only, partitioned by RANGE(occurred_at)
  event_id        UUID   PK (default gen_random_uuid)
  occurred_at     TIMESTAMPTZ NOT NULL          -- event time (client or provider)
  received_at     TIMESTAMPTZ NOT NULL default now()
  website_id      UUID   NOT NULL               -- FK-by-value → cms.cms_websites.id
  organization_id UUID   NOT NULL               -- tenant key (RLS)
  provider        TEXT   NOT NULL               -- 'first_party' | 'ga4' | 'gsc' | 'meta_pixel' | ...
  event           TEXT   NOT NULL               -- 'page_view' | 'session_start' | 'scroll' | 'purchase' | ...
  module          TEXT   NOT NULL               -- 'traffic'|'content'|'ecommerce'|'seo'|... (routing/rollup)
  user_id         BIGINT                        -- auth.users.id when known (nullable)
  session_id      TEXT                          -- first-party session
  visitor_id      TEXT                          -- anonymous, cookieless-capable hash
  page            TEXT                          -- path
  url             TEXT                          -- full URL
  referrer        TEXT
  campaign        JSONB                         -- {source,medium,campaign,term,content} (UTM)
  geo             JSONB                         -- {country,city,region,lang}
  device          JSONB                         -- {type,os,browser,screen,isp,network}
  value_num       NUMERIC                       -- revenue/duration/scroll% (module-specific numeric)
  currency        TEXT
  metadata        JSONB   NOT NULL default '{}' -- module-specific payload (content_id, order_id, keyword, ...)
  PARTITION BY RANGE (occurred_at)
```
Note: `country/city/device/browser/campaign` from the prompt are stored inside the `geo`/`device`/`campaign` JSONB objects (indexed via generated columns / expression indexes) rather than 15 loose columns — keeps the row lean and partition-friendly while preserving every field.

Derived, worker-maintained:
```
analytics.sessions   (session_id, website_id, org_id, visitor_id, started_at, ended_at,
                      duration_s, pageviews, landing_page, exit_page, bounced, engaged, geo, device, campaign)
analytics.visitors   (visitor_id, website_id, org_id, first_seen, last_seen, sessions, is_returning, ...)
analytics.provider_metrics (id, website_id, org_id, provider, metric, dims JSONB, value NUMERIC,
                            granularity, period_start, period_end)   -- GA4/GSC/ads pulled series
```

Aggregation (worker-maintained, the tables the dashboard actually reads):
```
analytics.rollup_daily   (website_id, org_id, module, day DATE, dims JSONB, metrics JSONB)  -- unique(website,module,day,dims)
analytics.rollup_monthly (website_id, org_id, module, month DATE, dims JSONB, metrics JSONB)
```
Plus **materialized views** for the heaviest dashboard cards (e.g. `mv_traffic_top_pages_30d`, `mv_seo_top_queries_28d`), refreshed `CONCURRENTLY` by a rollup job.

---

## 3. Database schema, partitioning, retention

- **Partitioning:** native declarative `RANGE (occurred_at)` on `analytics.events`, monthly partitions, auto-managed by a `partition-maintenance` repeatable job (create next month ahead, detach/drop expired). No pg_partman dependency required, but compatible if later adopted.
- **Indexes:** per-partition `(website_id, occurred_at)`, `(website_id, event, occurred_at)`, expression index on `((campaign->>'source'))`, `((geo->>'country'))`; BRIN on `occurred_at` for scan-heavy rollups.
- **RLS:** `enableRlsSql('analytics', <table>)` from `@baalvion/tenancy` on every table (events parent + partitions inherit, sessions, visitors, provider_metrics, rollups). App role `baalvion_app` (non-superuser). Bypass only for `platform_admin`/`platform_security_admin`.
- **Retention policy (configurable per plan):** raw `events` 90 days (basic) / 400 days (enterprise); `sessions`/`visitors` 400 days; `rollup_daily` 25 months; `rollup_monthly` indefinite; `provider_metrics` 25 months. Enforced by the partition-maintenance job + a retention sweep.
- **Migrations:** sequelize-cli, next sequence numbers continuing the CMS scheme where shared, but analytics owns its own numbered set `20270001…` in `analytics-service/migrations/`. Includes: schema create, partition parent + first partitions, partition-management functions, RLS statements, rollup tables, materialized views, indexes. **Migration tests** assert up/down idempotency and RLS presence.

---

## 4. Queue architecture (BullMQ)

Copy the `trade-service/queue/` trio (`connection.js`, registry `index.js`, `workers.js`) — already has DLQ, replay, health, idempotent `jobId`, exponential backoff, and the in-process/standalone toggle.

| Queue | Producer | Job | Concurrency | Schedule |
|---|---|---|---|---|
| `analytics-ingest` | collector `/collect`, CMS hooks | normalize+enrich+write raw | high (10–20) | on-demand |
| `analytics-sync` | scheduler | per-`(website,provider)` connector.sync() | medium (5), provider-rate-limited | repeatable cron per provider |
| `analytics-rollup` | scheduler | daily/monthly rollups + MV refresh | low (2) | repeatable (hourly incremental, nightly full) |
| `analytics-maintenance` | scheduler | partition create/drop, retention sweep | 1 | daily |
| `dead-letter` | workers | inspection/replay | — | — |

- Idempotency: ingest jobs keyed by `event_id`; sync jobs by `sync-<website>-<provider>-<periodKey>`.
- External calls fail-open and per-item isolated (one provider/site failure never blocks others), exactly as `runPendingSweep` does today.
- Redis connection via the canonical `{ maxRetriesPerRequest: null }` pattern; workers registered with `@baalvion/graceful-shutdown`.

---

## 5. Service architecture (analytics-service internals)

```
analytics-service/
  index.js                       # entry; ROLE=api|worker; port 3037; boots DB, tenancy, telemetry, queues
  config/                        # appConfig, database (sequelize-cli), redis
  models/                        # sequelize factory models + index.js registry (matches cms-service style)
  migrations/ seeders/
  routes/v1.js                   # aggregator; /collect, /internal, /cms/websites/:id/analytics/*
  controller/                    # thin; delegate to services
  service/
    ingestService.js             # validate → enqueue
    eventService.js              # write raw, upsert session/visitor
    rollupService.js             # aggregation queries → rollup tables + MV refresh
    reportingService.js          # dashboard queries over rollups/MVs (cached)
    realtimeService.js           # Redis-backed live visitor counters
    exportService.js             # delegates to report-service
    credentialService.js         # reads cms_website_integrations via internal resolver
    websiteRegistry.js           # slug→UUID + module flags, cached (getOrSet)
  connectors/
    registry.js                  # plugin registry (id, category, requiredCreds, sync, validate)
    ga4.js gsc.js gtm.js googleAds.js adsense.js googleNews.js merchantCenter.js
    clarity.js bingWebmaster.js metaPixel.js linkedin.js xPixel.js pinterest.js tiktok.js
    cloudflare.js internalCms.js server.js
  workers/                       # ingest.worker, sync.worker, rollup.worker, maintenance.worker
  middleware/                    # auth (auth-node), cmsAccess (mirror), tenant, rateLimit, validate, internalAuth
  validators/                    # zod schemas (event, query, export)
  openapi/                       # OpenAPI 3 spec → Swagger UI at /docs
  utils/                         # errors, pagination, response, geo, ua, sampling
  test/                          # unit / integration / migration / load
```

### 5.1 Provider connector interface (plugin architecture)

```js
// connectors/registry.js — every provider implements this
module.exports = {
  id: 'ga4',
  category: 'traffic',           // routes metrics to a module
  provider: 'ga4',
  requiredCreds: ['propertyId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],
  validate(creds) { /* shape + live ping */ },
  async sync({ website, creds, since, until, enqueueMetric, logger }) {
    // official API only; OAuth refresh handled by credentialService; rate-limited; retried by BullMQ
  },
};
```
`registry.list()` powers both the scheduler (what to sync) and the admin "connect provider" UI (what creds to ask for). Adding a provider = drop a file + whitelist it in the CMS vault.

---

## 6. Authentication & authorization flow

- **Ingest (`/collect`):** unauthenticated, first-party. Guarded by per-website **origin allowlist** (from `cms_websites.domain`/config), strict **CORS**, aggressive **rate limiting** + bot heuristics, payload size cap, and a signed/rotating site token embedded by the beacon. No PII required (cookieless `visitor_id` = salted hash of IP+UA+day, salt per-site).
- **Reporting API:** `@baalvion/auth-node` `createAuthMiddleware` → `req.auth`. Then a **`loadAnalyticsScope`** middleware mirroring cms-service `loadCmsRole`: resolve `:websiteId` slug→UUID, check `cms_website_members` (or platform bypass), attach `{ websiteId, orgId, isPlatformAdmin }`. Require `analytics:read` permission (already minted for admin/owner/manager/analyst) or a CMS role ≥ `cms_viewer`. Writes (connect/disconnect providers, config) require `cms_admin`.
- **Tenant enforcement:** `tenantMiddleware` (after auth) sets ALS tenant; all reads go through `withTenantTransaction`/`withTenantClient` so RLS applies. Platform admins get scoped bypass.
- **Provider credentials:** never stored in analytics-service. Read live from `cms.cms_website_integrations` via cms-service internal resolver (`GET /internal/integrations/:websiteSlug`, `x-internal-secret`), decrypted per call. OAuth refresh tokens rotated automatically and written back through the CMS vault upsert.

---

## 7. Provider integration architecture

- **Official APIs only, never scrape.** OAuth2 (Google GA4 Data API, Search Console API, Google Ads API, AdSense Management API, GTM API, Merchant Center; Meta Graph; LinkedIn; X; Pinterest; TikTok Business; Cloudflare GraphQL Analytics; Bing Webmaster; Microsoft Clarity export).
- **Credential lifecycle:** admin connects a provider in the CMS integrations UI → stored encrypted → `credentialService` resolves + auto-refreshes → connector `validate()` pings live → status surfaced in dashboard.
- **Rate limiting & backoff:** per-provider token-bucket in Redis; BullMQ exponential backoff + DLQ on exhaustion; per-site/provider failure isolation.
- **Incremental sync:** connectors pull only `since→until` windows (watermark stored in `provider_metrics`), reconciled nightly. Client-side pixels (Meta/TikTok/LinkedIn/Pinterest/X/Clarity/GTM) are **injected by the beacon/tag layer** and their server-side metrics pulled via API where the provider exposes one.

---

## 8. Dashboard design (admin-platform)

Extend, don't replace. Reuse `PageHeader`, `KpiCard`, `charts/AreaChart`+`BarChart` (Recharts), `data-table/DataTable`, `ui/tabs|card|skeleton`, TanStack Query key-factory pattern, and `cmsStore` for the active website.

- **Per-website unified dashboard:** `src/app/(dashboard)/cms/websites/[websiteId]/analytics/` with a tab per enabled module (Traffic · SEO · Content · Ecommerce · Marketing · CMS · Users · Infra · Security · AI). Tabs render only for modules enabled in `config.analytics.modules`.
- **Global cross-site view:** extend the existing `/analytics` page with a website filter.
- **Widgets:** realtime visitors (polls `/realtime`), KPI row, time-series, top-N tables, funnels, geo, device breakdown — all fed by `analyticsApi` hooks mirroring `analytics.queries.ts`.
- **Filters:** website · date range · country · language · device · campaign · author · category · product.
- **Exports:** CSV / Excel / PDF via report-service (button → `/export` → report run → download).
- **API client:** new `src/lib/api/analytics-unified.ts` + `src/lib/queries/analytics-unified.queries.ts` on a `serviceClients.analytics` pointed at `/api-bff/platform/analytics/api/v1`. Register nav entry in `src/lib/constants/navigation.ts` (extend existing `Analytics` item with `children`).
- **First-party tracker:** new `<UnifiedAnalytics siteToken pageMeta/>` component (extends the existing `Analytics.tsx` pattern) added to Imperialpedia/Law-Elite/Amarisé root layouts, gated by `config.enableAnalytics`; sends `page_view`, `session_start/end`, `scroll`, `engagement`, and ecommerce events to `/collect`.

---

## 9. Reporting API specification

- **REST, versioned `/api/v1`,** OpenAPI 3 spec + Swagger UI at `/docs`.
- Envelope matches the platform standard `{ success, data, error, meta }`.
- **Endpoints (representative):**
  - `POST /collect` — beacon ingest (public, rate-limited).
  - `GET /cms/websites/:websiteId/analytics/overview?range=` — KPI summary.
  - `GET …/analytics/:module/timeseries?metric=&granularity=&from=&to=&filters=`
  - `GET …/analytics/:module/breakdown?dimension=&…` — top-N tables (pagination/sort/filter).
  - `GET …/analytics/realtime` — live visitors.
  - `GET …/analytics/providers` / `POST …/providers/:id/sync` — connector status + manual sync.
  - `POST …/analytics/export` — CSV/Excel/PDF via report-service.
- **Cross-cutting:** pagination (`page`/`limit` + `meta.total`), filtering, sorting, **cache** via `@baalvion/cache` `getOrSet` (tenant-scoped, short TTL for realtime, longer for historical), **rate limiting**, and per-module permission checks.

---

## 10. Security review

- **RBAC:** `analytics:read` permission + CMS role gate; writes require `cms_admin`; platform bypass strictly limited.
- **Multi-tenant isolation:** RLS fail-closed on every table; queries always run inside a tenant transaction.
- **Encryption:** provider secrets AES-256-GCM in the CMS vault; TLS to Postgres via `buildPgSsl`; secrets from env/secret-manager, never in code.
- **Injection:** Sequelize parameterization only; report-service already restricts to read-only SELECT/WITH.
- **Web:** helmet security headers, nonce-based CSP additions for pixel domains, CORS allowlist per site, CSRF on state-changing admin routes, XSS-safe (no `dangerouslySetInnerHTML`), input validated with zod at the boundary.
- **Privacy:** cookieless-capable visitor id, IP truncation/hashing, consent-mode integration with the existing `CookieConsent` component, per-site data retention, DNT honored.
- **Abuse:** collector bot detection + rate limits; audit trail via `audit-service` for provider connect/disconnect and config changes.

---

## 11. Scalability review

- **Collector:** stateless, does no DB writes (validate+enqueue only) → scales flat behind the LB; absorbs spikes into BullMQ.
- **Workers:** separate `ROLE=worker` replicas; ingest concurrency independent of API; rollups off the hot path.
- **Storage:** monthly partitions keep indexes small and drops O(1); rollup tables + MVs mean dashboards never scan raw events; BRIN for range scans.
- **Reads:** tenant-scoped cache with single-flight prevents thundering herds; realtime counters live in Redis, not Postgres.
- **External APIs:** per-provider rate buckets + incremental watermarks bound outbound load regardless of site count.
- **Growth path:** raw-event store is swappable to ClickHouse/Timescale later behind `eventService` without touching the API — the interface is already the seam.

---

## 12. Testing strategy

- **Unit (Jest):** validators, normalizers (geo/UA), rollup math, each connector's transform (mocked API), retention/partition SQL builders. Target ≥ 80%.
- **Integration (supertest + test Postgres/Redis):** `/collect` → queue → worker → raw row → rollup → `/overview`; RLS isolation (tenant A cannot read tenant B); auth/permission gates.
- **API/contract:** OpenAPI schema validation on every endpoint; pagination/filter/sort invariants.
- **Migration tests:** up/down idempotency, partition creation, RLS presence assertions.
- **Load (k6/autocannon):** `/collect` throughput + p95 under burst; rollup job under N-partition volume.
- **E2E (Playwright, admin-platform):** connect a provider, see KPIs populate, filter, export; visual regression on dashboard breakpoints; reduced-motion + a11y checks.

---

## 13. Deployment strategy

- **Docker:** analytics-service added as a module in the existing consolidated Node image; `ROLE=api` and `ROLE=worker` run as separate processes/replicas from the same image.
- **Ingress:** Caddy route `/api-bff/platform/analytics/*` → `app-platform:3037`.
- **CI/CD (GitHub Actions):** lint → type-check → unit/integration → migration test → build image → deploy; `pnpm run architecture:check` gate for the new catalog entry.
- **Zero-downtime:** migrations are additive/backward-compatible (expand-then-contract); partition creation is online; MV refresh `CONCURRENTLY`.
- **Rollback:** image rollback + reversible migrations; feature flags let the whole platform or any module be disabled instantly.
- **Feature flags:** `config.enableAnalytics` (per site) + `config.analytics.modules[]` (per module) + `config.analytics.providers[]`. Global kill-switch env for the collector.

---

## 14. Monitoring strategy

- **Metrics (`@baalvion/telemetry` Prometheus `/metrics`):** ingest rate, queue depth/latency per queue, rollup duration, connector sync success/failure per provider, raw→rollup lag, API p95, cache hit ratio, partition count.
- **Structured logs (pino + trace correlation):** per-job, per-connector, per-request.
- **Tracing (OTel):** collect→queue→worker→DB spans.
- **Errors (Sentry):** worker + API.
- **Alerting:** queue backlog threshold, connector failure streak, rollup lag, partition-maintenance failure, collector error rate. Grafana dashboards from the existing observability stack.

---

## 15. Implementation roadmap (module-by-module, priority order)

**Phase 0 — Foundation (blocks everything).** Service scaffold, DB schema + partitioning + RLS + rollup tables, queue trio + workers, auth/tenant/scope middleware, telemetry, OpenAPI skeleton, health, catalog + CI. Ship the empty spine, green.

**Phase 1 — Traffic Analytics (Module 1).** First-party beacon + `<UnifiedAnalytics>` tracker, `/collect`, ingest→session/visitor→traffic rollups, realtime, dashboard Traffic tab. This proves the whole pipeline end-to-end.

**Phase 2 — Content Analytics (Module 3).** CMS-native; reuses `CmsContent.viewCount` + content events (reading time, scroll, completion, shares). Cheapest high-value win after Traffic.

**Phase 3 — SEO Analytics (Module 2).** GSC connector (impressions/clicks/CTR/position/keywords/coverage/sitemaps), Core Web Vitals from the beacon, AdSense policy/News-eligibility signals. High value for Imperialpedia/Law-Elite/AdSense.

**Phase 4 — CMS Analytics (Module 6).** Internal, near-free; reuses cms workflow/approval/revision models (publishing speed, approval time, drafts/scheduled/published).

**Phase 5 — Ecommerce Analytics (Module 4).** Amarisé; connectors/hooks to commerce/order data + Merchant Center; funnel, cart abandonment, AOV, CLV, refunds.

**Phase 6 — Marketing Analytics (Module 5).** Google/Meta/LinkedIn/TikTok/Pinterest ad connectors; ROAS/CPA/CTR/CPC/CPM, campaign ROI.

**Phase 7 — User Analytics (Module 7).** Reuses `audit-service`/auth login history, devices, locations, security events.

**Phase 8 — Security Analytics (Module 9).** Failed/suspicious logins, API abuse, rate-limit hits, bot detection, threat signals — from audit + gateway logs.

**Phase 9 — Infrastructure Analytics (Module 8).** Reuses `@baalvion/telemetry`/Prometheus (DB/Redis/queue/API latency, worker health).

**Phase 10 — AI Analytics (Module 10).** Prompt/token usage, acceptance rate, cost estimation, time saved — from the AI provider integrations.

Each phase = migrations + service + connector(s) + API endpoints + dashboard tab + tests, shipped independently behind its module flag.

---

## 16. Production readiness checklist (per module, gate to ship)

- [ ] Migrations additive, reversible, tested (up/down), RLS asserted.
- [ ] Every table has RLS + tenant-scoped access; cross-tenant read test passes.
- [ ] Endpoints: auth + permission + tenant scope enforced; zod-validated; paginated; OpenAPI-documented.
- [ ] Reads cached (tenant-scoped) and rate-limited; dashboards read rollups/MVs, never raw.
- [ ] Queue jobs idempotent, retried, DLQ'd; workers graceful-shutdown-registered.
- [ ] Connectors: official API, OAuth refresh, rate-limited, fail-open, watermarked.
- [ ] No secrets in code; provider creds only in the encrypted CMS vault.
- [ ] Metrics + logs + traces + alerts wired; Sentry on.
- [ ] Unit ≥ 80%, integration + migration + load + e2e green.
- [ ] Feature-flagged; kill-switch verified; rollback rehearsed.
- [ ] Enabling a brand-new website needs config only (no code) — verified on a scratch site.

---

## Reuse ledger (what this plan explicitly does NOT rebuild)

| Concern | Reused asset |
|---|---|
| Website/org/tenant model | `cms.cms_websites`, `auth.organizations` |
| Provider credential vault | `cms.cms_website_integrations` + `secretCrypto` + internal resolver |
| Auth | `@baalvion/auth-node` (RS256, `analytics:read`) |
| Tenancy/RLS | `@baalvion/tenancy` |
| Cache | `@baalvion/cache` |
| Queue pattern | `trade-service/queue/*`, `reconciliationQueue` |
| Exports | `report-service` |
| Telemetry | `@baalvion/telemetry` |
| Dashboard primitives | admin-platform `KpiCard`/charts/`DataTable`/TanStack Query/`cmsStore` |
| Client tag pattern | `Analytics.tsx` (GA4/AdSense) → extended into first-party tracker |
| Content view counter | `CmsContent.viewCount` |
| Existing analytics seams | `dashboard-service/analyticsProvider.js` (superseded), imperialpedia content analytics (fed in) |
```
