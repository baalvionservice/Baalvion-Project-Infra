# 01 — Architecture, Technology Stack & Executive Dashboard

Covers spec **§1 (Dashboard)** and **§16 (Technology Stack)**, plus the system context that the rest of the spec assumes.

---

## 1. System context

```
                         ┌──────────────────────────────────────────────┐
                         │                 EDGE / CDN                    │
                         │  Cloudflare (WAF, cache, image resize, TLS)   │
                         └───────────────┬───────────────┬──────────────┘
                                         │               │
                     public reads (ISR)  │               │  /admin (authenticated)
                                         ▼               ▼
                   ┌─────────────────────────┐   ┌─────────────────────────┐
                   │  Next.js 15 (App Router) │   │  Admin Panel (same app,  │
                   │  public site — RSC/ISR   │   │  /admin route group)     │
                   └────────────┬────────────┘   └────────────┬────────────┘
                                │ BFF / API gateway (REST + GraphQL, RS256)  │
                                ▼                                            ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │                              DOMAIN & PLATFORM SERVICES                             │
   ├───────────────┬───────────────┬───────────────┬──────────────┬─────────────────────┤
   │ cms-service   │ imperialpedia │ rbac-service  │ search-svc   │ notification-service │
   │ (cms schema)  │ -service      │ (:3005)       │ (:3036)      │ (:3031)              │
   │ content/      │ (imperialpedia│ RBAC+ABAC PDP │ OpenSearch   │ email/sms/push/in-app│
   │ workflow/seo  │ schema)       │               │              │                      │
   ├───────────────┼───────────────┼───────────────┼──────────────┼─────────────────────┤
   │ media-service │ audit-service │ ml-service    │ payment/     │ analytics-service    │
   │ (S3 + CDN)    │ (:3032 WORM)  │ (AI flows)    │ ledger       │ (rollups, ClickHouse)│
   └───────┬───────┴───────┬───────┴───────┬───────┴──────┬───────┴──────────┬──────────┘
           ▼               ▼               ▼              ▼                  ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐   ┌──────────────────┐
   │ PostgreSQL  │  │ Redis        │  │ OpenSearch│  │ S3/R2     │   │ ClickHouse        │
   │ (per-schema │  │ Streams+cache│  │ cluster   │  │ object    │   │ (events/metrics)  │
   │ isolation)  │  │ baalvion:*   │  │           │  │ store     │   │                   │
   └─────────────┘  └──────────────┘  └──────────┘  └──────────┘   └──────────────────┘
```

**Bounded contexts** (each owns an isolated Postgres schema — a platform invariant):

- **Editorial** → `cms-service` / `cms` schema. The CMS spine.
- **Knowledge & Engagement** → `imperialpedia-service` / `imperialpedia` schema. Glossary entities, market data, community, calculators, portfolio, leaderboard, AI.
- **Identity & Authz** → `auth-service`, `rbac-service`.
- **Cross-cutting** → search, audit, notification, media, analytics, payment/ledger.

Cross-context communication is **events first** (`baalvion:events` Redis Streams) and **read-only HTTP** where a synchronous answer is required. No service writes another context's schema.

---

## 2. Technology stack (§16)

The recommendation is **"adopt the platform you already run, harden it for scale."** Where the repo
already standardizes a choice, keep it; net-new pieces are flagged **(NEW)**.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend (public + admin)** | **Next.js 15 (App Router, RSC)**, React 19, TypeScript, Tailwind, shadcn/ui, TanStack Query (server state), Zustand (admin client state) | Already the repo standard; RSC + ISR is the right tool for a read-heavy encyclopedia; one app, two route groups (`/`, `/admin`). |
| **Block editor** | **TipTap** (ProseMirror) for prose + a **custom block framework** persisting to `content_blocks JSONB` | Notion/Gutenberg-class, schema-controlled, SSR-renderable. See [02-content-cms.md](./02-content-cms.md). |
| **Backend services** | **Node.js + Express** (existing services), Sequelize ORM, Zod validation | Matches `cms-service`/`imperialpedia-service`; don't fork the runtime. Heavy compute (sanctions/risk-style) can stay in the Java suite where it already lives. |
| **API** | **REST** (primary, per-service) + **GraphQL BFF** (NEW, read-composition for the public site & dashboard) + **Webhooks** | REST for writes/commands; GraphQL to collapse N dashboard/article calls into one. |
| **Primary DB** | **PostgreSQL 16** — per-schema isolation, JSONB blocks, `tsvector` FTS, partitioning for analytics/audit | Already in use; partition + read-replicas for scale. |
| **Search** | **OpenSearch** via `search-service` | Already built, tenant-scoped; powers article search, glossary, autocomplete, related-terms. |
| **Analytics store** | **ClickHouse** (NEW) for pageviews/events/CTR; Postgres rollups for admin reads | Columnar store is mandatory at 100M MAU; Postgres alone won't hold the event firehose. |
| **Cache** | **Redis** via `@baalvion/cache` (read-through, single-flight, tenant-scoped) | Already standardized; add edge cache (CDN) above it. |
| **Object storage / media** | **S3 / Cloudflare R2** + **media-service** (NEW thin service) | Originals in object store; derivatives via CDN image resizing. |
| **CDN / edge** | **Cloudflare** (cache, WAF, image transform, redirects at edge) | Encyclopedia is cache-dominant; serve published pages from edge. |
| **Events / bus** | **Redis Streams** (`@baalvion/events`) | Already the real bus (`baalvion:events`). |
| **AI** | **ml-service** + provider abstraction (Claude/Gemini), with keyless fallbacks | Matches existing `aiService.js`/genkit flows; never hard-fail on a missing key. |
| **Auth** | **RS256** via `@baalvion/auth-node`, `auth-service` issuer `baalvion-auth` / aud `baalvion-platform` | Single issuer — do not hand-roll a second. |
| **Infra / deploy** | Docker + (target) Kubernetes/ECS, Turborepo monorepo, GitHub Actions CI | Matches monorepo conventions; K8s for horizontal scale. |
| **Observability** | OpenTelemetry traces, Prometheus metrics, Grafana, centralized logs | `realtime-service` already streams health to the admin Infrastructure page. |

---

## 3. Executive Dashboard (§1)

**Route:** `/admin/dashboard`. **Audience:** Super Admin, Admin, Managing Editor (widget set adapts to role).
**Performance budget:** first meaningful paint < 1.5s; all KPI tiles hydrate from **one** GraphQL
`dashboardSummary` query backed by a 60s-cached rollup — never N REST calls.

### 3.1 KPI tiles (the 11 required metrics)

| Tile | Source | Computation | Cache |
|------|--------|-------------|-------|
| **Total Articles** | `cms_contents` | `COUNT(*) WHERE content_type IN (article,encyclopedia,guide,tutorial,news,faq)` | 5 min |
| **Published Articles** | `cms_contents` | `… AND status='published'` | 5 min |
| **Drafts** | `cms_contents` | `… AND status='draft'` | 5 min |
| **Pending Reviews** | `cms_workflows` | `COUNT WHERE current_state IN (pending_review, approved)` (i.e. awaiting an editor/SEO/legal gate) | 1 min |
| **Monthly Visitors** | ClickHouse `pageviews` | `uniq(visitor_id)` over trailing 30d | 10 min |
| **Revenue** | payment/ledger + ads/affiliate rollup | sum across subscription + ad + affiliate (see [05](./05-analytics-monetization-ai.md)) | 15 min |
| **Affiliate Earnings** | `monetization.affiliate_clicks` + reconciliation | trailing-30d confirmed commissions | 15 min |
| **Top Authors** | `cms_contents` + analytics | rank by published count × views × engagement (30d) | 15 min |
| **Trending Topics** | OpenSearch + ClickHouse | velocity of views/searches by category/tag (z-score over 7d) | 10 min |
| **SEO Score** | SEO engine | weighted avg of per-article SEO checks across published set | 30 min |
| **Recent Activities** | `audit-service` feed | last N audit events (hash-chain verified) | live (WS) |

### 3.2 Layout (wireframe)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Imperialpedia Admin    [⌘K Search]      Env: prod ●   🔔 12   ☾   ◐ Managing Editor ▾     │
├──────────────┬───────────────────────────────────────────────────────────────────────────┤
│  SIDEBAR     │  Executive Dashboard                         Range: [ Last 30 days ▾ ]  ⟳   │
│  (see §15)   │                                                                            │
│              │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  Dashboard ● │  │ Total   │ │Published│ │ Drafts  │ │ Pending │ │ Monthly │ │ Revenue │  │
│  Content     │  │ 48,210  │ │ 41,990  │ │ 4,120   │ │  312    │ │ 92.4M ▲ │ │ $1.84M ▲│  │
│  Glossary    │  │  ▲ 3.1% │ │  ▲ 2.8% │ │  ▼ 1.0% │ │  ▲ 18   │ │  +6.2%  │ │  +9.4%  │  │
│  Media       │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  SEO         │  ┌─────────┐ ┌──────────────────────────────────┐ ┌──────────────────────┐│
│  Workflow    │  │Affiliate│ │  Traffic (sessions, 30d)         │ │ SEO Health           ││
│  Analytics   │  │ $214k ▲ │ │     ╭╮      ╭─╮   ╭╮             │ │   ▰▰▰▰▰▰▰▱▱  82/100  ││
│  Monetize    │  │         │ │  ╭──╯╰─╮╭──╯ ╰─╮╭╯╰──            │ │  ◔ 6 critical issues ││
│  AI Studio   │  └─────────┘ └──────────────────────────────────┘ └──────────────────────┘│
│  Users       │  ┌──────────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐│
│  Security    │  │ Top Authors (30d)        │ │ Trending Topics      │ │ Recent Activity  ││
│  Settings    │  │ 1. A. Rao   312 · 1.2M   │ │ #inflation   ▲▲      │ │ • Editor pub'd…  ││
│              │  │ 2. M. Khan  280 · 980k   │ │ #etf-basics  ▲       │ │ • SEO approved…  ││
│              │  │ 3. …                     │ │ #options     ▲       │ │ • Legal flagged… ││
│              │  └──────────────────────────┘ └──────────────────────┘ └──────────────────┘│
└──────────────┴───────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Role-adaptive widgets

- **Super Admin / Admin:** all tiles + Revenue + Security posture + service health (from `realtime-service`).
- **Managing Editor:** content/workflow/SEO/authors tiles; Revenue collapsed to a single number.
- **SEO Manager:** SEO Score promoted to hero; broken links, redirect hits, Core Web Vitals.
- **Author/Contributor:** *personal* dashboard — my drafts, my pending reviews, my article performance, my earnings. No platform-wide revenue.

### 3.4 Data contract (the single dashboard query)

```graphql
query DashboardSummary($range: DateRange!) {
  dashboard(range: $range) {
    content { total published drafts pendingReview deltaPct }
    audience { monthlyVisitors deltaPct trafficSeries { t sessions } }
    revenue { total affiliate ads subscriptions deltaPct }
    seo { score criticalIssues brokenLinks }
    topAuthors(limit: 5) { userId name published views }
    trendingTopics(limit: 6) { tag velocity }
    recentActivity(limit: 12) { id actor action target at }
  }
}
```

The resolver fans out to the per-service rollup tables (never live `COUNT(*)` on hot paths) and is
cached per `(role, range)` for 60s via `@baalvion/cache`.

---

## 4. Non-functional targets

| Concern | Target |
|---------|--------|
| Public page TTFB (cached) | < 100 ms at edge |
| Admin dashboard load | < 1.5 s FMP |
| Search p95 | < 80 ms (OpenSearch) |
| Publish → live (edge revalidate) | < 30 s |
| Availability | 99.95% public read, 99.9% admin |
| Audit immutability | WORM + hash-chain (tamper-evident) |
| Backups | PITR + nightly logical dump, tested restore (DR drill) |

See [07-uiux-roadmap-scaling.md](./07-uiux-roadmap-scaling.md) for the full 100M-MAU scaling plan.
