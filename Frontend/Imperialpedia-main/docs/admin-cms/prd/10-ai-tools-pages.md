# 10 — AI Tools Pages

> **Section:** AI Tools · **Audience:** Product, Editorial, SEO, ML/Platform, Security.
> **Status:** PRD v1.0 — grounded in [05-analytics-monetization-ai.md §C](../05-analytics-monetization-ai.md) and the
> `imperialpedia-service` `aiController.js` / `aiService.js` (provider-agnostic, keyless-fallback).

**Section purpose.** This section specifies the admin surfaces where editors invoke AI as a **suggestion engine**, never an
author. Four point tools (Draft Assistant, Fact Checker, SEO Assistant, Internal Link Assistant) sit inline and as batch
panels under `/admin/ai/*`; an operations console (`/admin/ai-hub`) governs jobs, tokens, cost, quotas, and provider
failover; and a wire-to-draft pipeline (`/admin/news-ai`) drafts news for editor approval. The hard invariant across every
page: **AI output is a human-accepted suggestion. AI may write to `imperialpedia.ai_jobs` and may propose block/SEO/link
patches, but it can NEVER transition `cms.cms_contents.status` past `draft`.** Every accepted suggestion is attributed to the
accepting human, flagged `ai_generated`/`ai_assisted`, and emitted to `audit-service` (:3032). When `AI_API_KEY` is absent,
`aiService.generate()` returns `null` and each tool degrades to a deterministic templated/heuristic fallback — the pages
stay fully usable, clearly labelled "Heuristic (no AI key)". Authorization for every action is checked at `rbac-service`
(:3005, `/v1/authorize`, deny-overrides). All endpoints are RS256-authed (`@baalvion/auth-node`, aud `baalvion-platform`).

Cross-references instead of duplication: SEO scoring rules → [03-seo-and-media.md](../03-seo-and-media.md); the editorial
status machine and who-can-publish → [04-rbac-and-workflow.md](../04-rbac-and-workflow.md); glossary linking dictionary and
term schema → [02-content-cms.md §E](../02-content-cms.md); analytics content-gap feed → [05 §A.4](../05-analytics-monetization-ai.md).

---

## Section conventions (applies to every page below)

- **Envelope:** every REST response is `{ success, data, error, meta:{total,page,limit} }` under `/v1`.
- **AI call contract:** all generative calls funnel through `POST /v1/ai/{generate,seo,score,factcheck,link,summary,faq}`.
  Each call **creates an `imperialpedia.ai_jobs` row** (`kind`, `content_id`, `requested_by`, `status`, `input`, `output`,
  `provider`, `tokens_in/out`, `cost_cents`) so cost/provenance is captured for *every* tool. The synchronous response
  returns the suggestion; the row is the durable record `/admin/ai-hub` reads.
- **`ai:use`** is the floor permission to *invoke* any tool; **`ai:configure`** gates provider/quota/key changes.
- **Suggestion ≠ mutation.** Invoking a tool needs `ai:use`. *Applying* a suggestion additionally needs the underlying
  content capability (e.g. `content:edit.own`/`content:edit.any`, `seo:metadata`, `seo:links`, `glossary:edit`). RBAC is
  re-checked at apply time — a viewer of a suggestion is not an applier of it.
- **Roles → capability map** (the 8 canonical roles): Super Admin & Admin hold all `ai:*` + content caps; Managing Editor &
  Editor hold `ai:use` + their content/seo caps (Editor scoped to assigned categories, scope **S**); SEO Manager holds
  `ai:use` + `seo:*`; Legal Reviewer holds `ai:use` for read/fact-check context only (no apply-to-prose); Author holds
  `ai:use` + `content:edit.own` (own drafts only); Contributor holds `ai:use` + `content:edit.own` on **drafts only** (no
  apply that changes published content, no `media:delete`).
- **Audit:** accept/apply/reject/configure all emit `baalvion:events` consumed by `audit-service` (WORM hash-chain).

---

## Draft Assistant — `/admin/ai/draft`

**Purpose.** Turn a title, an outline, or an analytics-sourced content gap into **draft content blocks** (headings,
paragraphs, infobox, suggested references) grounded by RAG over Imperialpedia's *own* published corpus + structured
`entities`/`market_assets`. Output lands as proposed blocks in a draft `cms_contents` row (or as patch blocks appended to an
existing draft), every block flagged `ai_generated:true`. The assistant **cannot** move the item past `draft`; a fact-check
gate and the normal editorial workflow still apply before publish.

**Route.** `/admin/ai/draft` (batch panel) + inline slash-command (`/ai draft`) in the block editor (see
[02-content-cms.md §D](../02-content-cms.md)).

**Components.**
- `DraftBriefForm` — mode tabs: *From Title* · *From Outline* · *From Content Gap*; target `content_type` selector
  (article/encyclopedia/guide/tutorial/news), category, tone/voice preset, length budget.
- `ContentGapPicker` — pulls zero-result / high-volume queries from the analytics content-gap engine ([05 §A.4](../05-analytics-monetization-ai.md)).
- `RagSourcePanel` — shows which owned articles + entities were retrieved as grounding (transparency / anti-hallucination);
  per-source include/exclude toggles.
- `OutlineEditor` — editable H2/H3 skeleton before generation.
- `DraftPreview` — rendered block diff (proposed blocks vs current draft), per-block **Accept / Edit / Discard**.
- `AiProvenanceBadge` — "AI-generated · unverified · fact-check required" banner pinned to accepted blocks.
- `KeylessFallbackNotice` — shown when `ai:status.enabled === false`; switches copy to "Outline scaffold (heuristic)".
- `JobCostChip` — live tokens/cost for the run (links to `/admin/ai-hub`).

**Permissions required.**
- Invoke: `ai:use`. Roles: Super Admin, Admin, Managing Editor, Editor (scope **S** — only categories they own),
  SEO Manager (rarely; allowed), Author (own drafts), Contributor (own drafts).
- Apply blocks into a draft: additionally `content:create` (new draft) or `content:edit.own`/`content:edit.any`.
  Contributor/Author limited to their own drafts; Editor limited to scope **S**. Legal Reviewer is **excluded** from applying
  (no `content:edit.*`).
- Apply never grants publish: `content:publish`/`content:schedule` are out of scope here by design.

**API endpoints used.**
- `GET  /v1/ai/status` — provider/enabled (drives keyless mode).
- `POST /v1/ai/generate` — `{ mode:'title'|'outline'|'gap', contentType, brief, outline?, gapQueryId?, contentId? }` →
  `{ jobId, blocks[], sources[], ai_generated:true }`.
- `POST /v1/content/:id/blocks:apply` — persist accepted blocks into the draft (cms-service; requires content cap).
- `POST /v1/content` — create a new draft when generating from scratch.
- `GET  /v1/analytics/content-gaps` — populate the Content Gap picker.
- `GET  /v1/ai/jobs/:jobId` — poll async job status/cost.

**Database tables affected.**
- `imperialpedia.ai_jobs` (insert: `kind='generate'`, tokens/cost/provider/provenance).
- `cms.cms_contents` (insert/update: `content_blocks` JSONB, `custom_fields.ai_generated=true`, stays `status='draft'`).
- `cms.cms_revisions` (new revision on apply — reuses CMS revisioning).
- Read-only grounding: `imperialpedia.entities`, `imperialpedia.market_assets`, `imperialpedia.articles` (read projection),
  `cms.cms_contents` (published corpus for RAG).

**Wireframe.**
```
┌─ /admin/ai/draft ───────────────────────────────────────── [AI: Claude ●] [Cost: 1.2k tok · $0.004] ┐
│ Mode: ( From Title )( From Outline )(•From Content Gap )      Type [Article ▾]  Category [Investing ▾] │
│ ┌─ Brief ───────────────────────────────┐  ┌─ RAG sources (grounding) ──────────────────────────────┐ │
│ │ Gap query: "what is a bond ladder"     │  │ ☑ Art: "Fixed Income 101"   ☑ Entity: U.S. Treasury     │ │
│ │  vol 14k/mo · 0 results internally     │  │ ☑ Term: Duration            ☐ Art: "Yield Curve" (old)  │ │
│ │ Tone [Educational ▾] Length [~1200w ▾] │  └─────────────────────────────────────────────────────────┘ │
│ └────────────────────────────────────────┘                            [ Generate draft ⤵ ]            │
│ ┌─ Proposed blocks (all flagged AI-generated · unverified) ──────────────────────────────────────────┐ │
│ │ H1  What Is a Bond Ladder?                                   [Accept] [Edit] [Discard]              │ │
│ │ ¶   A bond ladder is a portfolio of … (3 refs suggested)     [Accept] [Edit] [Discard]              │ │
│ │ ▣   Infobox: type, typical maturities, key risks            [Accept] [Edit] [Discard]              │ │
│ │ ⚠ Fact-check required before this draft can be submitted →  [ Open Fact Checker ]                   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Empty / Loading / Error states.**
- *Empty:* no brief → CTA "Start from a title, paste an outline, or pick a content gap". Content-gap picker empty → "No
  open content gaps — analytics finds none this week."
- *Loading:* per-block skeleton shimmer; job status chip `queued → running`; cancellable (`DELETE /v1/ai/jobs/:id`).
- *Error:* provider 5xx/timeout → job `failed`, banner "AI unavailable — switched to heuristic outline" + retry; quota
  exceeded → blocked with link to `/admin/ai-hub`.
- *Edge cases:* near-duplicate detection (embedding similarity ≥ threshold) warns "Similar to existing article X — extend
  instead?"; financial-claim blocks are pre-flagged so they cannot bypass fact-check; RAG returning zero owned sources →
  forces "ungrounded — extra scrutiny" badge; Contributor applying to a non-own draft → 403.

---

## Fact Checker — `/admin/ai/fact-check`

**Purpose.** Extract atomic **claims** from a draft (prioritising numbers, dates, statistics, and definitions), check each
against trusted external sources + internal `entities`/`glossary_terms`, and flag claims as *supported / unsupported /
contradicted* with cited evidence inline. **Financial claims are always human-confirmed** — the tool never marks a financial
or quantitative claim "verified" autonomously; it can only mark it *needs human confirmation* with evidence attached. A
content item cannot leave `draft` toward review until every extracted financial/quantitative claim is human-adjudicated
(soft gate surfaced here; hard gate enforced at `submit_for_review` in the workflow — see [04](../04-rbac-and-workflow.md)).

**Route.** `/admin/ai/fact-check` (queue + per-item checker) + inline gutter markers in the block editor.

**Components.**
- `ClaimExtractionTable` — claim text, type (number/date/stat/definition/general), source block, status pill.
- `EvidencePanel` — per claim: matched internal entity/glossary entry + external source snippets + confidence; **Confirm /
  Reject / Mark unsupported** actions (human required).
- `FinancialClaimGuard` — distinct red treatment + mandatory "Human-confirmed by {user}" checkbox before a financial claim
  can be cleared; cannot be satisfied by AI.
- `ClaimCoverageMeter` — % of claims adjudicated; blocks the "ready" signal until 100% of financial claims resolved.
- `SourceTrustBadge` — labels each cited source by trust tier (internal-canonical > primary > secondary).
- `InlineClaimMarkers` — editor gutter dots (green/amber/red) deep-linking to the claim.

**Permissions required.**
- Invoke: `ai:use` + `content:read`. Roles: all editorial roles + Legal Reviewer (read-only context for legal queue).
- Adjudicate a claim (confirm/reject): `content:review` **or** `content:edit.own`/`content:edit.any` on the item.
  Editor scope **S**; Author/Contributor only on own drafts. Legal Reviewer may **read** evidence but adjudication of
  editorial claims requires `content:review` (Legal Reviewer's `content:legal_review` covers the legal gate, not factual).
- Clearing a financial claim: same as adjudicate **plus** the human-confirm checkbox (no extra capability, but irreducibly
  manual).

**API endpoints used.**
- `POST /v1/ai/factcheck` — `{ contentId }` → `{ jobId, claims:[{ id, text, type, status, evidence[], sources[] }] }`.
- `GET  /v1/ai/jobs/:jobId` — async poll.
- `POST /v1/content/:id/claims/:claimId:adjudicate` — `{ decision:'confirm'|'reject'|'unsupported', note }` (writes the
  human decision; records `confirmed_by`).
- `GET  /v1/glossary/terms?match=…` and `GET /v1/entities?match=…` — internal corroboration lookups.

**Database tables affected.**
- `imperialpedia.ai_jobs` (insert: `kind='factcheck'`, output = extracted claims + evidence).
- `cms.cms_contents` (update: `custom_fields.factcheck` = adjudication state; flips a "ready" hint, **not** status).
- `cms.cms_revisions` (revision when a claim edit changes a block).
- Read-only: `imperialpedia.entities`, `imperialpedia.glossary_terms`, `imperialpedia.references`,
  `imperialpedia.term_references`.

**Wireframe.**
```
┌─ /admin/ai/fact-check · "What Is a Bond Ladder?" ─────────────── Claims 7 · Adjudicated 3/7 ─────────┐
│ ┌─ Claims ───────────────────────────────────────────────────────────────────────────────────────┐  │
│ │ ● num   "10-year Treasury yields ~4.3%"   ⚠ FINANCIAL · needs human confirm   [Confirm☐][Reject] │  │
│ │ ● date  "Series I bonds reset in May/Nov" ✓ supported (gov source)            [Confirm][Reject]  │  │
│ │ ● def   "A bond ladder is …"              ✓ matches glossary: Bond Ladder      [Confirm][Reject]  │  │
│ │ ● stat  "outperforms cash 78% of years"   ✗ unsupported — no source found      [Mark unsupported] │  │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│ ┌─ Evidence: "10-year Treasury yields ~4.3%" ──────────────────────────────────────────────────────┐  │
│ │ Internal: entity "U.S. 10Y Treasury" (market_assets) → 4.31%   [trust: internal-canonical]        │  │
│ │ External: treasury.gov daily rates 2026-06-03 → 4.30%          [trust: primary]                    │  │
│ │ ⚠ Financial claim — a human must confirm. ☐ I confirm this figure (records my name).               │  │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│ Coverage: ███████░░░ 3/7  ·  Financial claims unresolved: 1  →  submit-for-review BLOCKED              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Empty / Loading / Error states.**
- *Empty:* no claims extracted → "No checkable claims found (no numbers, dates, or definitions)."
- *Loading:* extraction skeleton; per-claim evidence lazy-loads.
- *Error:* external source unreachable → claim drops to "unverifiable — manual check"; AI off → heuristic extractor (regex
  for numbers/dates + glossary/entity match only), labelled "Heuristic extraction".
- *Edge cases:* contradicted claim (internal entity says X, prose says Y) → red "contradiction" with both values;
  duplicate claims deduped; a financial claim can never auto-clear even with a strong source match; re-running after an edit
  re-extracts and preserves prior human confirmations keyed by claim hash.

---

## SEO Assistant — `/admin/ai/seo`

**Purpose.** Suggest meta title, meta description, focus keyword, heading structure, internal links, and JSON-LD schema gaps
for a piece of content, with **one-click apply per individual suggestion**. The assistant re-runs the canonical SEO score
engine after any apply (it does not invent a parallel score) and **never edits prose** — only metadata, headings outline
hints, and structured data. Scoring/rule details live in [03-seo-and-media.md](../03-seo-and-media.md); this page is the
AI-suggestion surface over them.

**Route.** `/admin/ai/seo` (batch panel). The non-AI SEO workbench lives at `/admin/seo` and `/admin/seo-audit`; this page
deep-links to those and shares the same apply endpoints.

**Components.**
- `SeoSuggestionList` — grouped suggestions: *Meta* · *Keywords* · *Headings* · *Internal links* · *Schema*; each row has
  current value, suggested value, rationale, and a single **Apply** button.
- `MetaPreview` — Google SERP + OpenGraph/Twitter card live preview reflecting accepted changes.
- `KeywordTargetCard` — focus keyword + secondary keywords with volume/difficulty hints (from analytics/search).
- `SchemaGapPanel` — missing/invalid JSON-LD (`Article`, `FAQPage`, `BreadcrumbList`) with one-click insert.
- `SeoScoreDelta` — before/after score from the SEO engine; refreshes on each apply.
- `BulkApplyBar` — "Apply all safe suggestions" (only the non-destructive, length-valid ones).

**Permissions required.**
- Invoke: `ai:use`. Roles: Super Admin, Admin, Managing Editor, Editor (scope **S**), **SEO Manager** (primary user),
  Author/Contributor (suggestions on own drafts).
- Apply meta/keyword/heading/schema: `seo:metadata`. Apply internal-link suggestions: `seo:links` (overlaps the Internal
  Link Assistant; see that page). Redirect/sitemap suggestions, if surfaced, require `seo:redirects`/`seo:sitemaps`.
- SEO Manager is the canonical role here (Editor + `seo:*`); SEO Manager **cannot publish prose alone** — applying SEO does
  not move workflow status.
- Legal Reviewer excluded (no `seo:*`). Contributor: apply only on own drafts.

**API endpoints used.**
- `POST /v1/ai/seo` — `{ contentId }` → `{ jobId, suggestions:{ meta, keywords, headings, links[], schema[] } }`.
- `POST /v1/content/:id/seo:apply` — `{ field, value }` per accepted suggestion (cms-service; writes `seo_metadata`).
- `POST /v1/ai/score` — re-score (kind `score`), returns updated SEO/quality numbers.
- `GET  /v1/seo/keywords?contentId=…` — volume/difficulty enrichment (analytics/search-service).

**Database tables affected.**
- `imperialpedia.ai_jobs` (insert: `kind='seo'` and `kind='score'`).
- `cms.cms_contents` (update: `seo_metadata` JSONB, `content_blocks` for heading/schema blocks, `quality_score`).
- `cms.cms_revisions` (revision per applied change).
- Read-only: analytics keyword tables; `search-service` index for internal-link candidates.

**Empty / Loading / Error states.**
- *Empty:* perfect score → "No SEO suggestions — this page already meets targets." Save a "snapshot" anyway.
- *Loading:* suggestion rows skeleton; SERP preview placeholder.
- *Error:* AI off → heuristic suggestions (length/keyword-density/heading-count rules, no LLM rationale), labelled
  "Heuristic SEO"; apply still works because apply is a deterministic cms-service write.
- *Edge cases:* a suggested meta title exceeding length limits is rejected at apply with the cms-service validation error
  surfaced inline; "Apply all safe" skips any suggestion that would fail validation; applying to a published item creates a
  pending change per workflow (does not silently mutate live SEO); sponsored content respects `noindex` rules from
  [05 §B](../05-analytics-monetization-ai.md).

---

## Internal Link Assistant — `/admin/ai/links`

**Purpose.** Suggest internal links from prose to glossary terms and related articles using the **linking dictionary +
embeddings**, ranked by relevance, with accept/reject per suggestion. Strictly respects the **1-link-per-term cap** (a given
term is linked at most once per article — first/most-relevant occurrence) and never over-links. Inserting a link is a block
edit; it does not change workflow status.

**Route.** `/admin/ai/links` (batch panel) + inline "suggest links" action in the block editor.

**Components.**
- `LinkSuggestionTable` — anchor phrase, target (glossary term / article), relevance score, source (dictionary vs
  embedding), occurrence position; **Accept / Reject / Skip term**.
- `OneLinkPerTermGuard` — visually groups suggestions by target term; only one acceptable occurrence is selectable, the
  rest are greyed with "term already linked".
- `LinkDensityMeter` — links-per-1000-words against an over-linking ceiling; warns before accept pushes past it.
- `TargetPreviewPopover` — hover preview of the destination term/article (avoid linking to stubs).
- `BulkAcceptBar` — "Accept top N high-confidence" (still capped per term).
- `Broken/Orphan note` — flags suggestions whose target is unpublished or low-authority.

**Permissions required.**
- Invoke: `ai:use`. Roles: Super Admin, Admin, Managing Editor, Editor (scope **S**), SEO Manager, Author/Contributor
  (own drafts).
- Apply (insert link into a block): `seo:links`. If the action also edits/creates the glossary target, `glossary:edit`.
  Editor scope **S**; Author/Contributor own drafts only. Legal Reviewer excluded.

**API endpoints used.**
- `POST /v1/ai/link` — `{ contentId }` → `{ jobId, suggestions:[{ anchor, targetType, targetId, score, source, pos }] }`.
- `POST /v1/content/:id/links:apply` — `{ anchor, targetId, blockId, pos }` (enforces 1-link-per-term server-side; cms).
- `GET  /v1/glossary/terms?match=…` — dictionary candidates; `GET /v1/search?type=related` — embedding candidates.

**Database tables affected.**
- `imperialpedia.ai_jobs` (insert: `kind='link'`).
- `cms.cms_contents` (update: `content_blocks` — inline link marks; `quality_score` may refresh).
- `cms.cms_revisions` (revision per applied link batch).
- Read-only: `imperialpedia.glossary_terms`, `imperialpedia.glossary_relations`, `imperialpedia.articles` /
  `cms.cms_contents` (link targets), embeddings store.

**Empty / Loading / Error states.**
- *Empty:* "No internal links to add — every relevant term is already linked or has no good target."
- *Loading:* table skeleton; embedding lookups lazy.
- *Error:* AI/embeddings off → dictionary-only exact/alias matching fallback ("Dictionary-only"); apply still server-checks
  the cap.
- *Edge cases:* server is the source of truth on the 1-link-per-term cap — if two clients accept the same term, the second
  apply 409s "term already linked"; self-link to the same content is filtered; links to `draft`/archived targets warned;
  over-density accept is blocked with a confirm.

---

## AI Jobs / Usage Console — `/admin/ai-hub`

**Purpose.** Operate and govern the AI layer: a searchable ledger of every `ai_jobs` run (kind, content, requester, status,
provider, tokens, cost), aggregate **tokens / cost / quota** dashboards per role/user/kind, **provider failover** config and
health, cached-result hit rate, and key/quota administration. This is the cost-and-provenance control room that every other
AI page feeds. It exposes no way to bypass the human-in-the-loop rule — it observes and governs jobs, it does not publish
content.

**Route.** `/admin/ai-hub` (existing scaffolded route; single `page.tsx` today → expands to tabs).

**Components.**
- `AiJobsTable` — paginated, filter by kind/status/provider/requester/date; row → job detail drawer (input/output, cost,
  linked content, retry/cancel).
- `JobDetailDrawer` — full I/O (redacted secrets), provenance, "open in tool", retry (`failed` only).
- `UsageDashboard` — tokens & cost over time, by `kind`, by user, by role; budget burn-down.
- `QuotaManager` — per-role / per-user quotas (`ai:configure`); shows current consumption vs cap; throttle state.
- `ProviderFailoverPanel` — ordered provider list (Claude → Gemini → keyless), live health, manual failover toggle, model
  pin; reflects `aiService` env (`AI_PROVIDER`/`AI_MODEL`).
- `CacheStatsCard` — identical-input cache hit rate / savings.
- `KeylessModeBanner` — global "AI disabled (no key) — all tools in heuristic mode" when `status.enabled=false`.
- `CostAlertsConfig` — budget thresholds → `notification-service` alerts.

**Permissions required.**
- View jobs/usage: `audit:view` **or** `analytics:view` (read). Roles: Super Admin, Admin, Managing Editor (read).
  Authors/Contributors see **only their own** jobs (row-filtered by `requested_by`).
- Revenue/cost in money terms: `analytics:revenue` (Admin, Managing Editor).
- Configure providers/quotas/keys/failover: `ai:configure` **+** (for keys) `system:settings`. Roles: Super Admin, Admin
  only. Editors/SEO/Author/Contributor/Legal: **no** configure.
- Retry/cancel a job: `ai:use` on own job, or `ai:configure` for any job.

**API endpoints used.**
- `GET  /v1/ai/jobs` — list/filter (`?kind=&status=&requestedBy=&provider=&from=&to=`), envelope `meta.total/page/limit`.
- `GET  /v1/ai/jobs/:id` — detail.
- `POST /v1/ai/jobs/:id:retry` · `DELETE /v1/ai/jobs/:id` — retry/cancel.
- `GET  /v1/ai/usage?groupBy=kind|user|role&from=&to=` — aggregates.
- `GET  /v1/ai/quotas` · `PUT /v1/ai/quotas` — quota read/update (`ai:configure`).
- `GET  /v1/ai/providers` · `PUT /v1/ai/providers` — failover/order/health (`ai:configure`).
- `GET  /v1/ai/status` — enabled/provider/model.

**Database tables affected.**
- `imperialpedia.ai_jobs` (read aggregate; update on retry/cancel `status`).
- Quota/provider config: `imperialpedia.ai_*` config rows (or platform settings store) — written under `ai:configure`.
- Read-only join to `cms.cms_contents` (link job → content title). Cost alerts dispatch via `notification-service` (no DB
  write here beyond the alert config row).

**Wireframe.**
```
┌─ /admin/ai-hub ──── [ Jobs ] [ Usage ] [ Quotas ] [ Providers ] ───── AI: Claude ● · Cache hit 41% ─┐
│ Filters: kind [all ▾] status [all ▾] provider [all ▾] user [all ▾]  from[2026-06-01] to[2026-06-04]   │
│ ┌─ Jobs ─────────────────────────────────────────────────────────────────────────────────────────┐  │
│ │ time     kind      content                 by        provider  tok(in/out)  cost   status          │  │
│ │ 14:02    factcheck "Bond Ladder"           a.editor  claude    820 / 540    $0.006 ● done   [open] │  │
│ │ 14:00    generate  "Bond Ladder"           a.editor  claude    310 / 1180   $0.011 ● done   [open] │  │
│ │ 13:51    seo       "Yield Curve Inversion"  s.seo     gemini    400 / 220    $0.001 ● done   [open] │  │
│ │ 13:40    link      "ETF Basics"            j.author  —         —     —        $0.000 ⚠ heuristic    │  │
│ │ 13:22    summary   "CPI Explained"          m.editor  claude    900 / 160    $0.004 ✗ failed [retry]│  │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│ Usage today: 38k tokens · $0.21  ·  Budget $5.00/day ███░░░░░░░ 4%  ·  Quota: editor 200/500 runs      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Empty / Loading / Error states.**
- *Empty:* no jobs in range → "No AI jobs yet." Quotas unset → "Using platform defaults."
- *Loading:* table + chart skeletons; provider health pings async.
- *Error:* provider health check fails → red dot + "degraded"; quota update conflict → optimistic-rollback toast; a
  non-Admin hitting a configure tab → 403 with read-only fallback.
- *Edge cases:* failed jobs are retryable but a retry creates a **new** `ai_jobs` row (immutable history); cancelling a
  running job marks it `failed` with reason `canceled`; cost shows `$0.000` for keyless/heuristic runs; Author/Contributor
  views are hard-filtered to `requested_by = self` server-side (no client trust).

---

## News AI Pipeline — `/admin/news-ai`

**Purpose.** Ingest news wires / RSS / approved feeds and **draft `news`-type content** (headline, dek, body blocks, tickers,
source attribution, suggested category/tags) for **editor approval**. Like every AI surface, output is a draft suggestion:
the pipeline writes `cms_contents` rows at `status='draft'` flagged `ai_generated`, attributes the source, and **cannot
publish or schedule** — a human editor runs the fast-track news workflow (Author→Editor→Publish, see
[02 §B](../02-content-cms.md)/[04](../04-rbac-and-workflow.md)). Embargoed wires honour `embargoAt`.

**Route.** `/admin/news-ai` (existing scaffolded route).

**Components.**
- `FeedSourceManager` — registered wires/RSS sources, poll cadence, trust tier, enable/disable (`ai:configure` + editorial
  ownership).
- `IncomingWireList` — raw items (source, timestamp, dedupe-cluster, embargo flag); **Draft / Dismiss / Cluster**.
- `WireToDraftPanel` — generated `news` draft preview (headline/dek/body blocks/tickers) with per-block accept; source
  attribution block is mandatory and locked.
- `DuplicateClusterBadge` — groups near-duplicate wires (embeddings) so one story → one draft.
- `EmbargoGuard` — items under embargo cannot be drafted-to-review until `embargoAt`; visible countdown.
- `ApprovalHandoff` — "Send to editorial queue" → creates/updates the draft and routes via workflow (no publish here).
- `FactCheckLink` — financial/market claims route through [Fact Checker](#fact-checker--adminai-fact-check).

**Permissions required.**
- View feeds & incoming wires: `ai:use` + `content:read`. Roles: Managing Editor, Editor (news category, scope **S**),
  Author, Admin, Super Admin. SEO Manager/Legal Reviewer: read-only.
- Draft a wire → `news` content: `ai:use` + `content:create` (and `content:edit.own` for the resulting draft). Author/
  Contributor produce drafts only; Editor scope **S**; **publish/schedule explicitly excluded**.
- Manage feed sources / poll config: `ai:configure` (+ `system:settings` for credentials). Roles: Admin, Super Admin,
  Managing Editor (sources only, not keys).
- Approve/route to publish: handled by the workflow page, requiring `content:publish`/`content:schedule` (Managing Editor /
  Admin) — **not** granted on this page.

**API endpoints used.**
- `GET  /v1/news-ai/feeds` · `POST/PUT/DELETE /v1/news-ai/feeds/:id` — source CRUD (`ai:configure`).
- `GET  /v1/news-ai/wires?status=new|clustered|drafted` — incoming items.
- `POST /v1/ai/generate` — `{ mode:'news', wireId }` → drafted `news` blocks (creates `ai_jobs kind='generate'`).
- `POST /v1/content` — create the `news` draft (cms-service; `status='draft'`).
- `POST /v1/ai/factcheck` — gate financial/market claims.
- `POST /v1/content/:id:submit` — hand to editorial workflow (requires `content:submit`).

**Database tables affected.**
- `imperialpedia.ai_jobs` (insert: `kind='generate'`, `input.wireId`).
- `cms.cms_contents` (insert: `content_type='news'`, `status='draft'`, `custom_fields`: `sourceUrl`, `wire`, `embargoAt`,
  `tickers[]`, `ai_generated=true`).
- News-AI feed/wire tables (`imperialpedia.news_feeds`, `imperialpedia.news_wires` — pipeline-owned) for source/ingest
  state and dedupe clusters.
- `cms.cms_revisions` on draft creation. Read-only: `imperialpedia.market_assets`/`entities` for ticker resolution.

**Empty / Loading / Error states.**
- *Empty:* no sources → onboarding "Add a wire/RSS source to start." No new wires → "Inbox clear."
- *Loading:* wire list streamed; draft generation shows job progress.
- *Error:* feed unreachable → source marked degraded, last-good timestamp shown; AI off → wires still ingest, drafting falls
  back to "scaffold from headline + source quote" heuristic; generation failure → wire returns to `new`.
- *Edge cases:* embargoed item drafting is allowed but submit-to-review is blocked until `embargoAt`; duplicate cluster
  prevents multiple drafts of one story; a financial/market claim in a wire forces the Fact Checker gate before submit;
  source attribution block is non-removable (provenance/legal); a wire older than retention window is auto-archived.

---

## Section-wide invariants (recap)

1. **AI never advances workflow.** No AI endpoint writes `cms_contents.status` beyond `draft`; transitions belong to the
   workflow ([04](../04-rbac-and-workflow.md)) and require `content:submit/review/seo_review/legal_review/publish/schedule`.
2. **Every suggestion is attributed + audited.** Accept/apply/reject/configure emit `baalvion:events` → `audit-service`
   (WORM). Accepted content carries `ai_generated`/`ai_assisted`; AI is never credited as a human author.
3. **Financial claims are always human-confirmed.** No autonomous "verified" on financial/quantitative claims.
4. **Keyless never hard-fails.** Missing `AI_API_KEY` → `aiService.generate()` returns `null` → deterministic heuristic
   fallback per tool, labelled in the UI.
5. **Two-gate authorization.** Invoke needs `ai:use`; apply needs the underlying content/SEO/glossary capability, re-checked
   at `rbac-service`; scope **S** (assigned categories) constrains Editors; Author/Contributor are own-draft-only;
   Legal Reviewer reads but does not apply to prose; provider/quota/key changes need `ai:configure` (+ `system:settings`).
6. **Cost is always recorded.** Every generative call writes an `imperialpedia.ai_jobs` row; `/admin/ai-hub` is the ledger.
