# 02 — Dashboard & Widget Catalog (PRD)

> **Section purpose.** The Dashboard is the admin panel's landing surface and the only place every role
> lands after login. It must answer "what is the state of the platform / my work right now?" in one
> glance, in under 1.5s, while being **role-adaptive** (a Super Admin sees revenue and security posture;
> a Contributor sees only their own drafts and earnings). This document specifies the two dashboard pages
> (the role-adaptive **Executive Dashboard** and the **Author/Contributor personal dashboard**) and the
> reusable **Widget Catalog** they are assembled from. The hard architectural rule that frames everything:
> the dashboard hydrates from **one** GraphQL `dashboardSummary` query backed by 60s-cached rollups — it
> **never** issues N `COUNT(*)` calls against hot tables. See
> [01-architecture-and-stack.md §3](../01-architecture-and-stack.md) for the data contract and
> [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md) for the rollup pipeline.
> Roles and capability strings are canonical to [04-rbac-and-workflow.md](../04-rbac-and-workflow.md);
> this doc references them, it does not redefine them.

---

## Shared foundations (read once, applies to every page below)

**The single query.** All dashboard pages call exactly one read endpoint:

```
POST /graphql        # BFF, RS256-authed, body = dashboardSummary(range, scope)
```

The BFF resolver fans out **server-side** to per-service rollup tables (`analytics.*`, `monetization.*`,
`cms.*` aggregates, `audit.audit_events`), composes the result, and caches it per
`(role, scope, range)` for **60s** via `@baalvion/cache`. The browser issues **one** request; widgets
read slices of the single payload. No widget calls a service directly except the two **live** widgets
(Recent Activity and Pending Approvals refresh), which attach to the realtime WS.

**Authorization model.** The resolver is RS256-authed and asks `rbac-service` (`POST /v1/authorize`,
deny-overrides) which **fields** the caller may read, then **omits** unauthorized branches from the
payload (field-level authz, not just route-level). A Contributor's payload simply has no `revenue` node.
This means the UI cannot leak a number the role can't see, even via devtools.

**Scope.** `scope` is one of `platform` (Super Admin/Admin/Managing Editor — global aggregates) or
`mine` (Author/Contributor — filtered to `author_id = sub`). Editors/SEO/Legal get `platform` reads but
narrowed by their category/queue scope (see per-widget notes).

**Range.** `range ∈ {today, 7d, 30d, 90d, custom}`; default `30d`. Range changes refetch the single query
(cache key includes range); they do not refetch per-widget.

**Realtime.** Live widgets connect to `wss://…/?token=<jwt>` (realtime-service) and consume
`{type:'event'}` (audit/event feed) and `{type:'platform_stats'}` frames. The WS is auth'd on upgrade via
the `?token` query param; on disconnect, widgets fall back to a 30s poll of their REST source.

**Caching summary (per widget, enforced in the resolver, not the client):**

| Data class | TTL | Source of truth |
|---|---|---|
| Content counts (articles/published/drafts) | 5 min | `cms.cms_contents` aggregate |
| Workflow / pending counts | 1 min | `cms.cms_workflows` aggregate |
| Audience (visitors, traffic series) | 10 min | `analytics.traffic_daily` |
| Revenue / affiliate / MRR / churn | 15 min | `monetization.*` + ledger rollup |
| SEO score | 30 min | SEO engine rollup |
| Recent Activity | live (WS) → 30s poll fallback | `audit.audit_events` |

---

## Page A — Executive Dashboard (role-adaptive)

### Purpose
The default landing page for every staff role. One screen that adapts its widget set and visible KPIs to
the caller's role: a publishing health snapshot for editors, a revenue + security posture board for
admins, an SEO-first board for the SEO Manager, and a narrow Legal Review board for the Legal Reviewer.
It is read-only — every actionable item links into the owning section (Content, Workflow, SEO, Finance).

### Route
`/admin/dashboard`

### Components
- `DashboardShell` — page frame; owns the single `useDashboardSummary({ range, scope })` query and a
  `RangePicker` (`Today / 7d / 30d / 90d / Custom`) + manual `⟳ Refresh` (busts the 60s cache for the caller).
- `RoleAdaptiveGrid` — chooses the widget layout from the caller's role (one of 5 presets below).
- `KpiCardRow` — renders the `KpiCard` set permitted for the role (see Widget Catalog W1).
- `TrafficSparkChart` — 30d sessions area chart (Widget W7a).
- `SeoScoreGauge` — radial gauge + critical-issue count (Widget W5).
- `ContentHealthWidget` — aggregate content quality score + worst offenders (Widget W4).
- `RevenuePanel` — MRR / revenue-by-stream / churn mini-panel (Widget W6), Admin+ only.
- `TopAuthorsList`, `TrendingTopicsList` — leaderboard widgets.
- `PendingApprovalsWidget` — workflow queue summary with deep links (Widget W3).
- `RecentActivityFeed` — live audit feed (Widget W2).
- `ServiceHealthStrip` — `realtime-service` health pills (Admin/Super Admin only).
- `DashboardSkeleton`, `WidgetError`, `WidgetEmpty` — shared state components.

### Permissions required
Page access requires `analytics:view` (every staff role has it). Field/widget visibility is layered on top
via the capabilities below — the resolver omits unauthorized branches, and the grid hides the widget.

| Widget / KPI branch | Capability gate | Roles that see it (scope) |
|---|---|---|
| Content KPIs (articles/published/drafts) | `content:read` | all 8 roles (`platform`; Author/Contributor get `mine` — see Page B) |
| Pending Reviews KPI + Pending Approvals | `content:review` | Editor, Managing Editor, Admin, Super Admin (Editor scoped to assigned categories) |
| SEO Score gauge + critical issues | `seo:audit` | SEO Manager, Managing Editor, Admin, Super Admin |
| Revenue / Affiliate / MRR / churn | `analytics:revenue` | Admin, Super Admin (Managing Editor: collapsed single total only) |
| Service Health strip + security posture | `audit:view` + `system:events` | Admin, Super Admin |
| Legal Review queue card | `content:legal_review` | Legal Reviewer (only this card + activity), Admin, Super Admin |
| Trending Topics / Top Authors | `analytics:view` | all staff (`platform`) |

Role presets (which preset `RoleAdaptiveGrid` renders):
- **Super Admin / Admin** — full grid: all KPIs + Revenue + SEO + Content Health + Service Health + Top Authors + Trending + Pending + Activity.
- **Managing Editor (manager)** — content/workflow/SEO/authors/trending; Revenue collapsed to one number; no Service Health.
- **Editor (editor)** — content + Pending Approvals (scoped to assigned categories) + Content Health + Activity; no Revenue, no SEO gate beyond read.
- **SEO Manager (editor + seo:\*)** — **SEO Score promoted to hero**; broken links, redirect hits, Core Web Vitals; content KPIs secondary; no Revenue.
- **Legal Reviewer (editor + legal:review)** — **narrow**: Legal Review Queue card + read-only content list + own activity. No KPIs beyond pending-legal count.

(Author / Contributor never see this page — they are redirected to Page B. See routing note below.)

### API endpoints used
- `POST /graphql` — `dashboardSummary(range, scope)` (the only read). Resolver internally reads:
  - `cms.cms_contents` / `cms.cms_workflows` aggregates (content + workflow KPIs).
  - `analytics.traffic_daily`, `analytics.content_daily` (audience, top content).
  - `monetization.subscriptions` / `monetization.affiliate_clicks` / ledger rollup (revenue).
  - SEO engine rollup (score).
- `GET /v1/cms/websites/:websiteId/content/pending` — Pending Approvals widget refresh / "view all" deep link (cms-service).
- `GET /v1/audit?limit=12&order=desc` — Recent Activity initial load + 30s fallback poll (audit-service :3032).
- `wss://…/realtime?token=<jwt>` — live `{type:'event'}` (activity) + `{type:'platform_stats'}` (Service Health) frames (realtime-service).
- `POST /v1/authorize` — server-side field-level authz inside the resolver (rbac-service :3005).

### Database tables affected
Read-only (dashboard mutates nothing):
- `cms.cms_contents`, `cms.cms_workflows` (counts; via rollup/aggregate, never live `COUNT(*)` on hot path).
- `analytics.content_daily`, `analytics.traffic_daily` (and `analytics.search_daily` for trending).
- `monetization.subscriptions`, `monetization.affiliate_clicks`, `monetization.affiliate_links` (revenue).
- `audit.audit_events` (activity feed; WORM, read-only by definition).

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Imperialpedia Admin   [⌘K Search]     Env: prod ●   🔔 12   ☾   ◐ Managing Editor ▾        │
├──────────────┬───────────────────────────────────────────────────────────────────────────┤
│  SIDEBAR     │  Executive Dashboard                       Range:[ Last 30 days ▾ ]   ⟳     │
│              │  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐     │
│ Dashboard ●  │  │ Total  ││Publish.││ Drafts ││Pending ││Monthly ││Revenue*││ SEO    │     │
│ Content      │  │48,210  ││41,990  ││ 4,120  ││  312   ││92.4M ▲ ││$1.84M* ││82/100  │     │
│ Glossary     │  │ ▲3.1%  ││ ▲2.8%  ││ ▼1.0%  ││ ▲18    ││ +6.2%  ││ +9.4%  ││ ▰▰▰▰▱  │     │
│ Workflow     │  └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘     │
│ SEO          │  ┌────────────────────────────────┐ ┌───────────────────┐ ┌──────────────┐ │
│ Media        │  │ Traffic — sessions (30d)       │ │ SEO Health        │ │ Content      │ │
│ Analytics    │  │   ╭╮     ╭─╮    ╭╮             │ │  ▰▰▰▰▰▰▰▱▱ 82      │ │ Health 76    │ │
│ Monetize     │  │ ╭─╯╰──╮╭╯ ╰──╮╭╯╰──            │ │  ◔ 6 critical     │ │ ⚠ 14 thin    │ │
│ AI Studio    │  └────────────────────────────────┘ └───────────────────┘ └──────────────┘ │
│ Users        │  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────────────┐  │
│ Security     │  │ Pending Approvals│ │ Top Authors (30d)│ │ Recent Activity  ● live      │  │
│ Settings     │  │ ▸ Review     12  │ │ 1. A.Rao 312·1.2M│ │ • Editor published "ETFs…"  │  │
│              │  │ ▸ SEO gate    7  │ │ 2. M.Khan 280·980k│ │ • SEO approved "Inflation…" │  │
│              │  │ ▸ Legal       3  │ │ 3. …             │ │ • Legal flagged "Tax loop…" │  │
│              │  │ [ View queue → ] │ │ Trending: #etf ▲▲│ │ • Contributor submitted …   │  │
│              │  └─────────────────┘ └──────────────────┘ └─────────────────────────────┘  │
│              │  *Revenue & MRR hidden unless analytics:revenue (Admin / Super Admin).      │
└──────────────┴───────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases
- **Loading:** `DashboardSkeleton` renders the grid shape with shimmer KPI cards; no layout shift on hydrate
  (cards reserve final height). FMP budget < 1.5s; the single query is the only blocking request.
- **Empty:** fresh tenant with no content → KPIs show `0` (not blank); Top Authors / Trending / Activity show
  `WidgetEmpty` with a contextual CTA ("Create your first article →" deep link to `/admin/content/new`).
- **Error (whole query fails):** full-page `WidgetError` with retry; last successfully cached payload is shown
  stale with a "data may be 5 min old" banner rather than a blank screen (stale-while-revalidate).
- **Partial error:** if one resolver branch fails (e.g. SEO engine down), that widget shows `WidgetError`
  inline while the rest of the dashboard renders — the resolver returns `null` for that branch, not a 500.
- **Role downgrade mid-session:** if a role loses a capability, the next 60s refetch omits the branch and the
  widget disappears; the client never trusts a previously-cached privileged value.
- **Range = custom > 90d:** resolver caps the window and warns ("ranges beyond 90 days use daily rollups only").
- **Authz edge:** Legal Reviewer hitting `/admin/dashboard` gets the narrow preset, not a 403 — the page is
  shared; only fields differ.

---

## Page B — Author / Contributor Personal Dashboard

### Purpose
The personal landing page for **Author** (`member + content:author`) and **Contributor** (`member`,
restricted). It answers "what is mine and what's happening to it?" — my drafts, my submissions awaiting
review, how my published work is performing, and (for revenue-share authors) my earnings. It deliberately
shows **no platform-wide** metrics: no global revenue, no other authors' content, no security posture.
Contributor is a further-restricted variant of Author (drafts-only emphasis, no earnings if not eligible).

### Route
`/admin/dashboard` (same route; `RoleAdaptiveGrid` detects `roles ∋ {author|contributor}` and renders the
personal preset with `scope = 'mine'`). No separate URL — one route, role-adaptive payload.

### Components
- `DashboardShell` (shared) with `scope='mine'` forced; `RangePicker` limited to `7d/30d/90d`.
- `MyWorkKpiRow` — personal `KpiCard` set: **My Drafts**, **My Pending Reviews**, **My Published**,
  **Changes Requested** (items bounced back to me), **My Earnings** (Author only, if revenue-share).
- `MyDraftsList` — my draft + changes-requested items with "Continue editing" / "Submit for review" actions
  (links to `/admin/content/[slug]/edit`).
- `MyPendingReviewsList` — items I submitted, with current workflow state + who's reviewing + time-in-queue.
- `MyArticlePerformance` — per-article views / dwell / engagement for my published set (mine only).
- `MyEarningsWidget` — trailing-period revenue-share total + per-article breakdown (Author + revenue-share
  flag only; hidden entirely for Contributor and non-revenue-share authors).
- `MyActivityFeed` — audit events scoped to `actor = me` OR `target ∈ my content`.
- `WritingStreakBadge` (light gamification) — drafts created / submitted this week (optional, non-blocking).

### Permissions required
Page access requires `content:read` (both roles have it). Per-widget:

| Widget | Capability | Author | Contributor | Scope note |
|---|---|---|---|---|
| My Drafts / Changes Requested | `content:edit.own` | ✅ | ✅ | filtered `author_id = sub` (RLS-enforced) |
| My Pending Reviews | `content:submit` | ✅ | ✅ | items where `submitted_by = sub` |
| My Published + performance | `content:read` + `analytics:view` | ✅ | ✅ (read) | `content_daily` filtered to my `content_id`s |
| My Earnings | `analytics:revenue` *(scoped to self)* | ✅ if revenue-share | ❌ hidden | own payout rollup only — never platform revenue |
| My Activity | `audit:view` *(self-scoped)* | ✅ | ✅ | `actor = sub` OR target in my content |

Hard restriction (Contributor): no `content:publish`, no `media:delete`, no Earnings; every submission is
reviewed. The personal dashboard surfaces this with a persistent "All your submissions are reviewed before
publishing" helper line.

### API endpoints used
- `POST /graphql` — `dashboardSummary(range, scope:'mine')`. Resolver reads, filtered to `author_id = sub`:
  - `cms.cms_contents` (my drafts / published / changes-requested counts + lists).
  - `cms.cms_workflows` (my pending reviews + their states/time-in-queue).
  - `analytics.content_daily` (my article performance — only my `content_id`s).
  - own payout rollup over `monetization.*` (my earnings — never aggregate platform revenue).
- `GET /v1/cms/websites/:websiteId/content?author=<sub>&status=draft` — "My Drafts" list refresh (cms-service).
- `GET /v1/articles?author=<sub>` — published read-projection for my-performance linking (imperialpedia-service).
- `GET /v1/audit?actor=<sub>&limit=12` — my activity feed (audit-service).
- `POST /v1/authorize` — confirms self-scope; rejects any attempt to widen `author_id` (rbac-service).

### Database tables affected
Read-only, all filtered to the caller (`author_id`/`submitted_by` = `sub`, enforced by `@baalvion/tenancy`
RLS so a crafted query cannot widen scope):
- `cms.cms_contents` (my drafts/published/changes-requested).
- `cms.cms_workflows` (my submissions' workflow state).
- `analytics.content_daily` (my article performance — my content ids only).
- `monetization.affiliate_clicks` / payout rollup (my earnings — Author revenue-share only).
- `audit.audit_events` (my activity — actor/target scoped).
- `imperialpedia.articles` (read projection, for resolving published slugs/titles in performance list).

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Imperialpedia Admin   [⌘K Search]                          🔔 3   ☾   ◐ A. Rao (Author) ▾  │
├──────────────┬───────────────────────────────────────────────────────────────────────────┤
│  SIDEBAR     │  My Dashboard                                  Range:[ Last 30 days ▾ ]      │
│ (author set) │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ Dashboard ●  │  │My Drafts│ │ Pending │ │Published│ │Changes Req'd │ │ My Earnings*     │ │
│ My Content   │  │   7     │ │   3     │ │   142   │ │     2  ⚠      │ │  $214.50  ▲ 9%   │ │
│ Drafts       │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘ └──────────────────┘ │
│ Media        │  ┌───────────────────────────────┐ ┌───────────────────────────────────┐  │
│              │  │ My Drafts & Changes Requested │ │ My Pending Reviews                │  │
│              │  │ • "Index funds 101"   draft   │ │ • "REITs explained" → in review   │  │
│              │  │ • "Tax-loss harvest"  ⚠ chg   │ │   editor: M.Khan · 4h in queue    │  │
│              │  │   [ Continue → ]              │ │ • "Bond ladders" → SEO gate · 1d  │  │
│              │  └───────────────────────────────┘ └───────────────────────────────────┘  │
│              │  ┌───────────────────────────────┐ ┌───────────────────────────────────┐  │
│              │  │ My Article Performance (30d)  │ │ My Activity                       │  │
│              │  │ 1. "ETF basics"  88k · 3:12   │ │ • You submitted "REITs explained" │  │
│              │  │ 2. "What is APR" 51k · 2:40   │ │ • Editor requested changes on …   │  │
│              │  │ 3. …                          │ │ • You published "ETF basics"      │  │
│              │  └───────────────────────────────┘ └───────────────────────────────────┘  │
│              │  *Earnings shown only for revenue-share Authors; Contributors never see it. │
└──────────────┴───────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases
- **Empty (new author, zero content):** KPIs all `0`; My Drafts shows a prominent "Write your first
  article" CTA → `/admin/content/new`; Performance and Earnings show `WidgetEmpty` ("Performance appears
  after your first article is published").
- **Contributor variant:** Earnings widget is **absent from the DOM** (not just hidden via CSS) because the
  resolver omits the branch — verifiable in devtools that no earnings number is delivered.
- **Changes-requested highlight:** items in `changes_requested` are visually flagged (amber) and sorted to
  the top of My Drafts, because they need the author's action to re-enter the workflow.
- **Stale performance:** `content_daily` is a daily rollup, so "today" shows yesterday's numbers with a
  "performance updates daily" note; no live counter promised here.
- **Loading/Error:** same skeleton + stale-while-revalidate + per-widget `WidgetError` behavior as Page A.
- **Edge — author promoted to Editor mid-session:** on next refetch they get the Page A editor preset; no
  re-login needed. **Edge — IDOR attempt:** any request widening `author_id` beyond `sub` is rejected
  upstream (RLS + rbac authz); the UI has no affordance to do so.

---

## Widget Catalog (reusable components)

Each widget below is a standalone, reusable component. It declares its **data source**, **refresh/cache**,
and **required permission**. Widgets read from the single `dashboardSummary` payload unless marked **(live)**,
in which case they additionally attach to the realtime WS. No widget issues a raw `COUNT(*)`; all counts come
from rollups/aggregates resolved server-side.

### W1 — KPI Cards
- **Purpose:** single-number tiles with a trailing-period delta (▲/▼ %) and sparkline. The canonical KPI set:
  **Total Articles, Published, Drafts, Pending Reviews, Monthly Visitors, Revenue, Affiliate Earnings, SEO
  Score** (plus personal variants: My Drafts/Pending/Published/Changes/Earnings).
- **Component:** `KpiCard` (+ `KpiCardRow` / `MyWorkKpiRow` containers).
- **Data source & computation:**
  - Total Articles — `cms.cms_contents COUNT WHERE content_type IN (article,encyclopedia,financial_term,guide,tutorial,news,faq)` (rollup).
  - Published — `… AND status='published'`. Drafts — `… AND status='draft'`.
  - Pending Reviews — `cms.cms_workflows COUNT WHERE current_state IN (pending_review, seo_review, legal_review, approved)`.
  - Monthly Visitors — `analytics.traffic_daily SUM(uniques)` over trailing 30d (ClickHouse-backed rollup).
  - Revenue — ledger + `monetization.*` (subscriptions + ads + affiliate).
  - Affiliate Earnings — `monetization.affiliate_clicks` confirmed commissions, trailing 30d.
  - SEO Score — SEO engine weighted avg across published set.
- **Refresh / cache:** content KPIs 5 min; Pending 1 min; visitors 10 min; revenue/affiliate 15 min; SEO 30 min.
- **Permission:** `content:read` (content KPIs); `content:review` (Pending); `analytics:view` (visitors);
  `analytics:revenue` (Revenue, Affiliate); `seo:audit` (SEO Score). Personal KPIs inherit `scope='mine'`.

### W2 — Recent Activity Feed **(live)**
- **Purpose:** chronological stream of audited platform actions (publish, approve, request-changes, role
  change, login, settings change), hash-chain verified. The platform's "what just happened" pulse.
- **Component:** `RecentActivityFeed` (+ `ActivityRow`, `LiveBadge`).
- **Data source:** `audit-service` — initial `GET /v1/audit?limit=12&order=desc`; live frames via realtime WS
  `{type:'event'}`. Each row carries `{ actor, action, target, at }`. WORM table `audit.audit_events`.
- **Refresh / cache:** **live** (WS push); 30s REST poll fallback on WS disconnect; no client cache beyond the
  visible window.
- **Permission:** `audit:view`. Self-scoped (`actor = sub`) variant for Author/Contributor personal feed.

### W3 — Pending Approvals (workflow queue) **(live count)**
- **Purpose:** triage widget summarizing the editorial queue by gate (Review / SEO / Legal / Scheduled),
  with counts and a deep link into the Workflow section. The editor's primary call-to-action.
- **Component:** `PendingApprovalsWidget` (+ `QueueRow` with per-gate count + deep link).
- **Data source:** `cms.cms_workflows` grouped by `current_state`; refresh via
  `GET /v1/cms/websites/:websiteId/content/pending` (cms-service `wfCtrl.listPending`). Count delta can be
  pushed live via WS `{type:'event'}` filtered to workflow transitions.
- **Refresh / cache:** 1 min (count); list fetched on demand when expanded / "View queue →".
- **Permission:** `content:review` (Editor sees only their assigned categories — scope `S`); `content:seo_review`
  surfaces the SEO gate row to the SEO Manager; `content:legal_review` surfaces the Legal gate to the Legal
  Reviewer. Managing Editor / Admin / Super Admin see all gates.

### W4 — Content Health Score
- **Purpose:** aggregate editorial quality posture — average AI/heuristic content quality score across the
  published set plus a count of "needs attention" items (thin content, missing meta, stale, no internal links).
- **Component:** `ContentHealthWidget` (+ `HealthBar`, `OffendersList`).
- **Data source:** `cms.cms_contents.custom_fields/seo_metadata` quality signals aggregated with
  `analytics.content_daily` (engagement) and the AI content-scoring rollup (`imperialpedia.ai_jobs` of
  `kind='score'`). Surfaced as a 0–100 score + worst-N list with deep links to `/admin/content/[slug]/edit`.
- **Refresh / cache:** 30 min (advisory metric, not time-critical).
- **Permission:** `content:read` to view the score; `content:edit.any` to action offenders inline (Editor+).

### W5 — SEO Score Gauge
- **Purpose:** radial gauge of the platform-wide SEO health score with a critical-issue count and broken-link /
  redirect-hit summary; promoted to **hero** on the SEO Manager preset.
- **Component:** `SeoScoreGauge` (+ `IssueCounter`, links to `/admin/seo-audit`).
- **Data source:** SEO engine rollup (weighted avg of per-article checks across published set);
  broken-links/redirect-hits from the SEO/redirects store. Reads `cms.cms_contents.seo_metadata` aggregates.
- **Refresh / cache:** 30 min.
- **Permission:** `seo:audit` (SEO Manager, Managing Editor, Admin, Super Admin). `seo:redirects` /
  `seo:links` gate the drill-down actions, not the gauge view.

### W6 — Revenue Widgets (MRR · revenue-by-stream · churn)
- **Purpose:** the money board — Monthly Recurring Revenue, revenue split by stream (ads / affiliate /
  subscriptions), and churn rate, with trailing-period deltas. Collapsed to a single total for Managing Editor.
- **Component:** `RevenuePanel` (+ `MrrCard`, `RevenueByStreamChart`, `ChurnCard`).
- **Data source:** `monetization.subscriptions` (MRR, churn — active/past_due/canceled lifecycle),
  `monetization.affiliate_clicks` + `monetization.affiliate_links` (affiliate revenue), ad logs/rollup (ads),
  reconciled through the platform ledger (single source of truth for settlement). See
  [05-analytics-monetization-ai.md §B](../05-analytics-monetization-ai.md).
- **Refresh / cache:** 15 min.
- **Permission:** `analytics:revenue` (Admin, Super Admin full; Managing Editor: single collapsed total only;
  all other roles: omitted from payload). Author "My Earnings" is a **self-scoped** payout rollup, not this widget.

### W7 — Audience / Traffic & Trending widgets
- **W7a `TrafficSparkChart`** — 30d sessions/uniques area chart. Source `analytics.traffic_daily`; cache 10 min;
  permission `analytics:view`.
- **W7b `TopAuthorsList`** — rank authors by `published × views × engagement` (30d). Source `cms.cms_contents` +
  `analytics.content_daily`; cache 15 min; permission `analytics:view` (platform scope only).
- **W7c `TrendingTopicsList`** — 7-day z-score on views/searches per tag. Source `analytics.search_daily` +
  `analytics.content_daily` + OpenSearch; cache 10 min; permission `analytics:view`.
- **W7d `ServiceHealthStrip`** — service-up pills + platform stats. Source realtime-service WS
  `{type:'platform_stats'}`/`{type:'service_health'}`; **live**; permission `audit:view` + `system:events`
  (Admin / Super Admin only).

### Widget cross-cutting rules
- Every widget renders one of: `data` | `WidgetEmpty` | `WidgetError` | skeleton — never a bare crash.
- A widget the caller lacks permission for is **omitted from the resolver payload** and therefore absent from
  the DOM (defense in depth: route authz + field authz + UI gate).
- Live widgets degrade to polling on WS loss; cached widgets never block first paint (stale-while-revalidate).
- No widget triggers a write; all "action" affordances are deep links into the owning section.
```
