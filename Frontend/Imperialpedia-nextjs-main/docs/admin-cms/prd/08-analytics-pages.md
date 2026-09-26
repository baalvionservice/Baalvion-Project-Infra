# 08 — Analytics Dashboards (PRD)

> **Section purpose.** This document specifies every page in the Imperialpedia admin **Analytics** surface
> (`/admin/analytics/*`). Analytics is a **read-only intelligence surface**: it never writes editorial or
> domain state — it visualizes pre-aggregated metrics so editors, managers, SEO, and admins can decide what
> to commission, fix, promote, or kill. At 100M MAU the raw event firehose lives in **ClickHouse**
> (`pageviews`, `events`, `search_queries`, partitioned by day); the admin **never scans raw events**.
> Scheduled hourly/daily rollups materialize into Postgres `analytics.*` summary tables, and every dashboard
> reads those (cached via `@baalvion/cache`, single-flight, tenant-scoped). Real-time tiles are the only
> exception: they stream from `realtime-service` over WebSocket. The dashboard read-composition uses the
> **GraphQL BFF**; drill-downs and exports use REST `/v1/analytics/*`. This section cross-references
> [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md) §A (pipeline + rollup schema),
> [01-architecture-and-stack.md](../01-architecture-and-stack.md) (Executive Dashboard),
> [03-seo-and-media.md](../03-seo-and-media.md) (Search Console / SEO), and
> [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) (role ranks + the canonical permission matrix).

## Conventions for this section

- **Envelope:** all REST reads return `{ success, data, error, meta:{ total, page, limit } }`.
- **Range param:** every analytics endpoint accepts `?range=` (`24h | 7d | 28d | 90d | 12m | custom`); `custom`
  adds `from`/`to` ISO dates. `?granularity=` (`hour | day | week | month`) controls the time-series bucket.
- **Auth:** RS256 JWT (`@baalvion/auth-node`, issuer `baalvion-auth`, aud `baalvion-platform`). Every page is
  authorized at the BFF/route gate via `rbac-service` `/v1/authorize` (deny-overrides) **and** re-checked
  server-side. Client render-gating is UX only, never the security boundary.
- **The capability gate for analytics is `analytics:view`.** Money-bearing tiles/columns (revenue, ARPU, MRR,
  churn, payouts, ad/affiliate revenue) are gated by the stricter **`analytics:revenue`** and are *redacted*
  (not just hidden) for roles that lack it.
- **Reads, never writes.** No page in this section mutates `cms.*` or `imperialpedia.*`. The only side effects
  are: (a) export jobs (audited), and (b) "create draft from content gap" / "open in editor" actions that
  **hand off** to the Content surface ([02-content-cms.md](../02-content-cms.md)) — those carry their own
  `content:create` checks there.
- **Roles** referenced are the 8 canonical roles: Super Admin, Admin, Managing Editor, Editor, SEO Manager,
  Legal Reviewer, Author, Contributor (ranks `viewer<member<editor<manager<admin<owner<super_admin`).

### Who can see what (analytics access summary)

| Role | `analytics:view` | `analytics:revenue` | Scope notes |
|------|:---:|:---:|---|
| Super Admin | ✅ | ✅ | Global; bypasses all checks (audited break-glass). |
| Admin | ✅ | ✅ | Full analytics incl. money. |
| Managing Editor | ✅ | ✅ | Editorial + revenue (owns the calendar/P&L view). |
| Editor | ✅ | ❌ | Content/traffic/search/engagement **scoped to assigned categories S**; revenue redacted. |
| SEO Manager | ✅ | ❌ | Full traffic/search/engagement (SEO needs the whole funnel); revenue redacted. |
| Legal Reviewer | ❌ | ❌ | **No analytics.** Sees only the Legal Review Queue ([04](../04-rbac-and-workflow.md)). |
| Author | ✅ (own) | ❌ | **Author scorecard scope only** — own content metrics; no platform-wide tiles, no revenue. |
| Contributor | ❌ | ❌ | No analytics surface (drafts-only role). |

> **Scope S (category scoping):** Editors and Authors get an ABAC obligation from `rbac-service` that injects a
> `category_in[...]` (Editor) or `author_id=self` (Author) filter into every analytics query. The BFF applies
> the obligation server-side; the UI shows a "Scoped to: <categories>" chip so the user knows the numbers are
> filtered.

---

## Overview — `/admin/analytics`

**Purpose.** The analytics landing page: a single-screen executive summary of platform health (traffic,
engagement, growth, search, and — for revenue-cleared roles — money) with deep-link tiles into each
specialized dashboard. This is the "is the platform healthy today?" page. It complements (does not duplicate)
the global Executive Dashboard in [01-architecture-and-stack.md](../01-architecture-and-stack.md): that one is
cross-domain ops; this one is the analytics index + KPI roll-up.

**Route.** `/admin/analytics` (scaffolded: `src/app/admin/analytics/page.tsx`, with `overview/` and
`full-overview/` variants for the expanded view).

**Components.**
- `AnalyticsHeader` — title, global `RangePicker` (`?range=`) that propagates to every tile, `ExportMenu`.
- `KpiTileGrid` — 8 KPI cards: Sessions, Uniques, Pageviews, Avg dwell, Bounce, New vs Returning split,
  DAU/MAU stickiness ratio, and (revenue-gated) MRR. Each card shows value + WoW delta sparkline.
- `RevenueSummaryCard` — gated by `analytics:revenue`; renders a redaction placeholder otherwise.
- `TrafficSparkArea`, `GrowthSparkLine` — mini time-series (recharts `AreaChart`/`LineChart`).
- `TopContentMini` + `ZeroResultMini` — top-5 risers and top-5 zero-result queries (deep-links).
- `DashboardLinkCards` — navigation cards to Traffic / Search / Engagement / Top Content / Growth / Revenue.
- `RealtimeNowBadge` — live "active readers now" pulled from `realtime-service`.
- `ScopeChip` — shows category/author scope when the viewer is an Editor/Author.

**Permissions required.** `analytics:view` to load the page; money tiles additionally require
`analytics:revenue`. Roles: Super Admin, Admin, Managing Editor (full); Editor, SEO Manager (no revenue);
Author (own-scope KPI subset). Legal Reviewer, Contributor: **403 → redirected to their landing**.

**API endpoints used.**
- `POST /graphql` (BFF) — `analyticsOverview(range)` composes traffic + engagement + growth + top + revenue in
  one round-trip (server applies revenue redaction + scope obligations).
- `GET /v1/analytics/traffic?range=` — fallback / tile refresh.
- `GET /v1/analytics/growth?range=` — DAU/MAU stickiness tile.
- `GET /v1/analytics/revenue?range=` — only called when token carries `analytics:revenue`.
- `WSS realtime-service /analytics` — `active_readers_now`.

**Database tables affected (read-only).** `analytics.traffic_daily`, `analytics.content_daily`,
`analytics.search_daily`, `analytics.growth_daily`, `analytics.revenue_daily` (money, gated). Raw source of
truth: ClickHouse `pageviews`/`events`/`search_queries` (never read directly by the admin).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Analytics ▸ Overview                       [ Range: 28d ▾ ]   [ Export ▾ ]   │
│                                             ● 4,812 reading now (live)         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─Sessions──┐ ┌─Uniques───┐ ┌─Pageviews─┐ ┌─Avg dwell─┐                       │
│ │  18.4M     │ │  9.1M     │ │  61.2M    │ │  3m 12s   │   ▲ WoW deltas        │
│ │  ▲ +6.2%   │ │  ▲ +4.8%  │ │  ▲ +7.1%  │ │  ▼ −1.4%  │                       │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘                       │
│ ┌─Bounce────┐ ┌─New/Return┐ ┌─DAU/MAU────┐ ┌─MRR ($) ──────────────┐          │
│ │  41.3%     │ │ 63% / 37% │ │  0.21      │ │  ▓▓ REDACTED ▓▓        │  ◀ no   │
│ └───────────┘ └───────────┘ └───────────┘ └─ needs analytics:revenue┘   rev   │
│                                                                                │
│ ┌── Traffic (28d) ───────────────┐ ┌── User growth (28d) ───────────────┐     │
│ │  ╱╲    ╱╲╱╲                     │ │  ╱──────╱───                         │    │
│ └────────────────────────────────┘ └─────────────────────────────────────┘    │
│ ┌── Top risers ───────────┐ ┌── Zero-result queries (content gaps) ──────┐    │
│ │ 1. What is a REIT  ▲312% │ │ "covered call collar"      1,204  →[draft] │    │
│ │ 2. SIP vs lumpsum  ▲180% │ │ "gilt vs t-bill india"       980  →[draft] │    │
│ └─────────────────────────┘ └────────────────────────────────────────────┘    │
│ [ Traffic ] [ Search ] [ Engagement ] [ Top Content ] [ Growth ] [ Revenue ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states.** *Loading:* skeleton KPI cards + shimmer charts (BFF query in flight). *Empty:*
"No data for this range yet — rollups run hourly" with the last successful rollup timestamp. *Error:* if the
BFF composite fails, degrade to per-tile REST calls and show a per-card error chip rather than a blank screen;
if `realtime-service` WS is down, the live badge shows "live unavailable" (page still renders from rollups).

**Edge cases.** Rollup lag (today's bucket is partial) → label current bucket "in progress, partial"; never
imply a drop is real when it's just an incomplete day. Revenue redaction must happen **server-side** in the
BFF resolver — never ship money numbers to a client that lacks `analytics:revenue` and hide them in CSS.

---

## Traffic — `/admin/analytics/traffic`

**Purpose.** Audience acquisition and reach: sessions / unique visitors / pageviews over time, broken down by
**source** (organic/direct/referral/social/email/paid), **country**, and **device**, plus a **real-time "now"**
panel of active readers and top live pages. Answers "where is traffic coming from, on what, and is anything
spiking right now?"

**Route.** `/admin/analytics/traffic` (scaffolded; sibling deep-dives `traffic-sources/`, `traffic-trends/`).

**Components.**
- `TrafficKpiRow` — Sessions, Uniques, Pageviews, Pages/Session, Avg session duration (rollup-derived).
- `TrafficTimeSeries` — recharts `LineChart`/`AreaChart`, switchable metric + `?granularity=`.
- `SourceBreakdownDonut` — `by_source` JSONB → donut + legend with WoW deltas.
- `CountryChoropleth` + `CountryTable` — `by_country` JSONB; map + sortable table (top 50, paginated).
- `DeviceBreakdownBars` — `by_device` JSONB (desktop/mobile/tablet) split.
- `RealtimeNowPanel` — live active readers, top live pages, live referrers (WebSocket; auto-reconnect).
- `RangePicker`, `ExportButton`, `ScopeChip`.

**Permissions required.** `analytics:view`. Roles: Super Admin, Admin, Managing Editor, **SEO Manager**
(primary user — owns acquisition), **Editor** (scoped to assigned categories S — country/device still global
but content-attributed rows are filtered). Author: own-content traffic only. No revenue columns here, so
`analytics:revenue` is not required. Legal Reviewer / Contributor: 403.

**API endpoints used.**
- `GET /v1/analytics/traffic?range=&granularity=&dimension=source|country|device` — primary series + breakdowns.
- `GET /v1/analytics/traffic/export?range=&format=csv` — CSV export (rate-limited, audited).
- `WSS realtime-service /analytics` — `active_readers_now`, `top_live_pages`, `live_referrers`.

**Database tables affected (read-only).** `analytics.traffic_daily` (`sessions`, `uniques`, `pageviews`,
`new_users`, `returning_users`, `by_source jsonb`, `by_country jsonb`, `by_device jsonb`). Real-time panel:
ClickHouse rolling window via `realtime-service` (no Postgres). Raw: ClickHouse `pageviews`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Analytics ▸ Traffic                        [ Range: 7d ▾ ] [ day ▾ ] [Export]│
├──────────────────────────────────────────────────────────────────────────────┤
│  Sessions 18.4M ▲6%   Uniques 9.1M ▲5%   PV 61.2M ▲7%   Pg/Sess 3.3   4m08s   │
│ ┌── Sessions over time ─────────────────────────────────────────────────────┐ │
│ │      ╱╲      ╱╲                                                            │ │
│ │  ╱╲╱   ╲╱╲╱╱   ╲___                          [ Sessions ▾ | Uniques | PV ] │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│ ┌── By source ──────┐ ┌── By country (top) ──────┐ ┌── ● Real-time now ─────┐  │
│ │  Organic    58% ◔ │ │ US ████████ 31%          │ │ 4,812 reading now      │  │
│ │  Direct     19%   │ │ IN ██████   22%          │ │ ▸ /terms/etf      612   │  │
│ │  Referral   11%   │ │ UK ███      9%           │ │ ▸ /guide/roth-ira 480   │  │
│ │  Social      8%   │ │ … (50 rows, paginated)   │ │ src: google 71%        │  │
│ │  Email/Paid  4%   │ │                          │ │ (ws: live · streaming) │  │
│ └───────────────────┘ └──────────────────────────┘ └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states.** *Loading:* skeleton KPI row + chart shimmer; the real-time panel shows
"connecting…". *Empty:* a brand-new install with no rollups shows an onboarding card ("traffic appears once the
collector + first daily rollup run"). *Error:* time-series and breakdowns fail independently (Promise.allSettled
in the BFF) so one bad JSONB column doesn't blank the page; WS failure degrades the real-time panel to a
"reconnecting" state with exponential backoff, leaving rollup charts intact.

**Edge cases.** `by_country`/`by_source`/`by_device` are JSONB blobs — guard against missing/renamed keys
(`unknown` bucket for unmapped sources). Bot/crawler traffic is excluded upstream in the rollup, not in the
admin — surface a tooltip "humans only (bots filtered at ingest)". Partial current-day bucket labeled
"in progress". GDPR: country/device come from privacy-respecting 1st-party signals; no PII rows.

---

## Search — `/admin/analytics/top-keywords`

**Purpose.** On-site search intelligence and the **content-gap finder**. Three jobs: (1) top internal queries
by volume, (2) **zero-result queries** — high-volume searches that return nothing, the single most actionable
editorial signal (each is a missing article/glossary term), and (3) average **click position** (how far down
the results users click — a relevance-quality signal). This page is the bridge from "what readers want" to
"what we should write next," feeding the AI Article Generator and the editorial backlog (see
[05](../05-analytics-monetization-ai.md) §A.4 content-gap engine, and AI tools in §C).

**Route.** `/admin/analytics/top-keywords` (scaffolded). Note: this is **on-site search** (search-service /
internal `search_daily`). External **SERP/Search Console** keywords live in the SEO surface
([03-seo-and-media.md](../03-seo-and-media.md)) — cross-referenced, not duplicated here.

**Components.**
- `SearchKpiRow` — total searches, distinct queries, **zero-result rate %**, avg click position, search→click CTR.
- `TopQueriesTable` — query, count, avg click position, result count, trend; row action "open in search-service".
- `ZeroResultPanel` — **the content-gap finder**: zero-result queries sorted by volume, with a one-click
  **"Create draft"** (hands off to `/admin/content/new?title=<query>&source=content-gap`) and **"Send to AI
  Generator"** action. Shows whether a near-match glossary term already exists (dedupe hint).
- `ClickPositionHistogram` — distribution of clicked positions (1..N+), to spot "answer is buried" cases.
- `QueryTrendSparkline` — per-query 7-day z-score (trending detection).
- `RangePicker`, `ExportButton`, `ScopeChip` (Editor scope filters queries that resolved into their categories).

**Permissions required.** `analytics:view`. The **"Create draft" / "Send to AI" handoffs additionally require
`content:create`** (Author/Editor/Manager/Admin have it; SEO Manager does not by default → the button is
disabled with a tooltip "needs content:create", but the zero-result *insight* is fully visible to SEO).
Roles: Super Admin, Admin, Managing Editor, Editor (scoped S), SEO Manager, Author (own-scope). Legal Reviewer
/ Contributor: 403.

**API endpoints used.**
- `GET /v1/analytics/search?range=&type=top|zero_result|click_position` — primary, paginated (`meta.total`).
- `GET /v1/analytics/search/export?range=&type=zero_result&format=csv` — content-gap export for editorial planning.
- `GET /v1/search/lookup?q=<query>` (search-service, :3036) — dedupe hint: does a term/article already match?
- `POST /graphql` — `contentGapSuggestions(range)` joins zero-result queries with existing-coverage check.
- Handoff (not on this page's write path): `POST /v1/content` happens in the Content surface after handoff.

**Database tables affected (read-only).** `analytics.search_daily` (`day`, `query`, `count`, `no_results`,
`avg_click_pos`). Dedupe/coverage check reads OpenSearch indices via search-service and (read-only)
`imperialpedia.glossary_terms` / the `imperialpedia.articles` read-projection. Raw: ClickHouse `search_queries`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Analytics ▸ Search                         [ Range: 28d ▾ ]        [ Export ] │
├──────────────────────────────────────────────────────────────────────────────┤
│  Searches 4.1M   Distinct 220k   Zero-result 12.4% ▲  Avg click pos 2.3       │
│ ┌── Top queries ─────────────────┐ ┌── ⚠ Zero-result queries = content gaps ─┐│
│ │ query           cnt   pos      │ │ query                 vol   coverage     ││
│ │ etf              91k   1.4      │ │ covered call collar  1,204  none [+Draft]││
│ │ roth ira         70k   1.8      │ │ gilt vs t-bill IN      980  none [+Draft]││
│ │ compound interest 64k  2.1      │ │ sortino ratio          640  term✓ [AI]   ││
│ │ … (paginated, meta.total)      │ │ … sorted by volume, dedupe-hinted        ││
│ └────────────────────────────────┘ └──────────────────────────────────────────┘│
│ ┌── Click position distribution ───────────────────────────────────────────┐  │
│ │ pos1 ████████  pos2 █████  pos3 ███  pos4 █  pos5+ █   (lower = better)    │  │
│ └────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states.** *Loading:* table skeletons. *Empty:* "no searches in range" (top) /
"no zero-result queries — coverage looks healthy" (the good empty state, with a green check). *Error:* if the
search-service dedupe lookup times out, still render the zero-result list but mark coverage as "unknown" rather
than blocking the gap finder.

**Edge cases.** Normalize queries before aggregating (lowercase, trim, collapse whitespace) so "ETF " and "etf"
are one row — done in the rollup, but display the canonical form. Strip/aggregate obvious PII-shaped or abusive
queries from the visible list (still counted, shown as a redacted bucket). A query can be "zero-result" because
of a transient index outage — cross-check `search_daily.no_results` against a minimum sample (`count >= N`) so a
one-off blip isn't promoted as a content gap. The "Create draft" handoff must pre-fill but **not** auto-publish
(human-in-the-loop, per [04](../04-rbac-and-workflow.md) workflow).

---

## Revenue — `/admin/analytics` (revenue view) → `/admin/analytics/revenue`

**Purpose.** The money dashboard: revenue **by stream** (ads, affiliate, sponsored, subscriptions/memberships),
**ARPU**, **MRR**, and **churn**, plus new/expansion/contraction/canceled MRR movement. This is the financial
read view; the operational management of those streams (ad units, affiliate links, plans, subscription
lifecycle) lives in the Monetization/Finance surfaces described in
[05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md) §B — this page only **reads settled,
rolled-up money** (all settlement flows through the platform ledger, the single source of truth).

**Route.** `/admin/analytics/revenue` (a dedicated route; also surfaced as the revenue view inside
`/admin/analytics` and linked from `/admin/finance`). Where the scaffold lacks a `revenue/` folder, this is the
one new route this section introduces; otherwise reuse the existing analytics revenue view.

**Components.**
- `RevenueKpiRow` — Total revenue, MRR, ARPU, ARPPU, Churn %, LTV (all `analytics:revenue`-gated).
- `RevenueByStreamStacked` — stacked area/bar: ads / affiliate / sponsored / subscriptions over time.
- `MrrMovementWaterfall` — new / expansion / contraction / churned MRR (waterfall chart).
- `ChurnCohortHeatmap` — subscription churn by signup cohort.
- `StreamBreakdownTable` — per-stream revenue, share %, WoW/MoM delta; drill to source surface.
- `RevenueAttributionPanel` — top content by attributed revenue (ties affiliate/sub conversions back to the
  article that drove them); deep-links to Top Content.
- `RangePicker`, `ExportButton` (export itself requires `analytics:revenue`), `RedactionGuard` wrapper.

**Permissions required.** `analytics:view` **AND `analytics:revenue`**. Roles with access: **Super Admin,
Admin, Managing Editor** only. Editor, SEO Manager, Author see a **redaction placeholder** (the route loads but
the BFF resolver returns redacted fields + a "you don't have revenue access" notice — money is never sent to
the client). Legal Reviewer, Contributor: 403 at the route gate.

**API endpoints used.**
- `GET /v1/analytics/revenue?range=&granularity=&stream=ads|affiliate|sponsored|subscriptions` — primary series.
- `GET /v1/analytics/revenue/mrr?range=` — MRR movement (new/expansion/contraction/churn).
- `GET /v1/analytics/revenue/attribution?range=` — revenue-attributed top content.
- `GET /v1/analytics/revenue/export?range=&format=csv` — gated CSV (audited; `analytics:revenue`).
- `POST /graphql` — `revenueOverview(range)` composes streams + MRR + churn (server enforces the gate).

**Database tables affected (read-only).** `analytics.revenue_daily` (revenue by stream + subscription metrics
rollup) and `analytics.content_daily.revenue_cents` (per-content attribution). Source-of-truth tables (read for
reconciliation links, not scanned here): `monetization.subscriptions`, `monetization.plans`,
`monetization.affiliate_links`/`affiliate_clicks`, `monetization.sponsored_content`, and the platform **ledger**
(authoritative settled money). Raw events: ClickHouse `events` (ad impressions/clicks, conversions).

**Empty/Loading/Error states.** *Loading:* gated skeleton (no number flash). *Empty:* "no revenue recorded in
range." *Redacted (no `analytics:revenue`):* a single card — "Revenue analytics requires the `analytics:revenue`
capability. Contact an Admin." — no partial numbers, no axes, no totals. *Error:* if ledger reconciliation lags
the rollup, show a "figures pending settlement reconciliation" banner with the as-of timestamp.

**Edge cases.** Revenue must reconcile to the ledger — if `revenue_daily` and the ledger diverge beyond a
tolerance, flag the variance rather than silently trusting the rollup. FX: multi-currency revenue is normalized
to a reporting currency in the rollup; show the currency + FX-as-of date. Refunds/chargebacks are negative
movements — never drop them. Sponsored content excluded from "objective" content rankings but **included** in
revenue (label it). All redaction is **server-side** in the resolver.

---

## Engagement — `/admin/analytics/engagement`

**Purpose.** Content quality and stickiness: average **dwell time**, **scroll depth**, **pages/session**,
**bounce rate**, and **returning vs new** readers — the signals that say whether content actually holds
attention (not just attracts clicks). Powers editorial decisions about depth, structure, and which formats keep
readers. Pairs with Content Scoring (AI, [05](../05-analytics-monetization-ai.md) §C) and Top Content.

**Route.** `/admin/analytics/engagement` (scaffolded; siblings `engagement-trends/`, `engagement-category/`,
`content-quality/`).

**Components.**
- `EngagementKpiRow` — Avg dwell, Avg scroll %, Pages/session, Bounce %, Returning share %.
- `DwellScrollScatter` — per-content scatter (dwell × scroll) to find "high-traffic, low-engagement" outliers.
- `BounceTrendLine`, `ReturningVsNewArea` — trends over `?range=`.
- `EngagementByCategoryBars` — dwell/scroll/bounce grouped by content category (Editor scope filters this).
- `EngagementLeaderboardTable` — top/bottom content by engagement; deep-link to the content editor + scorecard.
- `RangePicker`, `ExportButton`, `ScopeChip`.

**Permissions required.** `analytics:view`. Roles: Super Admin, Admin, Managing Editor, Editor (scoped S),
SEO Manager, Author (own-scope). No money columns → `analytics:revenue` not required. Legal Reviewer /
Contributor: 403.

**API endpoints used.**
- `GET /v1/analytics/engagement?range=&dimension=overall|category|content` — KPIs + breakdowns.
- `GET /v1/analytics/top-content?range=&sort=engagement&order=asc|desc` — engagement leaderboard (shared endpoint).
- `GET /v1/analytics/engagement/export?range=&format=csv`.

**Database tables affected (read-only).** `analytics.content_daily` (`avg_dwell_ms`, `scroll_pct`, `views`,
`uniques`, `shares`, `saves`), `analytics.traffic_daily` (`new_users`, `returning_users` for returning-vs-new;
`pageviews`/`sessions` for pages/session and bounce). Joined to the `imperialpedia.articles` read-projection /
`cms.cms_contents` for titles + category. Raw: ClickHouse `pageviews.dwell_ms`/`scroll_pct`.

**Empty/Loading/Error states.** *Loading:* KPI skeletons + scatter shimmer. *Empty:* "not enough engagement
samples in range." *Error:* per-widget error chips; the scatter degrades to the leaderboard table if the
per-content series is too large to plot.

**Edge cases.** Dwell is noisy — exclude background tabs / outlier sessions upstream (winsorized in the rollup);
note the methodology in a tooltip. Bounce definition (single-pageview session) is configured in the rollup —
state it on the page so editors interpret consistently. "High traffic + low dwell" is the actionable quadrant —
highlight it. Scroll % on infinite/very-long pages is capped at 100%.

---

## Top Content — `/admin/analytics/top-content`

**Purpose.** Ranked content performance: best (and worst) content by **views**, **engagement**, and (gated)
**revenue**, plus **risers & decliners** (velocity / 7-day z-score) so editors can double down on momentum and
triage decay. This is the editorial "what's working" board and the source of the dashboard "Top Content" and
"Trending Topics" tiles (see [05](../05-analytics-monetization-ai.md) §A.4 trending detection).

**Route.** `/admin/analytics/top-content` (scaffolded; siblings `trending-content/`, `content-quality/`).

**Components.**
- `SortControls` — sort by Views | Engagement | Revenue (revenue option gated) | Velocity; asc/desc.
- `TopContentTable` — rank, title, category, author, views, dwell, scroll, shares/saves, (gated) revenue, Δ%.
- `RisersDeclinersSplit` — two compact lists (▲ risers / ▼ decliners) by velocity z-score.
- `TrendingTopicsTags` — trending tags (7-day z-score on views/searches per tag).
- `ContentSparkline` — inline per-row trend; row deep-links to the content editor + AI scorecard.
- `RangePicker`, `ExportButton`, `ScopeChip`.

**Permissions required.** `analytics:view`; the **revenue sort/column requires `analytics:revenue`** (hidden +
sort option removed for roles without it). Roles: Super Admin, Admin, Managing Editor (full incl. revenue);
Editor (scoped S, no revenue), SEO Manager (no revenue), Author (own-scope, no revenue). Legal Reviewer /
Contributor: 403.

**API endpoints used.**
- `GET /v1/analytics/top-content?range=&sort=views|engagement|revenue|velocity&order=&category=&limit=` — paginated.
- `GET /v1/analytics/top-content/trending?range=` — trending tags/topics.
- `GET /v1/analytics/top-content/export?range=&sort=&format=csv`.
- `POST /graphql` — `topContent(range, sort)` joins rollup metrics with CMS titles/authors in one read.

**Database tables affected (read-only).** `analytics.content_daily` (all per-content metrics incl.
`revenue_cents`, gated). Joined to `cms.cms_contents` (canonical title, category, author, status) and the
`imperialpedia.articles` read-projection. Trending also reads tag aggregates derived from `content_daily` +
`search_daily`. Raw: ClickHouse `pageviews`/`events`.

**Empty/Loading/Error states.** *Loading:* table skeleton. *Empty:* "no published content with metrics in
range." *Error:* if the CMS title join fails, still render rows keyed by `content_id` with a "title
unavailable" placeholder rather than dropping the row.

**Edge cases.** Velocity needs a baseline — content younger than the z-score window shows "new" instead of a
misleading spike. Decliners must exclude intentionally archived/seasonal content (cross-check
`cms_contents.status`). Revenue ranking excludes sponsored content from "objective" ordering (it appears in
revenue but is labeled). Scope chips must be honored before ranking so an Editor's "top content" is genuinely
their categories, not the platform's.

---

## User Growth — `/admin/analytics/growth`

**Purpose.** Audience growth and health: **signups**, **activation**, **DAU / WAU / MAU**, the **DAU/MAU
stickiness ratio**, and **retention cohorts** (how many of cohort N are still active in week 1, 2, 4…). Answers
"are we growing a loyal audience, or churning through one-time visitors?" Combines analytics rollups with
identity signals. Dedicated DAU/WAU views are scaffolded for the active-user time series.

**Route.** `/admin/analytics/growth` (scaffolded; siblings `dau/`, `wau/`).

**Components.**
- `GrowthKpiRow` — Signups, Activation rate, DAU, WAU, MAU, DAU/MAU stickiness.
- `ActiveUsersTimeSeries` — DAU/WAU/MAU overlay (`?granularity=`).
- `RetentionCohortGrid` — triangular cohort heatmap (signup cohort × weeks-since).
- `SignupFunnel` — visitor → signup → activation → returning (with drop-off %).
- `NewVsReturningArea` — reuses traffic new/returning split, framed as growth.
- `RangePicker`, `ExportButton`.

**Permissions required.** `analytics:view`. Growth is platform-wide audience data, **not category-scoped**, so
Editors/Authors who can see it see the global figures (no per-category obligation applies meaningfully here);
in practice this is primarily a **Manager/Admin/Super Admin** dashboard. SEO Manager: included (acquisition →
activation is their funnel). No money → `analytics:revenue` not required. Legal Reviewer / Contributor: 403.

**API endpoints used.**
- `GET /v1/analytics/growth?range=&metric=dau|wau|mau|signups|activation&granularity=` — active-user series + KPIs.
- `GET /v1/analytics/growth/cohorts?range=&window=weekly|monthly` — retention cohort matrix.
- `GET /v1/analytics/growth/funnel?range=` — signup/activation funnel.
- `GET /v1/analytics/growth/export?range=&format=csv`.

**Database tables affected (read-only).** `analytics.growth_daily` (`day`, `signups`, `activated`, `dau`,
`wau`, `mau`, cohort/retention aggregates) and `analytics.traffic_daily` (`new_users`/`returning_users`).
Identity context (registered-user counts, activation definition) joins read-only against the identity domain via
its API, not by cross-schema query. Raw: ClickHouse `events` (`signup`, `subscribe`, activation events).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Analytics ▸ User Growth                    [ Range: 90d ▾ ] [ week ▾ ][Export]│
├──────────────────────────────────────────────────────────────────────────────┤
│  Signups 412k ▲9%   Activation 38%   DAU 1.9M   WAU 6.4M   MAU 18M   D/M 0.21 │
│ ┌── DAU / WAU / MAU ─────────────────────────────────────────────────────────┐│
│ │  MAU ────────────────────────────                                          ││
│ │  WAU ─────────────                          [ DAU ▾ | WAU | MAU | overlay ] ││
│ │  DAU ───────                                                                ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ ┌── Retention cohorts (weekly) ──────────────┐ ┌── Signup funnel ───────────┐ │
│ │ cohort   W0    W1    W2    W4               │ │ Visitors   100%            │ │
│ │ Apr-W1  100%  44%   31%   22%               │ │  └ Signup    3.1%          │ │
│ │ Apr-W2  100%  47%   33%   24%               │ │     └ Activate 38%         │ │
│ │ Apr-W3  100%  49%   …                       │ │        └ Returning 21%     │ │
│ └─────────────────────────────────────────────┘ └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states.** *Loading:* KPI + cohort-grid skeletons. *Empty:* "growth data starts
accumulating after the first daily rollup; cohorts need ≥1 full window." *Error:* if the identity join fails,
render rollup-only metrics (DAU/WAU/MAU from events) and mark signup/activation as "identity unavailable."

**Edge cases.** Cohort cells need a minimum cohort size (`n >= threshold`) before showing a % — otherwise show
`n<thr` to avoid noisy small-cohort percentages. "Activation" definition is configurable (e.g., 2nd session
within 7 days) — surface the definition in a tooltip so it's auditable. DAU/MAU stickiness compares same-period
windows — never mix ranges. Re-activated dormant users are distinct from new signups; don't double-count.

---

## Cross-cutting: exports, audit, caching, real-time

- **Exports.** Every dashboard exposes a `GET .../export?format=csv` (and the read-only analytics API for BI
  tools). Exports are **rate-limited** and **audited** — an export emits a `baalvion:events` record consumed by
  `audit-service` (:3032, WORM + hash-chain). Revenue exports require `analytics:revenue`.
- **Audit.** Viewing redaction-sensitive surfaces (Revenue) and any export is recorded with `audit:view`-class
  provenance so "who pulled the money numbers" is answerable.
- **Caching.** All `analytics.*` reads go through `@baalvion/cache` (read-through Redis, single-flight,
  tenant-scoped keys, short TTL per range bucket). Live tiles bypass cache (WebSocket).
- **Real-time.** Only `realtime-service` WebSocket data is live; everything else is rollup-backed and labeled
  with a "data as of <rollup timestamp>" footer so users never mistake cached rollups for real-time.
- **Tenancy.** `@baalvion/tenancy` RLS scopes every rollup read to the org; ABAC obligations from
  `rbac-service` add category/author scoping on top.
