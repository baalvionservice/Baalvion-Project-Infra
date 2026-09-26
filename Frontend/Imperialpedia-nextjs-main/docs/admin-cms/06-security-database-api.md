# 06 — Security, Database Architecture & API Architecture

Covers **§12 (Security)**, **§13 (Database Architecture + ER + indexing)**, **§14 (API Architecture)**.

---

## A. Security (§12)

### A.1 The 6 required areas → design

| Area | Design |
|------|--------|
| **RBAC** | `rbac-service` (:3005) hybrid RBAC + ABAC PDP is the single authority. Rank ladder (`viewer…super_admin`) + scoped grants + deny-overrides. Enforced at edge, BFF, controller, and row (RLS). See [04](./04-rbac-and-workflow.md). |
| **2FA** | TOTP (authenticator) + WebAuthn/passkeys; **mandatory** for `editor`+ ranks. Recovery codes (hashed). Step-up auth for destructive/break-glass actions. Backed by `auth-service`. |
| **Audit Logs** | `audit-service` (:3032): WORM (Postgres triggers block UPDATE/DELETE/TRUNCATE) + SHA-256 hash-chain (tamper-evident, verifiable). Auto-captures `baalvion:events` + direct POSTs. Every admin mutation is audited with actor/jti/ip/before-after. |
| **Backup System** | Postgres PITR (WAL) + nightly logical dumps; object-store + cross-region replication; **tested restore (DR drill)**; per-schema dumps; ClickHouse + media backed up separately. RPO ≤ 5 min, RTO ≤ 1 h. |
| **Activity Tracking** | Per-user session & action timeline (`/admin/control/activity-log`), live feed via `realtime-service`; anomaly flags (impossible travel, burst deletes) → alerts. |
| **API Security** | RS256 verify only (no HS256 — algorithm-confusion rejected), short-lived access + rotating refresh, `jti` revocation, per-route rate limits, input validation (Zod) at every boundary, output encoding, CORS allowlist, secrets via env/secret-manager (never in code). |

### A.2 Defense-in-depth checklist (enforced, not aspirational)

- **Secrets:** `.env*`/keys gitignored; fail-fast on missing required secrets at boot (platform pattern);
  push-protection secret scanning on.
- **Input:** Zod at boundaries; parameterized queries (Sequelize) — no string-built SQL; mass-assignment
  guarded (explicit field allowlists — a known platform CRIT class).
- **Output:** all stored HTML sanitized at write **and** render (DOMPurify allowlist); `html`/`embed` blocks
  admin-only; CSP with per-request nonce (no `unsafe-inline` scripts).
- **Transport/headers:** HSTS preload, `X-Content-Type-Options`, `X-Frame-Options: DENY` (admin),
  `Referrer-Policy`, `Permissions-Policy`.
- **AuthZ:** every mutating endpoint → `rbac-service` authorize; ownership-or-rank in controllers; RLS rows.
- **Rate limiting:** per-IP + per-user + per-route (login, signup, search, AI, comment) with Redis token buckets.
- **Abuse:** comment/UGC spam filters, honeypots, optional CAPTCHA on signup/contact; AI prompt-injection defenses.
- **Privacy:** PII minimization, consent for analytics, data-export/delete (GDPR/CCPA) tooling, audit of PII access.
- **Supply chain:** Dependabot/SCA, SRI for any CDN scripts, pinned lockfile.

### A.3 Security admin surfaces (existing routes)

`/admin/security`, `/admin/audit` + `/admin/audit-logs`, `/admin/control/access`, `/admin/control/activity-log`,
`/admin/control/backups`, `/admin/control/alerts`, `/admin/roles`, `/admin/access-logs`, `/admin/compliance`.

---

## B. Database Architecture (§13)

### B.1 Principles

- **PostgreSQL 16**, **schema-per-bounded-context** (platform invariant): `cms`, `imperialpedia`, `media`,
  `monetization`, `analytics` (rollups), `audit`, `rbac`, `identity`. No cross-schema FKs across context
  boundaries — references across contexts are by id + event sync (the `cms_contents.id ↔ imperialpedia` link
  is intentionally a soft reference).
- **ClickHouse** for the analytics event firehose (separate store).
- **Read replicas** for public reads; **partitioning** for time-series (analytics, audit, revisions, links).
- **RLS** (`@baalvion/tenancy`) for multi-brand isolation on shared-shape tables (media, content).

### B.2 ER diagram (core editorial + knowledge)

```
                            ┌──────────────────┐
                            │  cms_websites     │
                            └────────┬─────────┘
              ┌──────────────────────┼───────────────────────────┐
              ▼                      ▼                           ▼
     ┌────────────────┐     ┌──────────────────┐        ┌────────────────┐
     │ cms_categories │◀────│   cms_contents    │───────▶│   cms_tags     │ (via tag_ids[])
     │ (tree)         │ 1  *│  (content_type,   │ *    * │                │
     └────────────────┘     │   content_blocks, │        └────────────────┘
                            │   seo_metadata,   │
       ┌────────────────────┤   status, lang)   ├───────────────┐
       │ 1:1                │                   │ 1:*           │ 1:*
       ▼                    └───────┬───────────┘               ▼
 ┌──────────────┐                   │ 1:1                ┌────────────────────┐
 │ cms_workflows│                   ▼                    │ cms_revisions       │
 │ (state mach.,│         ┌──────────────────┐           │ (immutable snaps)   │
 │  seo/legal)  │         │ cms_media_refs   │──media_id▶ (media.assets)
 └──────┬───────┘         └──────────────────┘           └────────────────────┘
        │ 1:*                       │ 1:*
        ▼                          ▼
 ┌──────────────┐         ┌──────────────────┐    ┌───────────────────┐
 │ approval_logs│         │ content_comments │    │ seo_scores (1:1)  │
 └──────────────┘         └──────────────────┘    │ seo_link_checks   │
                                                   │ internal_links    │
 cms_contents.id ─ ─ ─(soft ref, event sync)─ ─ ─▶ imperialpedia.glossary_terms.cms_content_id
                                                          │ 1:*
            ┌─────────────────────────────────────────────┼───────────────┐
            ▼                     ▼                        ▼               ▼
   glossary_examples     glossary_relations         term_references   (entities, market_assets,
                          (typed graph)              ─▶ references      community, portfolio, …)
```

### B.3 Table inventory (by schema)

| Schema | Tables (key) |
|--------|--------------|
| `cms` | `cms_websites`, `cms_categories`, `cms_tags`, `cms_contents`, `cms_workflows`, `cms_revisions`, `cms_approval_logs`, `cms_members`, `cms_media_references`, `cms_seo_redirects`, `cms_website_integrations`, **`content_comments`**, **`seo_settings`**, **`seo_scores`**, **`seo_link_checks`**, **`internal_links`** |
| `imperialpedia` | `articles`(read-model), `entities`, `market_assets`, `asset_sentiments`, `asset_summaries`, `calculator_results`, `comments`, `community_posts`, `community_debates`, `votes`, `watchlist_items`, `portfolio_holdings`, `creator_profiles`, `leaderboard_entries`, **`glossary_terms`**, **`glossary_examples`**, **`glossary_relations`**, **`references`**, **`term_references`**, **`ai_jobs`** |
| `media` | **`assets`**, **`folders`** |
| `monetization` | **`ad_units`**, **`affiliate_links`**, **`affiliate_clicks`**, **`sponsored_content`**, **`plans`**, **`subscriptions`** |
| `analytics` | **`content_daily`**, **`traffic_daily`**, **`search_daily`** (rollups; raw in ClickHouse) |
| `audit` | `audit_events` (WORM, hash-chain) |
| `rbac` | roles, permissions, role_permissions, assignments, policies, subject_attributes |

(**bold** = introduced by this spec; the rest already exist.)

### B.4 Indexing strategy

| Concern | Strategy |
|---------|----------|
| **Slug/route lookups** | unique `(website_id, slug)` (exists); `(content_type, status)` composite for list filters. |
| **Full-text** | `tsvector` GIN on `cms_contents.search_vector` + glossary `search_vector`; OpenSearch is the primary search path, Postgres FTS the fallback. |
| **Workflow queues** | `(current_state)`, `(assignee_id)`, `(scheduled_publish_at)` for "my queue"/scheduler. |
| **Time-series** | partition `analytics.*` by day, `audit_events` + `cms_revisions` by month; BRIN on `created_at` for append-only tables. |
| **Joins/fan-in** | FK indexes on every `content_id`/`website_id`/`category_id`/`term_id` (mostly present). |
| **Hot counters** | `view_count`/`hit_count` updated async (batched from ClickHouse) — not on the read path. |
| **Vectors** | pgvector IVFFlat/HNSW (or OpenSearch k-NN) for embeddings (related/linking/dedup). |
| **Partial indexes** | broken links `WHERE ok=false`; active redirects `WHERE is_active`; published content. |

### B.5 Scale tactics

- **Read replicas** + PgBouncer for public read fan-out; writes to primary.
- **Caching ladder:** CDN (edge, published pages) → Redis (`@baalvion/cache`, API/object) → Postgres replica.
- **Hot/cold:** archive old revisions/audit to cheaper storage; keep recent hot.
- **Sharding path:** if `imperialpedia` engagement tables outgrow one node, shard by `org_id`/content hash
  (RLS keys already tenant-aware). Editorial `cms` stays single-primary (write volume is modest vs reads).

---

## C. API Architecture (§14)

### C.1 Shape

- **REST** (primary) — per-service, command/write + simple reads. Consistent envelope:
  `{ success, data, error, meta:{ total, page, limit } }` (platform pattern).
- **GraphQL BFF** (NEW) — read-composition for the public site + admin dashboard (collapse N calls into 1);
  read-only first (mutations stay REST for clear authz/audit boundaries).
- **Webhooks** — outbound platform events for integrations + inbound provider callbacks (payments).
- **Auth** — RS256 bearer (`@baalvion/auth-node`); issuer `baalvion-auth`, aud `baalvion-platform`.

### C.2 Core REST surface (selected)

```
# Content (cms-service)
GET    /v1/content?type=&status=&category=&q=&page=        list/filter (admin)
POST   /v1/content                                          create draft
GET    /v1/content/:id                                      detail (+ workflow, revisions meta)
PATCH  /v1/content/:id                                      update (updateContentSchema)
POST   /v1/content/:id/autosave                             autosave (autosaveContentSchema)
POST   /v1/content/:id/submit                               → pending_review (runs gates)
POST   /v1/content/:id/transition                           {action} state-machine move (authz per role)
POST   /v1/content/:id/publish                              publish/schedule
GET    /v1/content/:id/revisions                            list revisions
POST   /v1/content/:id/rollback                             {revisionNo} → new revision
POST   /v1/content/bulk                                     bulkUpdateSchema (≤100)
# Taxonomy
GET/POST/PATCH/DELETE /v1/categories | /v1/tags
# SEO
GET    /v1/seo/scores/:contentId | POST /v1/seo/recompute/:contentId
GET/POST/PATCH/DELETE /v1/seo/redirects
GET    /v1/seo/sitemap.xml (segmented) | GET /robots.txt
GET    /v1/seo/links/broken | /v1/seo/links/internal-graph
# Glossary (imperialpedia-service)
GET    /v1/glossary?difficulty=&category=&q=  | GET /v1/glossary/:slug | GET /v1/glossary/:slug/tooltip
POST/PATCH/DELETE /v1/glossary/:id  | POST /v1/glossary/:id/relations
# Media (media-service)
POST   /v1/media/presign  | POST /v1/media (finalize) | GET /v1/media?folder=&kind=&q=
PATCH  /v1/media/:id (alt/caption/tags) | DELETE /v1/media/:id | POST /v1/media/folders
# Analytics
GET    /v1/analytics/{traffic|engagement|top-content|search|growth|revenue}?range=
# Monetization
GET/POST /v1/ads | /v1/affiliate-links | /v1/sponsored | /v1/plans | /v1/subscriptions
# AI
POST   /v1/ai/{generate|seo|score|factcheck|link|summary|faq}  → ai_jobs
# Admin/dashboard
GET    /graphql  (dashboardSummary, content composition, public page)
```

### C.3 The 5 required API concerns → design

| Concern | Design |
|---------|--------|
| **REST API** | Versioned (`/v1`), resource-oriented, consistent envelope, idempotency keys on unsafe POSTs (publish/payment), cursor pagination on large lists, OpenAPI spec per service (`openapi.yaml` already present in `imperialpedia-service`). |
| **GraphQL API** | BFF read layer; persisted queries + depth/complexity limits; per-field authz; DataLoader batching; **no arbitrary mutations** (keeps write authz/audit in REST). |
| **Webhooks** | Outbound: `content.published`, `content.updated`, `term.published`, `redirect.created`, signed (HMAC, byte-stable signer like the existing finance bridge), retried with backoff, delivery log. Inbound: payment provider callbacks with signature verify (existing Razorpay/Stripe HMAC pattern). |
| **Authentication** | RS256 only; JWKS rotation (`BAALVION_JWKS_URI`); `sub/org_id/sid/roles[]/permissions[]/jti` claims; refresh rotation; `jti` revocation list in Redis. |
| **Rate Limiting** | Redis token-bucket per (ip, user, route); tighter on auth/AI/search/comment; `429` with `Retry-After`; burst + sustained tiers; premium users get higher quotas; public read served from CDN (largely un-rate-limited). |

### C.4 API conventions

- **Errors** never leak internals; structured `{ code, message, details? }`; 4xx for client, 5xx logged with trace id.
- **Tracing:** OpenTelemetry trace id + tenant id propagated (existing pattern); every request correlatable.
- **Tenancy:** `X-Tenant-ID`/`org_id` honored; RLS enforced under a non-superuser DB role.
- **Idempotency + optimistic concurrency:** content writes carry `If-Match`/`revision_count` to prevent
  lost updates during co-editing.
