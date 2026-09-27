# 06 — SEO Management (Admin Pages PRD)

> **Section:** §4 SEO Management — admin page specifications.
> **Grounded in:** [`../03-seo-and-media.md`](../03-seo-and-media.md) §A, the real CMS migrations under
> `Backend/services/knowledge/cms-service/migrations/`, and the canonical RBAC capability vocabulary.
> **Sibling sections:** content workflow → [`02-content-pages.md`](./02-content-pages.md);
> roles & permission matrix → [`04-rbac-pages.md`](./04-rbac-pages.md); audit/system → [`07-system-pages.md`](./07-system-pages.md).

SEO is existential for an encyclopedia at 100M MAU, so this section treats SEO as a first-class
operations console rather than a per-page metadata afterthought. These six admin pages give the
SEO Manager, Managing Editor, and Admin a closed-loop workflow — **measure** (Overview/Audit + Core Web
Vitals), **fix** (Metadata manager, Internal Linking, Broken Links), and **govern** (Redirects, Sitemaps
& Robots). All reads compose through the GraphQL BFF for the dashboard tiles; all mutations are RS256-authed
and authorized through `rbac-service` (`/v1/authorize`, deny-overrides) against the capability strings
listed per page. Data lives in the `cms` schema: existing `cms.cms_contents`, `cms.cms_seo_redirects`,
`cms.cms_media_references`, plus the SEO-specific tables `cms.seo_settings`, `cms.seo_scores`,
`cms.seo_link_checks`, and `cms.internal_links` defined in [`../03-seo-and-media.md`](../03-seo-and-media.md) §A.3.

**Role access summary for this section** (canonical roles: Super Admin, Admin, Managing Editor, Editor,
SEO Manager, Legal Reviewer, Author, Contributor):

| Page | View | Mutate |
|------|------|--------|
| SEO Overview / Audit | SEO Manager, Editor, Managing Editor, Admin, Super Admin | recompute: SEO Manager, Editor (scope), Admin, Super Admin |
| Metadata Manager | SEO Manager, Editor (scope), Managing Editor, Admin, Super Admin | SEO Manager, Editor (scope), Admin, Super Admin |
| Redirects | SEO Manager, Admin, Super Admin | SEO Manager, Admin, Super Admin |
| Sitemaps & Robots | SEO Manager, Admin, Super Admin | SEO Manager (sitemaps), Admin/Super Admin (robots) |
| Internal Linking | SEO Manager, Editor, Managing Editor, Admin, Super Admin | SEO Manager, Editor (scope) |
| Broken Links | SEO Manager, Editor, Managing Editor, Admin, Super Admin | SEO Manager, Admin, Super Admin |

Author, Contributor, and Legal Reviewer have **no** SEO-console access; Authors/Contributors see only the
inline SEO inspector inside the content editor (see [`02-content-pages.md`](./02-content-pages.md)), and
Legal Reviewers are scoped to the Legal Review Queue only.

---

## SEO Overview & Audit

`/admin/seo` (overview + score trend) and `/admin/seo-audit` (per-page fix-its). These two routes are one
conceptual surface: the overview is the fleet view, the audit is the drill-down. Core Web Vitals (LCP / INP /
CLS) are pulled from RUM/CrUX and rendered on the overview against the platform perf budget
(LCP < 2.5s, INP < 200ms, CLS < 0.1).

### Purpose

Give SEO and editorial leads a single health dashboard: the site-wide average SEO score and its trend, the
distribution of pages by score band, Core Web Vitals status, and a prioritized, actionable list of the
lowest-scoring / highest-traffic pages to fix. `/admin/seo-audit` expands one page into its per-check
breakdown (the weighted rubric from §A.4) with one-click "recompute" and deep-links into the Metadata
Manager, editor, or Broken Links monitor.

### Route

- `/admin/seo` — overview, score trend, CWV, top fix-it list.
- `/admin/seo-audit` — per-page audit table + single-page fix-it drawer.

### Components

- `SeoScoreHeroTile` — average `seo_scores.score` across published content + WoW delta sparkline.
- `ScoreTrendChart` — time-series of avg score (90-day), bucketed daily.
- `ScoreBandDistribution` — stacked bar: pages in 0–49 (poor) / 50–79 (warn) / 80–100 (good).
- `CoreWebVitalsPanel` — three gauges (LCP / INP / CLS) with budget thresholds and pass/fail badge; data
  source label (RUM vs CrUX) and 28-day window.
- `FixItQueueTable` — sortable by `score asc`, `view_count desc`, `computed_at`; columns: title, type, score,
  failing checks (chips), last computed; row → audit drawer.
- `AuditDetailDrawer` (`/admin/seo-audit`) — the 12-row weighted rubric (`seo_scores.checks`), each with
  ok / warn / fail state, points, and a remediation link.
- `RecomputeButton` — fires `POST /v1/seo/recompute/:id` (single) or bulk recompute for the visible page set.
- `SeoFilters` — content_type, category (scope-aware), status, score band, has-broken-links.

### Permissions required

- View: `analytics:view` + `seo:audit`. Roles: **SEO Manager** (full), **Editor** (scoped to assigned
  categories — scope S filters `cms_contents.category_id`), **Managing Editor**, **Admin**, **Super Admin**.
- Recompute (write): `seo:audit`. Roles: **SEO Manager**, **Editor** (own scope only), **Admin**,
  **Super Admin**. The PDP enforces category scope for Editors; SEO Manager and above are unscoped.
- Authors/Contributors/Legal Reviewers: **denied** at the route guard.

### API endpoints used

- `GET /v1/seo/scores` — list/paginated scores joined to content for the overview + audit table.
- `GET /v1/seo/scores/:id` — single content's score + `checks` breakdown for the audit drawer.
- `POST /v1/seo/recompute/:id` — recompute one content's score (returns fresh `{score, checks}`).
- `POST /v1/seo/recompute` — bulk recompute for a filtered set (body: `contentIds[]` or filter).
- `GET /v1/seo/web-vitals?window=28d` — CWV aggregates (LCP/INP/CLS p75) for the CWV panel.
- Dashboard composition: GraphQL BFF `query seoOverview { avgScore, trend, bands, webVitals }`.
- All responses use the standard envelope `{ success, data, error, meta:{total,page,limit} }`.

### Database tables affected

- `cms.seo_scores` (read; written by recompute) — `score`, `checks`, `readability`, `word_count`,
  `computed_at`.
- `cms.cms_contents` (read) — `title`, `slug`, `content_type`, `status`, `category_id`, `view_count`.
- `cms.seo_link_checks` (read) — to flag pages with broken links in the fix-it queue.
- Recompute reads `cms.internal_links` and `cms.cms_media_references` (alt-text presence) as score inputs.

### Wireframe (`/admin/seo`)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ SEO Overview                                   [ Filters ▾ ] [ Recompute ▾ ]│
├───────────────────────────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ AVG SCORE  │  │ Score Trend (90d)        │  │ Core Web Vitals (p75/28d)│ │
│ │   82 ▲ +3  │  │   ╭─╮      ╭───╮          │  │ LCP 2.1s ✓  INP 140 ✓    │ │
│ │  /100      │  │  ╭╯ ╰─╮╭──╯   ╰╮          │  │ CLS 0.07 ✓   [ PASS ]    │ │
│ └────────────┘  └──────────────────────────┘  └──────────────────────────┘ │
│ Distribution:  ████████ Good 1.2M  ███ Warn 240k  █ Poor 38k                │
├───────────────────────────────────────────────────────────────────────────┤
│ FIX-IT QUEUE (lowest score × highest traffic)                               │
│ ┌─────────────────────────────┬──────┬───────┬──────────────────────┬─────┐ │
│ │ Title                       │ Type │ Score │ Failing checks       │     │ │
│ ├─────────────────────────────┼──────┼───────┼──────────────────────┼─────┤ │
│ │ Compound Interest           │ term │  44   │ meta-desc · alt · h1 │  →  │ │
│ │ What is an ETF?             │ artl │  51   │ internal-links · slug│  →  │ │
│ └─────────────────────────────┴──────┴───────┴──────────────────────┴─────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases

- **Loading:** skeleton tiles for the hero/trend/CWV; the fix-it table shows shimmer rows.
- **Empty:** "No published content yet — scores appear after first publish." CWV panel shows "Collecting
  field data… (needs ≥ 28 days of traffic)" when RUM/CrUX has no sample.
- **Error:** if `seo_scores` is stale (`computed_at` older than threshold) show a non-blocking "Scores may be
  outdated — recompute" banner; if `/v1/seo/web-vitals` fails, the CWV panel degrades to "Field data
  unavailable" without blocking the rest of the page.
- **Edge:** bulk recompute is rate-limited and queued (job), with a progress toast; Editors only see/recompute
  pages in their category scope; CWV is read-only (no write path).

---

## Metadata Manager

`/admin/seo/metadata`. Bulk editor for meta title, meta description, canonical, Open Graph, Twitter Card, and
structured-data overrides across many content items at once — the SEO-team companion to the inline SEO
inspector in the content editor.

### Purpose

Let the SEO Manager curate `cms_contents.seo_metadata` at scale: inline-edit titles/descriptions with live
character counters (title 30–60, description 70–160), set/clear canonicals, manage `noIndex`/`noFollow`,
apply title templates from `seo_settings.title_template`, preview the SERP + OG/Twitter card, and bulk-apply
patterns (e.g. append "— Imperialpedia") across a filtered selection. Schema markup is generated server-side
per `content_type` (§A.5) — this page surfaces validity and lets editors add per-page JSON-LD overrides, never
hand-author the base schema.

### Route

`/admin/seo/metadata` (list/bulk grid). Single-row deep edits round-trip to the content editor's SEO inspector.

### Components

- `MetadataGrid` — virtualized table; columns: title, slug, type, meta title (inline, counter), meta
  description (inline, counter), canonical, index flags, OG image thumb, schema-valid badge.
- `CharCounterField` — title/description input with 30–60 / 70–160 ranges, color-coded over/under.
- `CanonicalEditor` — URL field with "self" quick-set + cross-language canonical hint (respects
  `translation_of`).
- `SerpPreview` / `OgTwitterPreview` — live Google SERP snippet + OG (`summary_large_image`) and Twitter card.
- `SchemaInspector` — read-only generated JSON-LD per type + validity result; optional `custom_fields`
  JSON-LD override field.
- `BulkActionBar` — apply title template, set/clear canonical, toggle `noIndex`/`noFollow`, AI-suggest
  descriptions (human-confirmed), apply to N selected.
- `MetadataFilters` — type, category (scoped), missing-meta, over/under-length, noindex.

### Permissions required

- View: `seo:metadata` (+ `content:read`). Roles: **SEO Manager**, **Editor** (scoped categories),
  **Managing Editor**, **Admin**, **Super Admin**.
- Mutate: `seo:metadata`. Roles: **SEO Manager** (unscoped), **Editor** (own category scope only),
  **Admin**, **Super Admin**. Note: editing SEO metadata is **not** publishing — it never changes
  `cms_contents.status`; the SEO Manager "cannot publish prose alone" rule is preserved.
- Authors/Contributors edit only their **own** items' metadata via the inline inspector (`content:edit.own`),
  not this bulk grid; Legal Reviewers denied.

### API endpoints used

- `GET /v1/content?fields=seo_metadata&...` — paginated content with `seo_metadata` for the grid.
- `PATCH /v1/content/:id/seo` — update one item's `seo_metadata` (validated by `seoMetadataSchema`).
- `POST /v1/content/seo/bulk` — bulk apply (body: `{ contentIds[], patch }`).
- `GET /v1/seo/scores/:id` — re-show score impact after a metadata edit (re-uses Overview API).
- `POST /v1/seo/recompute/:id` — trigger rescore after save.
- `GET /v1/seo/settings` — read `title_template`, `twitter_site`, `default_og_image` for previews/templates.
- `POST /v1/ai/seo/suggest-description` — AI description suggestion (gated by `ai:use`).

### Database tables affected

- `cms.cms_contents` (read/write) — `seo_metadata JSONB` (`title, description, keywords[], ogTitle,
  ogDescription, ogImage, canonicalUrl, noIndex, noFollow`); `custom_fields` for per-page JSON-LD override.
- `cms.seo_settings` (read) — `title_template`, `twitter_site`, `default_og_image`, `organization_jsonld`.
- `cms.seo_scores` (read; rewritten on recompute) — to reflect metadata changes in the score.
- `cms.cms_media_references` (read) — resolve OG image asset for previews.

### Empty / Loading / Error states & edge cases

- **Loading:** grid skeleton + disabled bulk bar until rows load.
- **Empty:** filtered-to-zero shows "No content matches these filters."
- **Error:** per-row save failures highlight the row red with a retry; bulk apply is transactional per item
  and returns a partial-success summary (`meta` carries counts).
- **Edge:** title/description over length saves with a warning (soft gate), but `submit_for_review` hard-gates
  per §A.4; canonical pointing off-domain triggers a confirm; bulk `noIndex` on > N pages requires explicit
  confirmation (de-indexing risk); Editor scope strips out-of-scope rows server-side even if the client filters
  loosely (defense in depth).

---

## Redirects

`/admin/seo/redirects`. Full manager over the real `cms.cms_seo_redirects` table — create/edit/disable
301/302 rules, CSV import/export, and loop/chain detection. Redirects are applied at the edge (Cloudflare)
with an app fallback, and a 301 is auto-created on slug change.

### Purpose

Prevent link rot and preserve link equity. Give SEO/Admin a governed UI to manage source→target rules,
bulk-import legacy redirect maps via CSV, and catch dangerous configurations (loops, chains, redirect to a 404,
duplicate sources) before they ship. The unique constraint `cms_redirects_website_source_unique`
(`website_id`, `source_url`) is enforced by the DB; the UI surfaces conflicts pre-save.

### Route

`/admin/seo/redirects`.

### Components

- `RedirectsTable` — columns: source_url, target_url, type (301/302), active toggle, hit_count, updated_at;
  search + filter by type/active; sort by hit_count.
- `RedirectEditDialog` — source/target inputs (max 1000 chars each, matching `STRING(1000)`), 301/302 select,
  active toggle; live validation (same-origin check, trailing-slash normalization).
- `CsvImporter` — drag-drop CSV (`source_url,target_url,redirect_type`), column mapping, dry-run preview with
  per-row validation, conflict and loop report, commit.
- `LoopChainDetector` — graph walk over proposed + existing rules; flags cycles and chains (A→B→C) and
  suggests flattening to a single hop.
- `BulkActions` — activate/deactivate/delete selected; export CSV.
- `RedirectStatsStrip` — total rules, active, top-hit sources (from `hit_count`).

### Permissions required

- View + Mutate: `seo:redirects`. Roles: **SEO Manager**, **Admin**, **Super Admin**.
- **Editor**, **Managing Editor**, **Author**, **Contributor**, **Legal Reviewer**: **denied** (redirects are
  site-infrastructure, not per-article content). Auto-301-on-slug-change is performed system-side under the
  editor's content mutation, not via this page.

### API endpoints used

- `GET /v1/seo/redirects` — list (filter by `website_id`, `is_active`, `redirect_type`; paginated).
- `POST /v1/seo/redirects` — create one rule (rejects on unique-source conflict, loop, or self-redirect).
- `PATCH /v1/seo/redirects/:id` — edit/toggle a rule.
- `DELETE /v1/seo/redirects/:id` — remove a rule.
- `POST /v1/seo/redirects/import` — CSV bulk import (multipart); `?dryRun=true` returns the validation report.
- `GET /v1/seo/redirects/export` — CSV export of the current set.
- `POST /v1/seo/redirects/validate` — loop/chain/conflict check for a proposed batch (used by importer + edit
  dialog).

### Database tables affected

- `cms.cms_seo_redirects` (read/write) — `website_id`, `source_url` (varchar 1000), `target_url` (varchar
  1000), `redirect_type` (enum `'301'|'302'`), `is_active`, `hit_count`; unique
  `cms_redirects_website_source_unique` on (`website_id`, `source_url`); index on (`website_id`, `is_active`).
- `cms.cms_contents` (read) — resolve target existence (warn if target slug is missing/unpublished → 404 risk).

### Wireframe (`/admin/seo/redirects`)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Redirects                          [ Import CSV ] [ Export ] [ + New Rule ]  │
│ 12,480 rules · 12,201 active · loop check: ✓ clean                           │
├──────────────────────────┬──────────────────────────┬──────┬────────┬───────┤
│ Source                   │ Target                   │ Type │ Active │ Hits  │
├──────────────────────────┼──────────────────────────┼──────┼────────┼───────┤
│ /old/etf-guide           │ /terms/etf               │ 301  │  [on]  │ 9,442 │
│ /investing/compound      │ /terms/compound-interest │ 301  │  [on]  │ 3,118 │
│ /promo-2024              │ /promo                   │ 302  │  [off] │   12  │
├──────────────────────────┴──────────────────────────┴──────┴────────┴───────┤
│ ⚠ 1 chain detected: /a → /b → /c  [ Flatten to /a → /c ]                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases

- **Loading:** table skeleton; import/export disabled until loaded.
- **Empty:** "No redirects yet — add a rule or import a CSV map."
- **Error:** unique-source conflict shows the existing rule inline with an "edit existing" CTA; CSV import
  surfaces a downloadable error report for failed rows and commits only valid rows (configurable all-or-nothing).
- **Edge cases:** self-redirect (source == target) blocked; loop (A→B→A) blocked with the cycle path shown;
  chain (A→B→C) allowed but flagged with a flatten suggestion; target resolving to an unpublished/missing slug
  warns ("redirects to a 404"); deactivating a high-hit rule prompts confirmation; `301` vs `302` guidance
  tooltip (use 302 only for temporary moves).

---

## Sitemaps & Robots

`/admin/seo/sitemaps`. Manage XML sitemap generation/segmentation and the per-environment `robots.txt`.
Sitemaps are generated, segmented (≤ 50k URLs/file with a sitemap index), regenerated on publish, and served
at the edge; `robots.txt` is managed per environment (staging `Disallow: /`; production allows public, blocks
`/admin` and `/api`).

### Purpose

Give SEO/Admin control over crawl surface: trigger/inspect sitemap regeneration, view the segment index and
per-segment URL counts and `lastmod`, edit and publish the managed `robots.txt`, and confirm what's currently
served. Prevents accidental de-indexing (staging robots leaking to prod) via an environment guard and a
`default_no_index` flag on `seo_settings`.

### Route

`/admin/seo/sitemaps`.

### Components

- `SitemapIndexPanel` — list of segment files (by content_type + glossary), URL count, last regenerated,
  public URL, "view raw" link to `/v1/seo/sitemap.xml`.
- `RegenerateSitemapButton` — enqueue full/partial regeneration; progress + last-run status.
- `RobotsEditor` — code editor for `seo_settings.robots_txt` with environment selector, syntax lint, and a
  diff against what's currently served; "publish" applies it.
- `EnvGuardBanner` — shows current environment + `default_no_index`; blocks publishing a permissive robots to
  staging and warns on a restrictive robots heading to production.
- `RobotsPreview` — rendered effective `robots.txt` (managed body + system-injected `Sitemap:` line).
- `CrawlSurfaceSummary` — counts of indexable vs `noIndex` pages (from `seo_metadata.noIndex` +
  `default_no_index`).

### Permissions required

- View: `seo:sitemaps`. Roles: **SEO Manager**, **Admin**, **Super Admin**.
- Mutate sitemaps (regenerate): `seo:sitemaps`. Roles: **SEO Manager**, **Admin**, **Super Admin**.
- Mutate `robots.txt`: `system:settings` (robots is environment/site infrastructure). Roles: **Admin**,
  **Super Admin** only — SEO Manager can regenerate sitemaps but editing the served robots body is an
  Admin-level guardrail to prevent accidental site-wide de-index.
- All other roles: **denied**.

### API endpoints used

- `GET /v1/seo/sitemap.xml` — the served sitemap index / segment (public read; admin "view raw").
- `POST /v1/seo/sitemap/regenerate` — enqueue regeneration (body: `{ scope: 'all' | contentType }`).
- `GET /v1/seo/sitemap/status` — segment list, counts, lastmod, last-run.
- `GET /robots.txt` — served robots (public).
- `GET /v1/seo/settings` — read `robots_txt`, `default_no_index`, `organization_jsonld`.
- `PUT /v1/seo/settings/robots` — update the managed `robots_txt` (Admin-gated; environment-validated).

### Database tables affected

- `cms.seo_settings` (read/write) — `robots_txt`, `default_no_index`, `title_template`, `default_og_image`,
  `organization_jsonld`, `updated_at`.
- `cms.cms_contents` (read) — sitemap URL set + `lastmod` from `updated_at`; filtered to
  `status = 'published'` and `visibility = 'public'` and not `seo_metadata.noIndex`.
- Glossary URLs for the sitemap are sourced from the `imperialpedia` read projection (see
  [`02-content-pages.md`](./02-content-pages.md)); this page only triggers/reports — generation is server-side.

### Empty / Loading / Error states & edge cases

- **Loading:** segment list skeleton; robots editor read-only until loaded.
- **Empty:** "No sitemap generated yet — run regeneration."
- **Error:** regeneration job failure shows the failed segment + retry; robots publish failure preserves the
  last served body.
- **Edge cases:** environment guard blocks shipping `Disallow: /` to production and blocks an open robots to
  staging; a segment exceeding 50k URLs auto-splits and the index updates; publishing robots is audited (it is
  a high-blast-radius change); the system-injected `Sitemap:` line cannot be removed by the editor.

---

## Internal Linking

`/admin/seo/internal-links` (graph, orphan finder) and `/admin/seo/linking` (dictionary + suggestions). The
internal-link system maintains the keyword/glossary dictionary, suggests links at edit time, auto-links first
mentions on publish (cap 1/term, skipping headings/quotes), and stores the link graph in
`cms.internal_links` for orphan/over-link analysis.

### Purpose

Maximize topical authority and crawl depth. `/admin/seo/linking` curates the dictionary (published glossary
terms + aliases + a curated keyword→URL map) and reviews/approves auto-link rules. `/admin/seo/internal-links`
visualizes the link graph, surfaces **orphan pages** (no inbound internal links), **over-linked** pages, and
**suggested links** to boost thin/orphan content. The system never silently rewrites prose — suggestions are
accept/reject, and auto-link runs only on publish under the term cap.

### Route

- `/admin/seo/linking` — dictionary management + auto-link rules.
- `/admin/seo/internal-links` — link graph, orphan finder, suggestions.

### Components

- `LinkDictionaryTable` (`/linking`) — term/alias → target URL, source (glossary vs curated), enabled toggle,
  link cap; add/edit curated entries.
- `AutoLinkRulePanel` — global settings: cap per term, skip headings/quotes/code, max links per page,
  first-mention-only.
- `LinkGraphView` (`/internal-links`) — force-directed graph of `internal_links` (nodes = content, edges =
  links); zoom, focus a node, highlight inbound/outbound.
- `OrphanFinder` — table of published pages with zero inbound internal links, sorted by traffic; "suggest
  links" CTA.
- `OverLinkedTable` — pages exceeding the per-page link cap.
- `LinkSuggestionDrawer` — proposed links for a selected page (anchor text + target), accept/reject; accepted
  links queue into the content's next revision (never auto-edited live).

### Permissions required

- View: `seo:links` (+ `content:read`). Roles: **SEO Manager**, **Editor** (scoped), **Managing Editor**,
  **Admin**, **Super Admin**.
- Mutate dictionary + auto-link rules: `seo:links`. Roles: **SEO Manager** (unscoped), **Editor** (own
  category scope for accepting suggestions that edit their content), **Admin**, **Super Admin**.
- Accepting a suggestion that edits content requires `content:edit.any` (SEO Manager / Admin) or
  `content:edit.own` (Editor within scope) — the link write rides the normal content-revision path and
  workflow, so it respects publish gates.
- Authors/Contributors/Legal Reviewers: **denied** from the console (Authors still get inline suggestions in
  their own editor).

### API endpoints used

- `GET /v1/seo/links/internal-graph` — the link graph (nodes + edges) for visualization + orphan/over-link
  computation.
- `GET /v1/seo/links/dictionary` — dictionary entries (glossary-derived + curated).
- `POST /v1/seo/links/dictionary` / `PATCH .../:id` / `DELETE .../:id` — manage curated entries + rules.
- `GET /v1/seo/links/suggestions?contentId=` — proposed links for a page.
- `POST /v1/seo/links/suggestions/apply` — accept suggestions → queue a content revision.
- `PUT /v1/seo/links/rules` — auto-link rule config.

### Database tables affected

- `cms.internal_links` (read/write) — `from_content`, `to_content`, `anchor_text` (PK across all three);
  populated on publish, read for graph/orphan/over-link analysis.
- `cms.cms_contents` (read; written via revision when suggestions are applied) — link targets, status,
  category scope; the dictionary's curated `keyword→URL` map lives in `seo_settings`/config.
- `cms.seo_settings` (read/write) — auto-link rule config (cap, skip rules) when stored site-wide.
- Glossary terms/aliases for the dictionary are read from the `imperialpedia` glossary tables (cross-reference
  [`02-content-pages.md`](./02-content-pages.md)); this page consumes them, it does not own them.

### Empty / Loading / Error states & edge cases

- **Loading:** graph shows a spinner; orphan/dictionary tables skeleton.
- **Empty:** new sites show "No internal links recorded yet — links populate on publish"; dictionary empty
  prompts importing glossary terms.
- **Error:** graph computation for very large sets is paginated/sampled (100M-scale safety) with a "showing top
  N by traffic" note; suggestion-apply failures roll back the queued revision.
- **Edge cases:** a term linking to an unpublished/missing target is excluded; over-linking is capped at apply
  time; applying suggestions respects the content's workflow (drafts stay drafts); orphan finder excludes
  intentionally-noindexed pages.

---

## Broken Links

`/admin/seo/broken-links`. Monitor surface over `cms.seo_link_checks` — the nightly crawler validates internal
links (against `cms_contents` existence) and samples external links (HEAD/GET, rate-limited, host-cached) and
writes results here. Broken links feed a dashboard widget and a `notification-service` digest to the SEO
Manager.

### Purpose

Surface and triage broken internal and external links so editors can fix or redirect them before they hurt
crawl quality and UX. The page lists current failures (from the partial index `seo_link_checks_broken` where
`ok = false`), groups by source content, distinguishes internal vs external, and offers one-click remediation:
create a redirect (internal), open the owning content, or mark an external link reviewed.

### Route

`/admin/seo/broken-links`.

### Components

- `BrokenLinksTable` — columns: URL, type (internal/external), http_status, source content (title → editor),
  last_checked, ok-state; filter by type/status-class; sort by last_checked.
- `RemediationActions` — per row: "Create 301" (→ Redirects), "Open content", "Recheck now", "Ignore"
  (allowlist external known-flaky host).
- `CrawlStatusStrip` — last crawl run, links checked, broken count, next scheduled run; "Run crawl now"
  (queued job).
- `SourceGrouping` — collapse by `content_id` so an editor fixes all broken links on one page together.
- `ExternalHostSummary` — top failing external hosts (rate-limit/host-cache context).

### Permissions required

- View: `seo:audit`. Roles: **SEO Manager**, **Editor** (scoped to own category content), **Managing Editor**,
  **Admin**, **Super Admin**.
- Trigger recheck / run crawl: `seo:audit`. Roles: **SEO Manager**, **Admin**, **Super Admin**.
- "Create 301" remediation requires `seo:redirects` (so it's SEO Manager / Admin / Super Admin); Editors can
  open and fix the content link directly within their scope (`content:edit.own`).
- Authors/Contributors/Legal Reviewers: **denied**.

### API endpoints used

- `GET /v1/seo/links/broken` — list of failing checks (filter type/status; paginated; backed by the
  `seo_link_checks_broken` partial index).
- `POST /v1/seo/links/recheck` — recheck a URL or a content's links on demand.
- `POST /v1/seo/links/crawl` — enqueue a full crawl run (Admin/SEO Manager).
- `GET /v1/seo/links/crawl/status` — last/next run + counts.
- `POST /v1/seo/redirects` — create a 301 for a broken internal link (re-uses the Redirects API).
- Broken-link digests are delivered via `notification-service` (`POST /v1/notifications/dispatch`,
  out-of-band) to the SEO Manager — no UI call.

### Database tables affected

- `cms.seo_link_checks` (read; written by crawler/recheck) — `content_id`, `url`, `link_type`
  (`internal|external`), `http_status`, `ok`, `last_checked`; partial index `seo_link_checks_broken` on
  (`ok`) where `ok = false`.
- `cms.cms_contents` (read) — resolve the source content (title, editor link, category scope) and validate
  internal targets' existence.
- `cms.cms_seo_redirects` (write, via remediation) — auto/assisted 301 creation for broken internal links.

### Empty / Loading / Error states & edge cases

- **Loading:** table skeleton; crawl-status strip shows "Loading last run…".
- **Empty:** "No broken links 🎉 — last crawl found 0 failures" with the last-run timestamp.
- **Error:** if the crawler hasn't run yet, show "No crawl has run — schedule or run now"; a recheck timeout
  marks the row "rechecking…" then reverts on failure.
- **Edge cases:** external links are sampled and host-rate-limited, so a transient 5xx is retried before being
  reported (avoid false positives); slug-change auto-301 means many "broken internal" rows self-heal after the
  redirect is created (the next crawl clears them); Editors only see broken links on content in their scope;
  ignoring an external host is logged to audit (could mask real rot).

---

## Cross-section notes

- **Audit trail:** every mutation on this section (redirect create/delete, robots publish, bulk metadata,
  dictionary edits, sitemap regenerate, crawl trigger) emits a `baalvion:events` event consumed by
  `audit-service` (WORM, hash-chained). See [`07-system-pages.md`](./07-system-pages.md).
- **Search:** SEO console search/autocomplete over content uses `search-service` (`:3036`), tenant-scoped.
- **Caching:** score/graph/sitemap reads are served through `@baalvion/cache` (read-through, single-flight)
  with publish-event invalidation; CWV and crawl status are short-TTL.
- **Authorization:** every endpoint above is checked at the gateway via `rbac-service` `/v1/authorize` with the
  capability strings named per page; Editor scope (`scope S`) filters by `cms_contents.category_id`
  server-side, never trusting client filters.
