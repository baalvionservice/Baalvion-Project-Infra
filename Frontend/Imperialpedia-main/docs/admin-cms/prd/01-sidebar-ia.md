# 01 — Admin Sidebar & Information Architecture

> **Scope:** the complete navigation skeleton of the Imperialpedia admin — sidebar groups,
> children, routes, per-role visibility, collapse/active behavior, the global top bar,
> breadcrumbs, and responsive collapse to an icon-rail.
> **Grounds on:** the rationalized 9-group IA in [`../07-uiux-roadmap-scaling.md` §A.2](../07-uiux-roadmap-scaling.md#a2-sidebar-navigation-information-architecture),
> the role matrix in [`../04-rbac-and-workflow.md` §A.2](../04-rbac-and-workflow.md#a2-permission-matrix),
> the content types in [`../02-content-cms.md` §B](../02-content-cms.md#b-content-types-2), and the real
> scaffolded routes under `Frontend/Imperialpedia-main/src/app/admin/*`.
> **Authority rule:** the sidebar **hides or disables** items, but the *server* (rbac-service `/v1/authorize`)
> is the only authority. Nav visibility is a UX affordance derived from `GET /me/permissions`, never a security boundary.

---

## A. The 8 roles (column legend used throughout)

The canonical role set (see [`../04` §A.1](../04-rbac-and-workflow.md#a1-mapping-product-roles--platform-role-ranks)),
abbreviated for the per-row visibility tables:

| Abbr | Role | Base rank | Defining grant(s) |
|------|------|-----------|-------------------|
| **SA** | Super Admin | `super_admin` | global, bypasses all checks (break-glass, audited) |
| **AD** | Admin | `admin` | runs the site; users below admin; monetization; settings |
| **ME** | Managing Editor | `manager` | editorial calendar, final publish, scheduling |
| **ED** | Editor | `editor` | review/edit/approve within assigned categories (scope **S**) |
| **SEO** | SEO Manager | `editor` + `seo:*` | SEO review gate, redirects, sitemaps, linking |
| **LG** | Legal Reviewer | `editor` + `content:legal_review` (narrow) | legal-review queue + read only |
| **AU** | Author | `member` + `content:author` | create/edit **own**, submit; cannot publish |
| **CO** | Contributor | `member` (restricted) | drafts only; every submission reviewed |

Legend in the trees below: **●** = visible & enabled · **◐** = visible but **scope-limited** (only own / only assigned
categories / only flagged items) · **○** = visible but **disabled** (rendered, greyed, tooltip "requires <capability>") ·
blank = **hidden** (item not rendered).
Each row also names the **gating capability** from the canonical vocabulary; the server returns these in `/me/permissions`.

> **Hide vs disable — the rule.** Hide when the item would be *noise* to that role (a Contributor never needs the
> Monetization group). Disable (greyed, with a tooltip) when the item is *part of the user's mental model of their job*
> but they lack rights on this specific scope (an Author sees "Publish" disabled on the editor toolbar — it teaches the
> workflow). Whole **groups** collapse to hidden when the role has zero visible children; individual **leaves** prefer
> disable when discoverability matters. Super Admin sees everything enabled.

---

## B. The complete navigation tree

12 top-level entries (1 standalone + 11 groups). Routes that exist today are marked `[scaffolded]`; routes the IA
introduces are marked `[planned]` and slot under an existing parent so no orphan top-levels appear. The "New ▾" content
launcher and the AI-tool deep links reuse `…/content/new` and `/admin/ai*` respectively.

### B.1 Dashboard (standalone)

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Dashboard | `/admin/dashboard` `[scaffolded]` | ● | ● | ● | ● | ● | ● | ● | ● | `analytics:view` (widgets role-adapt — see [`../01` §3.3](../01-architecture-and-stack.md)) |

Always the first row; everyone lands here. Widget set is role-adaptive (personal dashboard for AU/CO/LG; revenue tiles
only for SA/AD/ME) — visibility of the *route* is universal, visibility of *tiles* is governed downstream.

### B.2 Content

Parent collapses if the role has no child. The **New ▾** split-button opens the type picker
(`/admin/content/new?type=<article|encyclopedia|financial_term|guide|tutorial|news|faq>`).

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| All Content | `/admin/content` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` (list scoped: ED→categories, AU/CO→own, LG→legal-flagged, SEO→all read) |
| New ▾ | `/admin/content/new` `[scaffolded]` | ● | ● | ● | ● | ○ | | ● | ● | `content:create` (SEO disabled: no prose authoring; LG hidden) |
| Articles | `/admin/content?type=article` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| Encyclopedia | `/admin/content?type=encyclopedia` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| Glossary Terms | `/admin/glossary` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | ◐ | ◐ | `glossary:edit` (read for all editorial; publish gated separately) |
| Guides | `/admin/content?type=guide` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| Tutorials | `/admin/content?type=tutorial` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| News | `/admin/content?type=news` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| FAQs | `/admin/content?type=faq` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `content:read` |
| Categories | `/admin/categories` `[scaffolded]` | ● | ● | ● | ◐ | | | | | `taxonomy:manage` (ED scoped to own categories) |
| Tags | `/admin/tags` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | | | `taxonomy:manage` (SEO read for linking) |

> The seven type leaves are **saved views** over the single `cms.cms_contents` table discriminated by `content_type`
> (see [`../02` §A](../02-content-cms.md#a-store-reconciliation)) — not separate tables. "Glossary Terms" deep-links to
> the structured store in `imperialpedia.glossary_terms`; the type-filtered "Encyclopedia" / "Financial Term" views read CMS.

### B.3 Editorial

The workflow surface. Built on `cms.cms_workflows` (state machine in [`../04` §B](../04-rbac-and-workflow.md#b-editorial-workflow-8)).
The **Legal Review Queue** is the *only* Editorial child a Legal Reviewer sees.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Workflow Queue (Board + Calendar) | `/admin/scheduler` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | ◐ | ◐ | `content:review` (AU/CO see only own ball-in-court; ED scoped; SEO sees SEO-gate column) |
| Reviews | `/admin/moderation` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | | | `content:review` / `content:seo_review` (SEO column only for SEO) |
| Legal Review Queue | `/admin/compliance` `[scaffolded]` | ● | ● | ◐ | | | ● | | | `content:legal_review` (ME sees but 🔒 audited; LG sole narrow scope) |
| Revisions | `/admin/content/[slug]/edit?tab=revisions` `[scaffolded]` | ● | ● | ● | ◐ | | ◐ | ◐ | | `content:rollback` (AU→own drafts, read; LG read-only) |

> "Workflow Queue" is the kanban board **and** the editorial calendar (the scaffolded `/admin/scheduler` hosts both via a
> `view=board|calendar` tab — see board wireframe in [`../04` §B.7](../04-rbac-and-workflow.md#b7-workflow-board-wireframe)).
> "Reviews" is the unified review inbox; the SEO-review and editorial-review tabs render per capability.
> "Revisions" is a content-scoped tab on the editor, surfaced in the sidebar as a jump-to for power users; the diff/rollback
> view lives in [`../04` §B.6](../04-rbac-and-workflow.md#b6-version-control--rollback).

### B.4 Media

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Library | `/admin/media` `[scaffolded]` | ● | ● | ● | ◐ | ● | ◐ | ◐ | ◐ | `media:upload` (delete gated by `media:delete`: SA/AD/ME ●, ED scoped, AU/CO **no delete**) |
| Uploads | `/admin/media?tab=uploads` `[scaffolded]` | ● | ● | ● | ● | ● | | ● | ● | `media:upload` |

> Contributors and Authors **can upload but cannot delete** (matrix: media delete = ✗ for AU/CO). The Library renders the
> delete affordance **disabled** (○ inside the grid) for them — deliberately, to teach the boundary. SEO needs media to set
> `og:image`, so it has Library/Uploads access but delete-disabled.

### B.5 SEO

Sub-routes under the scaffolded `/admin/seo` + the dedicated `/admin/seo-audit`. Redirects/Sitemaps/Internal-Links are
`[planned]` leaves under `/admin/seo/*` (the parent route exists; children are new).

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Metadata | `/admin/seo` `[scaffolded]` | ● | ● | ● | ◐ | ● | | ◐ | | `seo:metadata` (ED/AU edit own-scope meta; SEO full) |
| Redirects | `/admin/seo/redirects` `[planned]` | ● | ● | ● | | ● | | | | `seo:redirects` (backed by `cms.cms_seo_redirects`) |
| Sitemaps | `/admin/seo/sitemaps` `[planned]` | ● | ● | ● | | ● | | | | `seo:sitemaps` |
| Internal Linking | `/admin/seo/internal-links` `[planned]` | ● | ● | ● | ◐ | ● | | | | `seo:links` |
| Broken Links | `/admin/seo-audit` `[scaffolded]` | ● | ● | ● | ◐ | ● | | | | `seo:audit` (broken-link monitor + fix-its) |

> Per the matrix, **redirects/sitemaps are SEO-Manager + manager-rank only** — a plain Editor cannot manage them (✗ in
> "Manage redirects/sitemaps"). The SEO Manager owns this whole group; their dashboard promotes SEO Score to hero
> ([`../01` §3.3](../01-architecture-and-stack.md)).

### B.6 Knowledge Graph

The structured-knowledge domain in `imperialpedia-service` (`imperialpedia` schema): `glossary_terms`,
`glossary_relations`, `references`/`term_references`, plus the term taxonomy. Distinct from CMS prose.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Terms | `/admin/glossary` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | ◐ | ◐ | `glossary:edit` (publish via `glossary:publish`: SA/AD/ME ●, ED ◐) |
| Relationships | `/admin/glossary?tab=relations` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | ◐ | | `knowledge:edit` (typed related-terms graph) |
| Categories | `/admin/glossary?tab=categories` `[scaffolded]` | ● | ● | ● | ◐ | | | | | `taxonomy:manage` (term difficulty/category taxonomy) |
| References | `/admin/glossary?tab=references` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ◐ | `references:manage` (shared CSL-JSON store; cited by article blocks too) |

> "Terms" is the same canonical glossary editor as Content → Glossary Terms (one surface, two entry points). The graph,
> term-taxonomy, and reference library are tabs on `/admin/glossary` (see [`../02` §E](../02-content-cms.md#e-glossary-system-5)).
> SEO appears here (◐) because published terms feed the internal-linking dictionary and `DefinedTerm` schema.

### B.7 Analytics

Backed by ClickHouse rollups → Postgres → the GraphQL BFF. Real scaffolded sub-routes exist for most leaves.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Traffic | `/admin/analytics/traffic` `[scaffolded]` | ● | ● | ● | ◐ | ● | | ◐ | | `analytics:view` (ED/AU scoped to own content) |
| Search | `/admin/analytics/top-keywords` `[scaffolded]` | ● | ● | ● | ◐ | ● | | | | `analytics:view` (queries, zero-result gaps) |
| Revenue | `/admin/analytics/revenue` `[planned]` | ● | ● | ◐ | | ◐ | | | | `analytics:revenue` (ME sees single collapsed number; SEO sees SEO-attributed only) |
| Engagement | `/admin/analytics/engagement` `[scaffolded]` | ● | ● | ● | ◐ | ◐ | | ◐ | | `analytics:view` |

> Sub-leaves already scaffolded (`top-content`, `growth`, `creator-engagement`, `content-quality`, `traffic-sources`,
> `trending-content`, `dau`/`wau`) hang off these four as secondary tabs/cards inside each page rather than crowding the
> rail. **Revenue is the only Analytics leaf an Author/Contributor never sees** (no platform revenue on personal dashboards
> — [`../01` §3.3](../01-architecture-and-stack.md)).

### B.8 Monetization

Whole group is **manager-and-above by intent**, but the matrix restricts *managing* monetization to **SA/AD only**
("Manage monetization" = ✓ only for SA, AD). Managing Editor can *view* revenue but not configure ads/affiliates.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Ads | `/admin/ads` `[scaffolded]` | ● | ● | | | | | | | `monetization:ads` |
| Affiliates | `/admin/monetization?tab=affiliates` `[scaffolded]` | ● | ● | | | | | | | `monetization:affiliates` |
| Sponsored Content | `/admin/monetization?tab=sponsored` `[scaffolded]` | ● | ● | ◐ | | | | | | `monetization:sponsored` (ME ◐: sets sponsorship disclosure on editorial, no payout config) |
| Memberships | `/admin/monetization?tab=memberships` `[scaffolded]` | ● | ● | | | | | | | `monetization:memberships` (plans/paywall; `/admin/finance` for payouts) |

> The entire Monetization group is **hidden** for ED/SEO/LG/AU/CO (it is noise to them). Managing Editor gets a single ◐
> child (Sponsored Content) because applying the standardized sponsorship **disclosure** to an article is an editorial act;
> the financial config (rates, payouts at `/admin/finance`) stays SA/AD. See [`../05`](../05-analytics-monetization-ai.md).

### B.9 AI Tools

Provider-abstracted `ml-service` flows, governed by `imperialpedia.ai_jobs`. Tools assist; **humans gate** every output
(suggestions only — they never bypass the workflow). Deep-links into the scaffolded `/admin/ai`, `/admin/ai-hub`,
`/admin/news-ai`.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Draft Assistant | `/admin/ai?tool=draft` `[scaffolded]` | ● | ● | ● | ● | | | ● | ● | `ai:use` |
| Fact Checker | `/admin/ai?tool=factcheck` `[scaffolded]` | ● | ● | ● | ● | | ◐ | ● | ◐ | `ai:use` (LG ◐: claim-verification view in legal queue) |
| SEO Assistant | `/admin/ai?tool=seo` `[scaffolded]` | ● | ● | ● | ◐ | ● | | ◐ | | `ai:use` (meta/keyword suggestions) |
| Internal Link Assistant | `/admin/ai?tool=links` `[scaffolded]` | ● | ● | ● | ◐ | ● | | ◐ | | `ai:use` (suggests glossary/internal links) |

> `ai:configure` (model, prompts, quotas, News-AI pipeline at `/admin/news-ai`) is **SA/AD only** and lives in System →
> Settings, not here — these four leaves are *usage* surfaces, not configuration. Authors/Contributors get Draft + Fact +
> (scoped) SEO/Link assist; SEO Manager gets the SEO/Link tools. See [`../05` §AI](../05-analytics-monetization-ai.md).

### B.10 Users

Identity & RBAC management. "Manage users/roles" = ✓ only for **SA** and **AD** (AD limited to ≤ own rank). Editors and
below **do not** see this group.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Authors | `/admin/authors` `[scaffolded]` | ● | ● | ◐ | | | | | | `user:read` (ME ◐: read-only roster for assignment) |
| Editors | `/admin/users?role=editor` `[scaffolded]` | ● | ● | | | | | | | `user:manage` |
| Moderators | `/admin/creators` `[scaffolded]` | ● | ● | | | | | | | `user:manage` (community moderators + creator profiles) |
| Roles | `/admin/roles` `[scaffolded]` | ● | ◐ | | | | | | | `role:manage` (AD ◐: may bind roles **≤ own rank** only; rbac-service enforces) |

> AD's "Roles" is ◐ because the server caps AD to assigning roles **at or below** their rank (no privilege escalation) —
> the UI shows higher roles greyed. Managing Editor sees **Authors** read-only (◐) purely to pick reviewers/assignees for
> the workflow; they cannot edit users. `Moderators` reuses `/admin/creators` (the community-moderator + creator roster).
> All mutations route through `rbac-service` (no role strings hard-coded in the client — see [`../04` §A.3](../04-rbac-and-workflow.md#a3-enforcement-model-defense-in-depth)).

### B.11 System

Platform plumbing. Most leaves are **AD-and-above**; the most destructive (security settings, backup) are **SA**, with AD
🔒 (audited / step-up auth). Editorial roles do not see this group, with one exception: Audit Logs are scoped-visible to ME.

| Item | Route | SA | AD | ME | ED | SEO | LG | AU | CO | Capability |
|------|-------|----|----|----|----|-----|----|----|----|-----------|
| Audit Logs | `/admin/audit-logs` `[scaffolded]` | ● | ● | ◐ | | | | | | `audit:view` (ME ◐: own-site editorial actions only; full chain = AD+) |
| Events | `/admin/system-hub` `[scaffolded]` | ● | ● | | | | | | | `system:events` (Redis Streams / event bus monitor) |
| APIs | `/admin/api-hub` `[scaffolded]` | ● | ● | | | | | | | `system:api` (keys, rate limits, GraphQL BFF) |
| Webhooks | `/admin/api-hub?tab=webhooks` `[scaffolded]` | ● | ● | | | | | | | `system:webhooks` |
| Settings | `/admin/settings` `[scaffolded]` | ● | ◐ | | | | | | | `system:settings` (AD ◐: site settings; **security/platform settings = SA only**, 🔒) |

> **Access Logs** (`/admin/access-logs`), **Health** (`/admin/health`, `/admin/control/*`), **Feature Flags**
> (`/admin/feature-flags`), and **Backups** (`/admin/backup`) are System leaves too; to keep the rail to the five required
> rows they render as **tabs inside** `system-hub` / `settings` (Health & Incidents tab, Flags tab, Backup & DR tab — the
> latter SA-only, 🔒). `system:backup` gates the Backup tab. `community:moderate` (Moderator's defining grant) surfaces in
> Editorial → Reviews + Users → Moderators, not as a System leaf.

---

## C. Behavior specification

### C.1 Collapse / expand

- **Group accordion.** Each top-level group is a disclosure row (chevron `›`/`⌄`). Expanding a group shows its children;
  the **active group auto-expands** on navigation and stays open. Default state on first load: only the group containing
  the active route is expanded; the rest are collapsed (calm, low-noise default).
- **Persistence.** Expanded/collapsed state and rail-vs-full state persist per user in `localStorage`
  (`ipedia.admin.nav.v1`) and are restored on next visit; never stored server-side (pure UX preference).
- **Single-vs-multi.** Multiple groups *may* be open at once (it is an accordion that does not force-close siblings),
  but the auto-expand-active rule keeps the common case tidy.
- **Empty groups vanish.** If a role has zero visible children in a group, the **entire group header is hidden** (e.g.
  Contributor never sees Monetization, Users, or System). A group is never rendered as an empty, un-openable header.

### C.2 Role-based visibility (hide vs disable) — operational rule

```
for each nav node:
  caps = GET /me/permissions            # server is the authority
  if node.requiredCapability ∉ caps:
     if node.discoverabilityMatters:    # part of this role's job mental model
        render DISABLED (greyed + tooltip "Requires <capability>") and a "request access" affordance
     else:
        DO NOT RENDER (hidden)
  else if node has a narrower scope obligation (e.g. limit:own / category set):
        render ENABLED but list/detail queries are scope-filtered (◐)
  else:
        render ENABLED (●)
group.visible = any(child.visible)      # empty groups collapse to hidden
```

- **Never** rely on hide/disable for security. Direct navigation to a forbidden route is **blocked at the route group**
  (`/admin/*` requires rank ≥ `editor`; Author/Contributor get the personal subset) **and** at the API
  (`rbac-service /v1/authorize`, deny-overrides) — see [`../04` §A.3](../04-rbac-and-workflow.md#a3-enforcement-model-defense-in-depth).
  A disabled nav item that is reached by URL still returns a clean 403 view, not a broken page.
- **Capability source of truth:** the strings in the tables above (`content:read`, `seo:redirects`, `analytics:revenue`,
  `monetization:ads`, `role:manage`, `system:backup`, …) are exactly the `rbac-service` permission registry keys; the
  client only *reads* the resolved list, it never decides them.

### C.3 Active-state

- **Exact + prefix match.** A leaf is active when `pathname === href` **or** `pathname.startsWith(href + '/')` for
  hierarchical routes; query-discriminated leaves (`?type=article`) match on the parsed `type`/`tab` param so the right
  saved-view row highlights.
- **Visual treatment.** Active leaf: accent left-border (3px, the single brand accent), elevated surface tint, accent text,
  `aria-current="page"`. The active leaf's **parent group header** also takes a subtle active tint so the user can see where
  they are even when scrolled. Hover/focus/active/disabled are all distinct states (WCAG 2.2 AA, color **and** icon/text).
- **Icon rail active-state** mirrors this with an accent dot + filled icon; the active group's flyout opens its active leaf.

### C.4 Global top bar

Fixed, full-width, above the sidebar+content split (see shell in [`../07` §A.3](../07-uiux-roadmap-scaling.md#a3-dashboard--page-layout-shell)):

| Slot | Element | Behavior |
|------|---------|----------|
| Left | **Logo / wordmark** | Imperialpedia mark → clicks to `/admin/dashboard`; doubles as the rail collapse toggle on hover (chevron). |
| Center | **Command palette ⌘K** | Global search + quick actions ("publish X", "new term", "go to Redirects"). Opens on `⌘K`/`Ctrl+K` or click. Searches content (OpenSearch), nav routes, and role-permitted commands only. |
| Right | **Env badge** | `prod ●` / `staging ◐` / `dev ○` — color-coded, non-prod is visually loud to prevent mistakes. Reads the deploy env, never user-settable. |
| Right | **Notifications 🔔** | Count badge from `notification-service` in-app channel; click → panel (review requests, SLA breaches, @mentions, assignment, publish). |
| Right | **Create ⊕** | Primary action button; opens the same type picker as Content → New ▾. **Hidden** for roles without `content:create` (Legal Reviewer). |
| Right | **Theme ☾/☀** | Light/dark toggle; both themes intentional (per design direction); respects `prefers-color-scheme` on first load, then persists. |
| Right | **Avatar + role menu ▾** | Shows name + **current role badge** (e.g. "Managing Editor"); menu: Profile (`/admin/profile`), My content, Switch scope (if multi-category), Sign out. Role badge reflects the resolved role, not a self-claim. |

- **Keyboard:** `⌘K` palette, `g d` → Dashboard, `g c` → Content, `g q` → Workflow Queue, `c` → Create (quick-nav chords,
  documented in the palette help). Palette is the canonical fast-path; the rail is the slow-path.

### C.5 Breadcrumbs

- Rendered in the page header band (below the top bar), **not** in the sidebar. Shape:
  `Group ▸ Section ▸ Item` — e.g. `Content ▸ Articles ▸ "Understanding P/E Ratios"` or
  `SEO ▸ Redirects ▸ /old-url → /new-url`.
- The **first crumb is the group**, the **last crumb is the current entity** (non-link). Intermediate crumbs are links
  to the parent list. For deep editor routes, crumbs collapse with a `…` overflow menu past 4 levels.
- Breadcrumbs derive from the route + the resolved entity title (one BFF read), never from a duplicated nav config —
  single source of truth is the route tree in this doc.

### C.6 Responsive collapse → icon rail

Three responsive tiers (the admin is desktop-first; the mobile subset is specified in
[`../07` §A.4](../07-uiux-roadmap-scaling.md#a4-mobile-admin-experience)):

| Breakpoint | Sidebar form | Behavior |
|------------|--------------|----------|
| **≥ 1280px (desktop)** | Full sidebar (labels + groups) | Default; user may collapse to rail manually (persisted). |
| **768–1279px (laptop/tablet)** | **Icon rail** (icons only, ~64px) | Group icons; hover/focus opens a **flyout** with that group's children + labels. Active leaf shows accent dot. Click logo to temporarily expand to full overlay. |
| **< 768px (mobile)** | **Hidden** → hamburger / bottom tab bar | Top bar keeps logo + ⌘K + 🔔 + avatar; nav opens as a full-height **sheet** (the same tree). Mobile bottom tabs (Dashboard · Queue · Search · Alerts · Me) per the mobile spec; full block editing deferred. |

- **Icon-rail flyout** is keyboard-navigable (`↑/↓` within group, `→` to enter, `Esc` to close) and respects role
  visibility identically to the full sidebar. Tooltips name the group on hover for icon-only mode.
- **Reduced-motion** respected on every expand/collapse/flyout transition; no layout shift (skeletons reserve space).

---

## D. ASCII rendering — full expanded sidebar (desktop, Super Admin view)

The Super Admin sees every group/leaf enabled. Lower roles render the same tree with the hide/disable rules from §B
(annotated examples follow the full tree).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧ IMPERIALPEDIA      ⌘K Search content, terms, actions…        prod●  🔔12  ⊕Create  ☾  ◐ S.Admin ▾ │  top bar
├────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│  IMPERIALPEDIA · ADMIN      │  Content ▸ Articles ▸ "Understanding P/E Ratios"        [page actions]  │  breadcrumb
│                             │                                                                         │
│  ▣  Dashboard          ●    │   ┌───────────────────────────────────────────────────────────────┐   │
│                             │   │  page header (title · filters · tabs)                         │   │
│  ⌄ ▤ Content                │   ├───────────────────────────────────────────────────────────────┤   │
│      • All Content     ●    │   │                                                               │   │
│      • New ▾           ●    │   │   content region (list / editor / charts / forms)             │   │
│      • Articles        ●    │   │                                                               │   │
│      • Encyclopedia    ●    │   │                                                               │   │
│      • Glossary Terms  ●    │   └───────────────────────────────────────────────────────────────┘   │
│      • Guides          ●    │   contextual right rail (inspector / activity) — collapsible           │
│      • Tutorials       ●    │                                                                         │
│      • News            ●    │                                                                         │
│      • FAQs            ●    │                                                                         │
│      • Categories      ●    │                                                                         │
│      • Tags            ●    │                                                                         │
│                             │                                                                         │
│  › ▧ Editorial              │      (collapsed group — chevron › ; click to expand)                    │
│      Workflow Queue · Reviews · Legal Review Queue · Revisions                                        │
│                             │                                                                         │
│  › ◳ Media                  │      Library · Uploads                                                  │
│                             │                                                                         │
│  ⌄ ◎ SEO                    │                                                                         │
│      • Metadata        ●    │                                                                         │
│      • Redirects       ●    │                                                                         │
│      • Sitemaps        ●    │                                                                         │
│      • Internal Linking●    │                                                                         │
│      • Broken Links    ●    │                                                                         │
│                             │                                                                         │
│  › ▦ Knowledge Graph        │      Terms · Relationships · Categories · References                    │
│  › ◷ Analytics              │      Traffic · Search · Revenue · Engagement                            │
│  › ◐ Monetization           │      Ads · Affiliates · Sponsored Content · Memberships                 │
│  › ✶ AI Tools               │      Draft · Fact Checker · SEO Assistant · Internal Link Assistant     │
│  › ◍ Users                  │      Authors · Editors · Moderators · Roles                             │
│  › ⚙ System                 │      Audit Logs · Events · APIs · Webhooks · Settings                   │
│                             │                                                                         │
│  ─────────────────────────  │                                                                         │
│  ◐ S. Admin · prod          │                                                                         │
│  ‹ collapse to rail         │                                                                         │
└────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

**Same tree, Author (AU) view** — Monetization / Users / System **hidden**; SEO reduced; Publish-class leaves disabled:

```
┌────────────────────────────┐        ┌────────────────────────────┐        ┌──────────────────────────┐
│  IMPERIALPEDIA · ADMIN      │        │   Author view (member)     │        │  Icon rail (768–1279px)   │
│  ▣  Dashboard          ●    │        │   ● enabled                │        │  ┌──┐                     │
│  ⌄ ▤ Content                │        │   ◐ own-scope only         │        │  │▣ │  Dashboard          │
│      • All Content     ◐    │        │   ○ disabled (greyed)      │        │  ├──┤                     │
│      • New ▾           ●    │        │     w/ "requires…" tip     │        │  │▤ │◀ flyout: Content ▸  │
│      • Articles        ◐    │        │   (blank = hidden)         │        │  │  │   • All Content     │
│      • Encyclopedia    ◐    │        │                            │        │  │  │   • New ▾           │
│      • Glossary Terms  ◐    │        │  Monetization  → hidden    │        │  │  │   • Articles ●      │
│      • Guides/Tut/News/FAQ◐ │        │  Users         → hidden    │        │  ├──┤                     │
│  ⌄ ▧ Editorial              │        │  System        → hidden    │        │  │▧ │  Editorial          │
│      • Workflow Queue  ◐    │        │  (empty groups collapse)   │        │  │◳ │  Media              │
│        (own ball-in-court)  │        │                            │        │  │◎ │  SEO                │
│      • Revisions       ◐    │        │  SEO group shows only:     │        │  │▦ │  Knowledge          │
│        (own drafts, read)   │        │   • Metadata ◐ (own meta)  │        │  │◷ │  Analytics          │
│  ⌄ ◳ Media                  │        │  Reviews/Legal → hidden    │        │  │✶ │  AI Tools           │
│      • Library         ◐    │        │                            │        │  └──┘                     │
│        (no delete: ○ in grid)│       │  Editor toolbar:           │        │  hover→labels+children   │
│      • Uploads         ●    │        │   [Publish] ○ disabled     │        │  active = accent dot     │
│  ⌄ ◎ SEO                    │        │   tip: "requires          │        │  Esc closes flyout       │
│      • Metadata        ◐    │        │    content:publish"        │        │                          │
│  › ✶ AI Tools (Draft/Fact)  │        │                            │        │                          │
└────────────────────────────┘        └────────────────────────────┘        └──────────────────────────┘
```

---

## E. Cross-references (avoid duplication)

| Concern | Lives in |
|---------|----------|
| Role → rank mapping, full permission matrix, scope semantics | [`../04` §A](../04-rbac-and-workflow.md#a-roles--rbac-7) |
| Workflow state machine, Board/Calendar, Legal-routing, Revisions/Rollback | [`../04` §B](../04-rbac-and-workflow.md#b-editorial-workflow-8) |
| Content types & the single `cms_contents` table, validation | [`../02` §A–B](../02-content-cms.md#a-store-reconciliation) |
| Glossary tables, relations graph, references, tooltip/schema | [`../02` §E](../02-content-cms.md#e-glossary-system-5) |
| SEO engine, redirects (`cms_seo_redirects`), sitemaps, internal-linking, broken-links | [`../03`](../03-seo-and-media.md) |
| Media library/service | [`../03` §Media](../03-seo-and-media.md) |
| Analytics dashboards & ClickHouse rollups; Monetization; AI Studio governance | [`../05`](../05-analytics-monetization-ai.md) |
| Dashboard tiles, role-adaptive widgets, GraphQL `DashboardSummary` | [`../01` §3](../01-architecture-and-stack.md#3-executive-dashboard-1) |
| Top-bar shell, mobile subset, design direction, accessibility bars | [`../07` §A](../07-uiux-roadmap-scaling.md#a-uiux-15) |
| Enforcement (route group + BFF + rbac-service + RLS); `/me/permissions` | [`../04` §A.3](../04-rbac-and-workflow.md#a3-enforcement-model-defense-in-depth) |

> **Implementation note.** The live placeholder `Frontend/Imperialpedia-main/src/components/admin/AdminSidebar.tsx`
> (4 ad-hoc groups: Governance/Index Control/Operations/System) is **superseded** by the 12-entry tree above. The nav
> config should be a single typed structure (`navTree: NavGroup[]`) whose every leaf carries `{ label, href, icon,
> requiredCapability, scopeHint }`; visibility is computed from `/me/permissions` at render (§C.2), and `usePathname()`
> drives active-state (§C.3) — matching the existing component's `usePathname` + `cn` active pattern, just with the
> canonical groups, capabilities, and the hide/disable resolver wired in.
```
