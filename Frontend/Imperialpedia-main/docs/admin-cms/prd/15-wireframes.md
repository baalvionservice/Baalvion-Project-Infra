# 15 — Admin Panel Wireframes (desktop)

> **Covers §15 (UI/UX) — the five reference screens.** These are the labeled, data-realistic desktop
> wireframes (~120 cols) the rest of the spec points at. They are intentionally ASCII so they live in
> version control next to the schema/route facts they depend on. Each screen reuses the **shared shell**
> (top bar + role-filtered sidebar + content region + collapsible right rail) from
> [07 §A.3](../07-uiux-roadmap-scaling.md#a3-dashboard--page-layout-shell), and is grounded in **real**
> table names, routes, and capability strings — it does not invent new ones.

**Grounding cross-references (do not duplicate, link):**

- Shell + IA + sidebar groups → [07 §A.2/§A.3](../07-uiux-roadmap-scaling.md). Dashboard data contract
  (`DashboardSummary` GraphQL) → [01 §3.4](../01-architecture-and-stack.md#34-data-contract-the-single-dashboard-query).
- Editor blocks/inspector → [02 §D](../02-content-cms.md#d-rich-block-editor-3). Content list → [02 §C.1](../02-content-cms.md#c1-content-list-admincontent).
- Workflow state machine + transition rules + board → [04 §B](../04-rbac-and-workflow.md#b-editorial-workflow-8).
- SEO score engine + tables (`seo_scores`, `seo_link_checks`, `internal_links`) → [03 §A](../03-seo-and-media.md#a-seo-management-4).
- Analytics rollups (`analytics.content_daily`, `traffic_daily`, `search_daily`) + dashboards → [05 §A](../05-analytics-monetization-ai.md#a-analytics-9).

**Conventions used in every screen**

- **Top bar:** `logo · ⌘K global search · env● · 🔔 alerts · ⊕ Create · ☾ theme · Avatar(role) ▾`.
- **Right rail** is contextual + collapsible (`›` to collapse). Sidebar items are **role-filtered** — an
  item is hidden when the viewer lacks its capability (server authority via `GET /me/permissions`).
- **Status glyphs:** `●` published · `◐` in review · `◌` draft · `▲/▼` delta · `⚠` warning · `✓` pass ·
  `🔒` break-glass/audited · `🕒` scheduled. Status is conveyed by **icon + text + color**, never color alone (WCAG 2.2 AA).
- The viewer in screens 1, 3 is **Managing Editor** (`manager`); screen 2 is **Author** (`member`+`content:author`);
  screens 4–5 default to **SEO Manager** / **Admin**. Capability strings shown inline are the canonical vocabulary.

---

## 1. Executive Dashboard — `/admin/dashboard`

Role-adaptive (this view = **Managing Editor**). All tiles hydrate from **one** GraphQL `DashboardSummary`
query (60s-cached rollup) — never N REST calls. `Recent Activity` streams live over WebSocket from
`audit-service` (hash-chain verified). See [01 §3](../01-architecture-and-stack.md#3-executive-dashboard-1).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧ Imperialpedia   ⌘K Search articles, terms, people…………………   env: prod ●   🔔 12   ⊕ Create ▾  ☾  ◐ M. Khan · Managing Editor ▾ │
├───────────────────┬────────────────────────────────────────────────────────────────────────────────────────┤
│ IMPERIALPEDIA     │  Dashboard ▸ Executive                          Range:[ Last 30 days ▾ ]  Compare:[ prev ▾ ] ⟳ │
│ ▣ Dashboard     ● │                                                                                            │
│ ▤ Content       › │  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐    │
│ ▦ Glossary        │  │ ARTICLES ││PUBLISHED ││  DRAFTS  ││ PENDING  ││ MONTHLY  ││ REVENUE  ││AFFILIATE │    │
│ ◳ Media           │  │  48,210  ││  41,990  ││  4,120   ││   312    ││ VISITORS ││  $1.84M  ││ $214,380 │    │
│ ◎ SEO           › │  │  ▲ 3.1%  ││  ▲ 2.8%  ││  ▼ 1.0%  ││ ▲ 18 new ││  92.4M ▲ ││  ▲ 9.4%  ││  ▲ 4.2%  │    │
│ ◷ Analytics     › │  │ cms_     ││ status=  ││ status=  ││ workflow ││ +6.2%    ││ subs+ads ││ 30d conf.│    │
│ ◐ Monetization  › │  │ contents ││published ││ draft    ││ gate q   ││ ClickH.  ││ +affil.  ││ commis.  │    │
│ ✶ AI Studio     › │  └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘    │
│ ☷ Community     › │  ┌──────────────────────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ ⚙ Administration› │  │ Traffic — sessions (30d)        ▣ sessions ▢ uniq │ │ SEO Health                      │ │
│                   │  │ 4.0M┤                       ╭─╮                    │ │   ▰▰▰▰▰▰▰▰▱▱   82 / 100  ▲ 3    │ │
│ ── QUICK ──       │  │ 3.0M┤        ╭╮     ╭──╮ ╭─╯ ╰─╮   ╭─╮            │ │   avg seo_scores.score          │ │
│ ⊕ New Article     │  │ 2.0M┤   ╭───╯╰─────╯  ╰─╯     ╰───╯ ╰──           │ │   ◔ 6 critical · 23 warnings    │ │
│ ⊕ New Term        │  │ 1.0M┤╭──╯                                          │ │   ⚠ 14 broken links             │ │
│ ⧉ Review Queue 9  │  │     └┬────┬────┬────┬────┬────┬────┬────┬────┬──   │ │   ◇ CWV: LCP 2.1s INP 140ms     │ │
│                   │  │   May06  09   12   15   18   21   24   27  Jun03  │ │   [ Open SEO Dashboard → ]       │ │
│                   │  └──────────────────────────────────────────────────┘ └─────────────────────────────────┘ │
│                   │  ┌─────────────────────────┐┌─────────────────────────┐┌──────────────────────────────────┐│
│                   │  │ Top Authors (30d)       ││ Trending Topics (7d z)  ││ Recent Activity  · live ●  WORM  ││
│                   │  │ 1 A. Rao   312 · 1.24M  ││ #inflation      ▲▲ 8.4  ││ 14:31 Editor approved "ETF…"     ││
│                   │  │ 2 M. Khan  280 ·  980k  ││ #etf-basics     ▲  5.1  ││ 14:18 SEO ✓ "Compound Interest"  ││
│                   │  │ 3 L. Sato  244 ·  812k  ││ #options-greeks ▲  4.7  ││ 13:52 Legal ⚠ flagged "Best ROI" ││
│                   │  │ 4 D. Park  201 ·  690k  ││ #treasury-yield ▲  3.9  ││ 13:40 Author submitted "REIT…"   ││
│                   │  │ 5 N. Vora  188 ·  604k  ││ #roth-ira       ▲  3.2  ││ 13:07 M. Khan published "Bonds…" ││
│                   │  │ [ Author scorecards → ] ││ #stock-splits   ▲  2.8  ││ [ Full audit log → /audit-logs ] ││
│                   │  └─────────────────────────┘└─────────────────────────┘└──────────────────────────────────┘│
│                   │  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│                   │  │ ⧉ Pending Approvals — ball-in-court: YOU (3)        SLA at risk ⚠ 2     [ Open board ]│ │
│                   │  │  ◐ "Yield curve explained"   Editor✓ SEO✓ → awaiting PUBLISH   due 16:00  [Publish▸] │ │
│                   │  │  ◐ "Options 101"             Legal ⚠ in legal_review          due Jun07  [Review ▸] │ │
│                   │  │  ◐ "Tax-loss harvesting"     approved → scheduled Jun07 09:00  🕒        [Edit sched]│ │
│                   │  └──────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

**Caption / key interactions.** Range + Compare drivers re-issue the single `DashboardSummary($range)` query;
tiles map 1:1 to that contract (`content{}`, `audience{}`, `revenue{}`, `seo{}`, `topAuthors`, `trendingTopics`,
`recentActivity`). The **SEO Health** card and **Pending Approvals** strip are deep-links into screens 4 and 3.
Role adapts the tile set: an **Admin/Super Admin** also sees Revenue breakdown + service-health from
`realtime-service`; an **Author** sees a *personal* dashboard (my drafts / my pending / my views / my earnings,
no platform revenue). Clicking any Recent Activity row opens the verifiable audit entry (hash-chain).

---

## 2. Content Editor — `/admin/content/[slug]/edit`

Block canvas (TipTap/ProseMirror → `content_blocks JSONB`) + `/` slash menu + drag-handle `⠿` reorder, with a
tabbed right **Inspector** (Settings · SEO · Comments · Versions). Autosave hits `autosaveContentSchema`
(debounced 2s, lightweight revisions). Viewer = **Author** — note **Submit for review** is enabled but
**Publish is absent** (Author lacks `content:publish`). See [02 §D.3/§D.4](../02-content-cms.md#d3-editor-ux-wireframe).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧   ‹ Back to Content    Understanding Compound Interest          ◌ Draft · v7   Autosaved 14:32:11   [⋯]   │
├───────────────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│  Title  Understanding Compound Interest                    │ INSPECTOR   ┌Settings┐ SEO  Comments³ Versions  │
│  Slug   understanding-compound-interest          [edit]    │ ┌────────────────────────────────────────────┐ │
│  ┌──────────────────────────────────────────────────────┐ │ │ Type        Article ▾                       │ │
│  │ ⠿ H1   Understanding Compound Interest                │ │ │ Category    Investing › Fundamentals ▾      │ │
│  │ ⠿ ¶    Compound interest is interest calculated on    │ │ │ Tags        +interest +compounding +basics  │ │
│  │        the initial principal and the accumulated…    │ │ │ Language    en ▾   Translation of  —        │ │
│  │ ⠿ ◫    callout(key-takeaway): The earlier you start, │ │ │ Author      A. Rao (you)                    │ │
│  │        the more time compounding has to work.        │ │ │ Reading     6 min (auto)                    │ │
│  │ ⠿ ⨏    finmath:  A = P(1 + r/n)^{nt}      [calc ▸]   │ │ │ Featured img  ⚠ required before publish     │ │
│  │ ⠿ 📊   chart(line): Growth of $1,000 over 30 years   │ │ │ Disclosures   ☐ Not financial advice        │ │
│  │ ⠿ ⛬    table: Year × Balance (5 rows, header)        │ │ │ Visibility    Public ▾                      │ │
│  │ ⠿ ❝    reference[3]: Bodie, Kane & Marcus (2014)     │ │ └────────────────────────────────────────────┘ │
│  │ ▌ + type "/" for a block…                            │ │ ── SEO tab preview ───────────────────────────  │
│  │   ┌─ / slash menu ────────────────────────────────┐  │ │ ▰▰▰▰▰▰▰▱▱▱  78 / 100   (seo_scores.score)      │
│  │   │ Heading  Paragraph  Table  Image  Chart  Math │  │ │ ✓ title 41 chars  ✓ meta 148   ✓ one H1        │
│  │   │ Infobox  Callout  Code  Quote  Reference  FAQ │  │ │ ⚠ alt missing (1 image)   ⚠ readability 47     │
│  │   │ ✶ AI: improve · summarize · suggest links     │  │ │ ✓ internal links 4   ⚠ external links 0        │
│  │   └───────────────────────────────────────────────┘  │ │ ✓ canonical set   ✓ slug ≤75   ⚠ schema: Article│
│  └──────────────────────────────────────────────────────┘ │ [ Re-run score ]  [ ✶ Fix-its (3) ]            │
│  ◳ Drop image or paste · Markdown/Docs paste → blocks      │ ── Comments tab ───────────────────────────────  │
│                                                            │ @M.Khan on ⨏ finmath block: "cite the source… "│
│                                                            │ ── Versions tab ───────────────────────────────  │
│                                                            │ v7 14:32 you (autosave)  · v6 11:04 you · v5 …  │
│  [ Save draft ]   [ Preview ]   [ ✶ Run AI checks ]        │   [ Compare v5 ↔ v7 ]   [ Restore… ]    ›collapse│
│                                          [ Submit for review ▸ ]  ⓘ Publish requires Editor approval (content:publish)│
└───────────────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

**Caption / key interactions.** Every block is reorderable (`⠿`), keyboard-first, and server-renderable (RSC)
so the preview equals the published HTML. The **SEO inspector** is the same score engine from screen 4 run live
(soft-warn in draft; **hard gate** on `Submit for review`: meta title 30–60, description 70–160, ≥1 H1, alt on
every image, featured image present). `finmath` blocks open the interactive calculator wired to
`imperialpedia-service` `calculatorController.js`. **Submit for review** transitions `draft → pending_review`,
writes a `cms_revisions` snapshot, and notifies the assigned Editor — the Author cannot reach `published`.

---

## 3. Workflow Review — `/admin/content/[slug]/review`

Reviewer screen reached from the queue/board ([04 §B.7](../04-rbac-and-workflow.md#b7-workflow-board-wireframe)).
Left = rendered content preview; center = **revision diff** (block-level, `cms_revisions`); right = reviewer
comments (`content_comments`) + decision actions. The **stepper** mirrors the `cms_workflows.current_state`
machine. Viewer = **Editor/Managing Editor** at the editorial gate. Each action is **one atomic transaction**
that also writes the audit log (the documented self-deadlock fix is a hard requirement).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧   ‹ Queue    Review: "ETF Basics for Beginners"     ◐ pending_review · v12     assignee: YOU   🔔  ☾  ▾   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  WORKFLOW  ●draft ─▶ ◉pending_review ─▶ ○seo_review ─▶ ○legal_review ─▶ ○approved ─▶ ○scheduled ─▶ ○published│
│            submitted by L. Sato · 13:40 · SLA 4h ⚠ 1h12m left            ball-in-court: Editor (you)         │
├───────────────────────────────────┬───────────────────────────────────┬──────────────────────────────────┤
│ PREVIEW  [ Rendered ▾ ] desktop⇄mobile│ DIFF  v10 ↔ v12  [ block ▾ ]  ±5  │ REVIEW  comments · suggestions   │
│ ┌───────────────────────────────┐ │ ┌───────────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ # ETF Basics for Beginners    │ │ │  ¶  (changed)                 │ │ │ @you → block ¶#3             │ │
│ │                               │ │ │ -An ETF is a fund that trades │ │ │ "Define expense ratio on     │ │
│ │ An exchange-traded fund (ETF) │ │ │ +An exchange-traded fund(ETF) │ │ │  first use." · suggestion    │ │
│ │ is a basket of securities that│ │ │  is a basket of securities…   │ │ │  ↳ L. Sato: fixed in v12 ✓   │ │
│ │ trades on an exchange like a  │ │ │                               │ │ ├──────────────────────────────┤ │
│ │ stock. …                      │ │ │ + callout(risk) ADDED         │ │ │ @M.Khan → block 📊#5         │ │
│ │                               │ │ │   "ETFs can trade at a premium│ │ │ "Chart source + asOf date?"  │ │
│ │ ◫ Key takeaway: low-cost,     │ │ │    or discount to NAV."       │ │ │  · open · 1 reply            │ │
│ │   diversified, intraday-liquid│ │ │                               │ │ ├──────────────────────────────┤ │
│ │ 📊 Expense ratio vs index     │ │ │ ⨏ finmath UNCHANGED           │ │ │ ▸ legal lexicon hit: none    │ │
│ │   (chart)                     │ │ │ 🖼 image#7 alt: "" ⚠ MISSING  │ │ │ ▸ finmath present → legal     │ │
│ │ ⓘ Sponsored? no · Ads: std    │ │ │ ❝ reference[2] ADDED (SEC.gov)│ │ │   gate REQUIRED on approve    │ │
│ └───────────────────────────────┘ │ └───────────────────────────────┘ │ └──────────────────────────────┘ │
│  SEO 71 ⚠   readability 58   words 1,240            blocks: +2 / -0 / ~3        @mention…  [ Comment ]      │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  DECISION (content:review)   comment required for changes/reject                                            │
│  [ ✓ Approve editorial → seo_review ]   [ ↩ Request changes ]   [ ⚖ Route to Legal ]   [ ⋯ Reassign ]      │
│  ⓘ Approve assigns SEO Manager · finmath block ⇒ legal_review cannot be skipped · every action → WORM audit │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Caption / key interactions.** The **stepper** is the live `cms_workflows.current_state` path; the filled node
is current, the SLA timer drives the "at-risk" badge + Managing-Editor notification on breach. The **diff** is
block-level over `cms_revisions` (added/removed/changed + word-level prose diff), surfacing review-relevant
signals inline (missing `alt`, added reference, `finmath` present). **Approve editorial** (`content:review`,
scope-checked) transitions `pending_review → seo_review` and assigns the SEO Manager; because a `finmath` block
is present, **Route to Legal** is mandatory downstream (legal-sensitivity rules, [04 §B.3](../04-rbac-and-workflow.md#b3-legal-review-routing-financial-compliance-aware)).
Request-changes / reject **require a comment** and bounce to `changes_requested` (notifies the author). Every
decision is one atomic DB transaction that also writes the non-repudiable `audit-service` entry.

---

## 4. SEO Dashboard — `/admin/seo`

Score trend + issues breakdown + Core Web Vitals + redirects/broken-link summary + per-page audit table.
Reads `seo_scores`, `seo_link_checks`, `cms_seo_redirects`, `internal_links` (RUM/CrUX for CWV). Viewer =
**SEO Manager** (`editor` + `seo:*`). Deep-dives jump to `/admin/seo-audit`, `/seo/redirects`, `/seo/internal-links`.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧   SEO ▸ Overview                                    Range:[ Last 90 days ▾ ]   Site: imperialpedia ▾   ⟳  │
├───────────────────┬────────────────────────────────────────────────────────────────────────────────────────┤
│ ◎ SEO             │  ┌──────────────────────────────────────────────┐ ┌─────────────────────────────────┐   │
│  Overview       ● │  │ Site SEO Score — avg seo_scores.score (90d)  │ │ Core Web Vitals (field/CrUX)    │   │
│  Audit & Fix-its  │  │ 100┤                              ╭───── 82  │ │  LCP  2.1s  ▰▰▰▰▰▰▰▱  good       │   │
│  Redirects        │  │  80┤              ╭───╮  ╭───╮╭──╯           │ │  INP  140ms ▰▰▰▰▰▰▱▱  good       │   │
│  Sitemaps&Robots  │  │  60┤     ╭───╮╭──╯   ╰──╯   ╰╯               │ │  CLS  0.06  ▰▰▰▰▰▰▰▰  good       │   │
│  Internal Links   │  │  40┤╭────╯   ╰╯                              │ │  TTFB 90ms (edge) ✓ <100ms      │   │
│  Linking dict.    │  │    └┬──────┬──────┬──────┬──────┬──────┬──   │ │  ⚠ 312 pages below LCP target   │   │
│                   │  │   Mar    Apr    May    …            Jun     │ │  [ Per-page CWV → seo-audit ]   │   │
│ ── INDEX ──       │  └──────────────────────────────────────────────┘ └─────────────────────────────────┘   │
│ Indexed   41,990  │  ┌──────────────────────────────────────────────┐ ┌─────────────────────────────────┐   │
│ Sitemaps   12 ✓   │  │ Issues breakdown (open)         total 412    │ │ Redirects & Broken Links        │   │
│ Robots prod ✓     │  │ ◔ Critical            6   missing H1, dup    │ │ Redirects active   1,284        │   │
│ Schema valid 96%  │  │ ◑ Warnings           23   meta len, thin     │ │  301:1,190  302:94  hits 312k/d │   │
│                   │  │ ◷ Notices           383   alt text, links    │ │ Redirect chains ⚠ 7  loops ⚠ 0 │   │
│ [ ✶ Bulk fix-its ]│  │ ── by check ──                              │ │ Broken internal ⚠ 14            │   │
│                   │  │ alt missing ▇▇▇▇▇▇▇▇▇ 184                     │ │ Broken external ⚠ 41 (sampled)  │   │
│                   │  │ meta len    ▇▇▇▇▇ 96                          │ │ last crawl 03:00 UTC ✓          │   │
│                   │  │ thin <300w  ▇▇▇ 62  · no canon ▇ 24          │ │ [ Manage redirects ] [ Re-crawl]│   │
│                   │  └──────────────────────────────────────────────┘ └─────────────────────────────────┘   │
│                   │  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│                   │  │ Per-page audit          Type▾ Score▾ Issue▾    🔎 search…           1,204 pages    │   │
│                   │  │ Page                              Type    Score  Issues          CWV    Updated     │   │
│                   │  │ ETF Basics for Beginners          Encyc.   71 ◑  alt·readability  good   1d ago [→] │   │
│                   │  │ What is a P/E ratio?              Term     48 ◔  no H1·thin·canon  poor   3d ago [→] │   │
│                   │  │ Understanding Compound Interest   Article  92 ●  —                good   2h ago [→] │   │
│                   │  │ Options Greeks Explained          Guide    66 ◑  meta·2 broken ln  good   5h ago [→] │   │
│                   │  │ Best ROI Investments 2026         Article  39 ◔  legal·thin·dup   poor   6h ago [→] │   │
│                   │  │ ── Bulk: [ Re-score ] [ Apply fix-its ] [ Export CSV ] ──            ◀ 1 2 3 … 61 ▶ │   │
│                   │  └──────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

**Caption / key interactions.** The score trend is the rolling avg of `seo_scores.score` across published
content (the same engine that drives the editor inspector in screen 2 and the dashboard SEO tile in screen 1).
**Issues breakdown** and **per-page audit** read the `checks` JSONB on `seo_scores` plus `seo_link_checks`;
**Bulk fix-its** queues `ai_jobs(kind='seo')` suggestions a human applies (never silent rewrites). The
Redirects/Broken-Links card summarizes `cms_seo_redirects` (with chain/loop detection) and the nightly crawler
results; `Re-crawl` re-runs the link monitor and a slug change auto-inserts a 301. Each `[→]` opens
`/admin/seo-audit` for that page. SEO-Manager can edit metadata/redirects/sitemaps but **cannot publish prose**.

---

## 5. Analytics Dashboard — `/admin/analytics/traffic`

Traffic time series + real-time readers (`realtime-service` WS) + top content table + search/zero-result panel
(content-gap finder) + revenue-by-stream. Reads `analytics.traffic_daily`, `content_daily`, `search_daily`
rollups (never raw ClickHouse events). Viewer = **Admin** (sees Revenue; an **Author** sees only own-content rows).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◧   Analytics ▸ Traffic        Tabs: [Traffic] Engagement  Top Content  Keywords  Growth  SEO  Revenue   ⟳ │
├───────────────────┬────────────────────────────────────────────────────────────────────────────────────────┤
│ ◷ Analytics       │  Range:[ Last 30 days ▾ ]  Source:[ all ▾ ]  Country:[ all ▾ ]  Device:[ all ▾ ]  [⤓CSV] │
│  Overview         │  ┌──────────────────────────────────────────────────┐ ┌─────────────────────────────────┐ │
│  Traffic        ● │  │ Sessions / Pageviews (30d)   ▣ sessions ▢ views  │ │ ◉ Real-time · readers now       │ │
│  Engagement       │  │ 6M┤                          ╭─╮                 │ │      4,182  ▲ live ●            │ │
│  Top Content      │  │ 4M┤            ╭──╮  ╭───╮ ╭─╯ ╰╮  ╭──╮          │ │  ▁▂▄▆█▇▆▄▅▆█▇▅▄▃▂ (5-min)       │ │
│  Keywords         │  │ 2M┤  ╭───╮╭───╯  ╰──╯   ╰─╯    ╰──╯  ╰─          │ │ Top live pages                  │ │
│  Growth           │  │   └┬─────┬─────┬─────┬─────┬─────┬─────┬──        │ │  1 Compound Interest    612 ●  │ │
│  SEO              │  │  May06   11    16    21    26   Jun01  03         │ │  2 ETF Basics           488 ●  │ │
│  Revenue          │  └──────────────────────────────────────────────────┘ │  3 What is a P/E ratio  377 ●  │ │
│                   │  Sessions 92.4M ▲6.2% · Uniques 71.2M · Pageviews 184M │  4 Roth IRA vs 401(k)   298 ●  │ │
│ ── SUMMARY ──     │  New 58% · Returning 42% · Avg session 3m12s          │ │ by country  US 41 IN 18 UK 9 % │ │
│ Sessions  92.4M ▲ │  ┌──────────────────────────────────────────────────┐ │ [ Open live board → ]           │ │
│ Avg dwell 2m48s   │  │ Top Content (30d · content_daily)                │ └─────────────────────────────────┘ │
│ Bounce    38%     │  │ Title                    Views   Dwell  CTR  Rev │ ┌─────────────────────────────────┐ │
│ Conv.     2.1%    │  │ Compound Interest        1.24M  3m41s  6.2% $14k │ │ Search & Zero-Result (gap)      │ │
│                   │  │ ETF Basics                980k  2m58s  5.1%  $9k │ │ Top queries (search_daily)      │ │
│                   │  │ P/E ratio                 812k  2m12s  4.4%  $6k │ │  "what is an etf"   142k  ✓     │ │
│                   │  │ Roth IRA vs 401(k)        690k  3m05s  5.8% $11k │ │  "compound calc"     98k  ✓     │ │
│                   │  │ Treasury yield curve      604k  2m44s  4.9%  $7k │ │ ⚠ Zero-result · high volume     │ │
│                   │  │ ▲ Risers: #inflation +38%   ▼ Decliners: #nft −22│ │  "sip vs lumpsum"  31k  ✶ brief│ │
│                   │  │ [ Full table → /top-content ]      ◀ 1 2 3 … ▶  │ │  "i bonds 2026"    24k  ✶ brief│ │
│                   │  └──────────────────────────────────────────────────┘ │  "qqq vs voo"      19k  ✶ brief│ │
│                   │  ┌──────────────────────────────────────────────────┐ │ [ ✶ Create brief → ai_jobs ]    │ │
│                   │  │ Revenue by stream (30d)   total $1.84M ▲9.4%     │ └─────────────────────────────────┘ │
│                   │  │ Ads        ▇▇▇▇▇▇▇▇▇▇▇▇  $986k (54%)             │  MRR $214k · churn 2.4% · ARPU $… │
│                   │  │ Affiliate  ▇▇▇▇▇       $214k (12%)  conf. 30d    │  [ Finance / payouts → /finance ]│
│                   │  │ Subscript. ▇▇▇▇▇▇▇▇▇    $640k (35%)  via ledger  │  ⓘ entitlements resolved server  │
│                   │  └──────────────────────────────────────────────────┘                                    │
└───────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

**Caption / key interactions.** All panels read Postgres rollups, not the raw event firehose — the time series
from `traffic_daily`, the table from `content_daily`, the search panel from `search_daily`, and revenue from the
payment/ledger + `monetization.*` reconciliation. **Real-time readers** stream over the `realtime-service`
WebSocket. The **Search & Zero-Result** panel is the content-gap engine: high-volume zero-result queries get a
`✶ Create brief` action that opens `ai_jobs(kind='generate')` → assigns an Author → enters the workflow
(screen 3) → publishes → auto-internal-links (closing the loop with screen 4). Revenue-by-stream and MRR/churn
are gated by `analytics:revenue`; an Author viewing this route sees only their own-content rows and **no**
platform revenue (role-adaptive, server-enforced).

---

## Cross-screen notes (shared shell + states)

- **One shell, six layouts.** All five screens share the top bar, role-filtered sidebar, content region, and
  collapsible right rail; ⌘K is the global command palette (navigate + quick actions like "publish X",
  "new term"). Layout archetypes used here: **Dashboard** (1), **Editor** (2), **Detail/Review** (3),
  **Dashboard+Table** (4, 5). See [07 §A.3](../07-uiux-roadmap-scaling.md#a3-dashboard--page-layout-shell).
- **Loading / empty / error.** Skeletons (no layout shift) on load; optimistic mutations with rollback +
  visible error on failure; tables show explicit empty states ("No zero-result queries in range"). Status uses
  **icon + text + color** for WCAG 2.2 AA, and the full editor + review actions are keyboard-operable.
- **Authority is the server.** Every action button is shown/enabled from `GET /me/permissions` and re-checked at
  the BFF via `rbac-service /v1/authorize` (deny-overrides). The frontend never hard-codes capability strings as
  the source of truth — it only mirrors them (`content:review`, `content:publish`, `seo:redirects`,
  `analytics:revenue`, …).
- **Mobile subset.** The on-call editor gets the review queue, approve/request-changes, publish/schedule,
  dashboard KPIs, and alerts as a bottom-tab + sheet experience; full block editing and bulk ops are
  desktop-first (deferred on mobile). See [07 §A.4](../07-uiux-roadmap-scaling.md#a4-mobile-admin-experience).
