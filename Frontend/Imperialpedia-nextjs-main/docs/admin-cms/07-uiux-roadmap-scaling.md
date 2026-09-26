# 07 — UI/UX, Navigation, Roadmap, Priority Matrix & 100M-User Scaling

Covers **§15 (UI/UX)** plus the program-level deliverables: **Navigation Structure**, **User Flow Diagrams**,
**Development Roadmap**, **Feature Priority Matrix**, and the **Enterprise Scaling Plan for 100M+ monthly users**.

---

## A. UI/UX (§15)

### A.1 Design direction (anti-template)

Not a default shadcn dashboard. Direction: **"editorial control room"** — a calm, dense, information-first
admin with a distinct typographic identity (serif display for headings echoing the encyclopedia brand,
clean grotesk for UI), a restrained ink-on-paper palette with one decisive accent, semantic status colors,
real hover/focus/active states, and depth via layered surfaces (not flat cards). Light **and** dark both
intentional. WCAG 2.2 AA throughout (the admin is a professional tool used all day).

Design tokens, typography, and component structure already exist in
[`docs/design-tokens.md`](../design-tokens.md), [`docs/design-principles.md`](../design-principles.md),
and [`docs/component-structure.md`](../component-structure.md) — the admin extends those, it does not fork them.

### A.2 Sidebar navigation (information architecture)

Grouped, collapsible, role-filtered (items hidden if you lack the capability). Matches the existing
`src/app/admin/*` route tree, rationalized into 9 groups:

```
IMPERIALPEDIA ADMIN
├─ ▣ Dashboard                         /admin/dashboard
├─ ▤ Content
│   ├─ All Content                     /admin/content
│   ├─ New ▾ (Article/Encyc/Term/…)    /admin/content/new
│   ├─ Categories                      /admin/categories
│   ├─ Tags                            /admin/tags
│   ├─ Pages                           /admin/pages
│   └─ Editorial Workflow              /admin/scheduler  (board + calendar)
├─ ▦ Glossary                          /admin/glossary
├─ ◳ Media Library                     /admin/media
├─ ◎ SEO
│   ├─ Overview                        /admin/seo
│   ├─ Audit & Fix-its                 /admin/seo-audit
│   ├─ Redirects                       /admin/seo/redirects
│   ├─ Sitemaps & Robots               /admin/seo/sitemaps
│   └─ Internal Linking                /admin/seo/internal-links
├─ ◷ Analytics
│   ├─ Overview / Traffic / Engagement
│   ├─ Top Content / Keywords / Growth
│   └─ SEO / Revenue                   /admin/analytics/*
├─ ◐ Monetization
│   ├─ Ads / Affiliate / Sponsored     /admin/ads · /admin/monetization
│   ├─ Plans & Subscriptions
│   └─ Finance / Payouts               /admin/finance
├─ ✶ AI Studio                         /admin/ai · /admin/ai-hub · /admin/news-ai
├─ ☷ Community & Moderation            /admin/community · /admin/moderation · /admin/compliance
└─ ⚙ Administration
    ├─ Users & Roles                   /admin/roles · /admin/authors · /admin/creators
    ├─ Security & Audit                /admin/security · /admin/audit-logs · /admin/access-logs
    ├─ System & Health                 /admin/health · /admin/control/* · /admin/system-hub
    ├─ Feature Flags & Experiments     /admin/feature-flags · /admin/control/experiments
    ├─ API & Integrations              /admin/api-hub
    └─ Settings & Backups              /admin/settings · /admin/backup
```

### A.3 Dashboard & page layout shell

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ◧ logo   ⌘K Global search………………………   env●  🔔  ⊕Create  ☾  Avatar(role) ▾            │ topbar
├───────────┬──────────────────────────────────────────────────────────────────────────┤
│           │  Breadcrumb ▸ Section                              [page actions]          │
│  SIDEBAR  │  ┌────────────────────────────────────────────────────────────────────┐  │
│ (groups,  │  │  Page header (title, filters, tabs)                                │  │
│  collap-  │  ├────────────────────────────────────────────────────────────────────┤  │
│  sible,   │  │                                                                    │  │
│  role-    │  │   Content region (tables / editor / charts / forms)                │  │
│  filtered)│  │                                                                    │  │
│           │  └────────────────────────────────────────────────────────────────────┘  │
│           │  contextual right rail (inspector / activity) — collapsible               │
└───────────┴──────────────────────────────────────────────────────────────────────────┘
```

Standard layouts: **List** (filter bar + table + bulk actions + pagination), **Editor** (canvas + inspector,
see [02](./02-content-cms.md)), **Detail** (header + tabs + activity), **Dashboard** (KPI grid + charts),
**Form/Settings** (sectioned), **Board** (workflow kanban). All share the shell, keyboard shortcuts, and
command palette (⌘K) for navigation + quick actions ("publish X", "new term").

### A.4 Mobile admin experience

The full editor is desktop-first, but the admin is **responsive with a mobile-optimized subset** for the
on-call/traveling editor:

- **Mobile-first tasks:** review queue, approve/request-changes, publish/schedule, comment/@mention reply,
  glance dashboard KPIs, moderation actions, alerts/notifications, broken-link & incident triage.
- **Pattern:** bottom tab bar (Dashboard · Queue · Search · Alerts · Me), sheet-based detail, swipe actions
  on queue cards (approve/changes), large tap targets, offline-tolerant read.
- **Deferred on mobile:** full block editing (read + minor text edits only), bulk ops, complex settings.
- A future **native/PWA** wrapper enables push notifications for SLA breaches and assignments.

### A.5 Accessibility & quality bars

- WCAG 2.2 AA; full keyboard operability (editor included); visible focus; reduced-motion respected.
- Every interactive control has hover/focus/active/disabled states; status uses color **and** icon/text.
- Loading = skeletons (no layout shift); optimistic updates with rollback + visible error on failure.

---

## B. User flow diagrams

### B.1 Author publishes an article

```
Author ─create draft─▶ write blocks (autosave) ─▶ SEO inspector green? ─no─▶ fix
   │                                                     │yes
   └─submit for review─▶ [pending_review] ─Editor─▶ approve ─▶ [seo_review] ─SEO Mgr─▶ approve
                                   │reject↺                          │reject↺
                                   ▼                                 ▼
                          changes_requested ◀──────────────── (legal-sensitive?) ─yes─▶ [legal_review] ─▶ approve
                                                                                                   │
                          [approved] ─Managing Editor─▶ publish/schedule ─▶ [published] ─▶ CDN revalidate
                                                                                          + read-model project
                                                                                          + search index + notify
```

### B.2 Reader uses the glossary

```
Reader hovers a term ─▶ tooltip API (shortDef, difficulty) ─▶ click ─▶ glossary page
   (full def + formula(KaTeX) + worked examples + related-terms graph + references + linked deep-dive article)
   ─▶ "Calculate" on formula ─▶ interactive calculator (imperialpedia-service)
```

### B.3 SEO Manager fixes a content gap

```
Search Queries dashboard ─▶ zero-result high-volume query ─▶ "create brief" ─▶ AI draft (ai_jobs)
   ─▶ assign Author ─▶ workflow ─▶ publish ─▶ internal-link auto-wired ─▶ re-crawl ─▶ rank
```

### B.4 New admin user onboarding

```
Admin invites user (role) ─▶ email (notification-service) ─▶ accept ─▶ set password + enforce 2FA(editor+)
   ─▶ rbac-service binds role+scope ─▶ first login ─▶ role-adaptive dashboard
```

---

## C. Development roadmap

Sequenced to ship value early by **leaning on what exists** (CMS spine, imperialpedia domain, platform services).

| Phase | Theme | Scope | Exit criteria |
|-------|-------|-------|---------------|
| **0 — Foundation (wk 1–2)** | Reconcile stores | Extend `content_type` enum; demote `articles` to read-projection + projector consumer; wire admin `/content` to `cms-service`; capability API (`/me/permissions`). | One canonical content store; admin lists real CMS content. |
| **1 — Editor & Content (wk 3–6)** | Block editor + types | TipTap block editor → `content_blocks`; all 7 content types + validation; references/footnotes/citations; math/finmath blocks; autosave + revisions UI. | Author can write/version any content type. |
| **2 — Workflow & RBAC (wk 6–8)** | Editorial pipeline | SEO + Legal gates; transition service (atomic + audit); comments/suggestions; approvals + notifications; permission matrix in `rbac-service`; 2FA enforcement. | Contributor→…→Publish works end-to-end with audit. |
| **3 — SEO & Media (wk 8–11)** | Discoverability | SEO score engine + inspector; schema markup; sitemaps/robots; redirect manager; internal-linking + broken-link monitor; media-service + library + image optim/CDN + alt-text. | Published pages are technically SEO-complete; media governed. |
| **4 — Glossary (wk 10–12)** | Encyclopedia core | Glossary tables + admin; tooltip API; related-terms graph; auto-linking; DefinedTerm schema; OpenSearch synonyms. | Investopedia-grade glossary live. |
| **5 — Analytics (wk 12–15)** | Measurement | Collector + ClickHouse + rollups; 7 dashboards; content-gap engine; author scorecards; real-time readers. | Dashboard KPIs are real, not mocked. |
| **6 — Monetization (wk 15–18)** | Revenue | Ads, affiliate, sponsored (+disclosures), plans/subscriptions (reuse payment stack), entitlements, paywall meter. | Revenue tiles real; subscriptions transact. |
| **7 — AI Studio (wk 16–20)** | Leverage | Generator, SEO optimizer, scoring, fact-check, linking, summaries, FAQ; ai_jobs governance; News AI; RAG over corpus. | AI assists every editorial step (human-gated). |
| **8 — Scale & Hardening (wk 20–24)** | 100M-ready | Read replicas, partitioning, edge cache strategy, k8s autoscale, load/chaos tests, security review, DR drill, observability SLOs. | Meets §D scaling targets under load test. |

> Phases overlap; the order reflects dependency, not strict serialization. Each phase ends with code review +
> security review + a tested checkpoint (per the platform's quality gates).

---

## D. Feature Priority Matrix

Impact × Effort, anchored to "what makes Imperialpedia a credible encyclopedia at scale."

```
        HIGH IMPACT
            ▲
   P0/Now   │  • Store reconciliation        • Block editor + content types
 (do first) │  • Editorial workflow + RBAC   • SEO score + schema + sitemaps
            │  • Glossary + auto-linking      • Media library + image optim
            │  • Auth/2FA/audit/RLS
            ├───────────────────────────────────────────────────────────────
   P1/Next  │  • Analytics + content-gap      • Subscriptions/paywall
            │  • Redirect + broken-link mon.  • AI summaries/SEO/linking
            │  • Real-time co-editing          • Ads + affiliate
            ├───────────────────────────────────────────────────────────────
   P2/Later │  • AI article generator+RAG     • News AI pipeline
            │  • i18n/translations            • Native/PWA mobile admin
            │  • Experiments/feature flags     • Advanced revenue-share payouts
            └───────────────────────────────────────────────────────────────────▶
              LOW EFFORT                                          HIGH EFFORT
```

| Priority | Definition | Gate |
|----------|------------|------|
| **P0** | Cannot launch a credible encyclopedia/CMS without it | Phases 0–4 |
| **P1** | Needed for growth, monetization, and editor efficiency | Phases 5–7 |
| **P2** | Differentiators & long-tail; sequence after product-market fit | Phase 7–8+ |

---

## E. Enterprise scaling plan — 100M+ monthly visitors

The workload is **massively read-dominant** (an encyclopedia is read ~1000:1 vs written). Scale the read
path aggressively at the edge; keep the write path (editorial) modest and correct.

### E.1 Traffic shape & strategy

- ~100M MAU ≈ **3–5k req/s average, 20–40k req/s peak** on public reads; **publishes are dozens/min**.
- **Cache-first:** published pages are static-ish → serve from **CDN edge** (Cloudflare) with ISR/stale-while-
  revalidate; origin sees a tiny fraction. Target **>95% edge hit ratio**, public TTFB < 100ms.

### E.2 Layered scaling

| Layer | Tactic |
|-------|--------|
| **Edge/CDN** | Cache published HTML + JSON-LD + images; edge redirects; WAF + rate limit; image transform at edge; multi-region POPs; on publish → targeted purge/revalidate (don't blow the whole cache). |
| **App (Next.js)** | RSC + ISR; stateless pods behind HPA (k8s) scaling on CPU/RPS; regional deploys; static assets immutable-hashed. |
| **API services** | Stateless, horizontally autoscaled; per-service; circuit breakers + bulkheads; Redis-backed rate limits; graceful degradation (search down → Postgres FTS fallback, already a pattern). |
| **Read DB** | Postgres primary (writes) + **N read replicas** (public reads) via PgBouncer; replica lag tolerated for non-critical reads; connection pooling. |
| **Write DB** | Editorial writes are low-volume → single primary is fine; protect with idempotency + optimistic concurrency. |
| **Search** | OpenSearch cluster, sharded + replicated; async indexing from publish events; query-result cache. |
| **Analytics** | ClickHouse cluster ingesting the event firehose; rollups feed Postgres; never query raw events from admin. |
| **Cache** | Redis cluster (`@baalvion/cache`) read-through + single-flight (stampede protection) + tenant-scoped keys; TTL profiles. |
| **Media** | Object store (S3/R2) + CDN; immutable content-hashed derivatives; never serve originals. |
| **Events** | Redis Streams now; **graduate hot topics to Kafka/Redpanda** for the analytics firehose at this scale. |

### E.3 Reliability & operations

- **SLOs:** 99.95% public read availability; error budget policy; p95 search < 80ms; publish→live < 30s.
- **Multi-region** active-active for reads (edge + regional replicas); single-region primary for writes
  (or globally-distributed Postgres if write geo-latency matters later).
- **Observability:** OTel traces + Prometheus/Grafana + centralized logs + RUM (CWV); `realtime-service` for
  live health; alerting on SLO burn.
- **DR:** PITR + tested cross-region restore (the platform already proved a row-for-row DR drill); RPO ≤ 5min,
  RTO ≤ 1h; game-days.
- **Cost control:** cache hit ratio is the #1 cost lever; tier cold storage; autoscale to zero on non-prod;
  AI cost capped per `ai_jobs` quotas.
- **Resilience tactics:** graceful degradation per dependency, load shedding under overload, chaos testing
  before peak events, read-only mode for editorial during incidents (public reads unaffected).

### E.4 Capacity guardrails

- Content scale: 1–10M articles/terms → Postgres + OpenSearch handle this comfortably with partitioning + indexes.
- Revisions/audit/analytics are the growth tables → **partition + archive**; never let them bloat the hot path.
- The editorial write path is the bottleneck-that-isn't; the engineering effort goes into the **read/edge**
  path and **search/analytics** clusters.

---

## F. Deliverables checklist (where each lives)

| Deliverable | Location |
|-------------|----------|
| Complete CMS Specification | this doc set (`README` + 01–07) |
| Complete Database Schema | [06 §B](./06-security-database-api.md#b-database-architecture-13) + schemas inline in 02/03/04/05 |
| Admin Dashboard Wireframes | [01 §3.2](./01-architecture-and-stack.md), [02 §C/§D.3](./02-content-cms.md), [04 §B.7](./04-rbac-and-workflow.md), [07 §A.3](#a3-dashboard--page-layout-shell) |
| Navigation Structure | [07 §A.2](#a2-sidebar-navigation-information-architecture) |
| User Flow Diagrams | [07 §B](#b-user-flow-diagrams) |
| API Documentation | [06 §C](./06-security-database-api.md#c-api-architecture-14) |
| Development Roadmap | [07 §C](#c-development-roadmap) |
| Feature Priority Matrix | [07 §D](#d-feature-priority-matrix) |
| Enterprise Scaling Plan (100M+) | [07 §E](#e-enterprise-scaling-plan--100m-monthly-visitors) |
