# 03 — Content Management Pages (PRD)

> **Section purpose.** This document specifies the editorial **content-management surfaces** of the
> Imperialpedia admin panel — the screens an Author, Editor, SEO Manager, Legal Reviewer, Managing
> Editor, or Admin uses to find, create, edit, route, and govern the seven editorial content types
> (Article, Encyclopedia, Financial Term, Guide, Tutorial, News, FAQ). It covers the universal **All
> Content** list, the **Create** type-picker, the **Edit** entry point (the block editor itself is
> specified in [13-content-editor-blocks.md](./13-content-editor-blocks.md)), the seven **type-scoped
> management views**, and the cross-cutting **Trash/Archive**, **Bulk operations**, and **Import/Export**
> surfaces. The canonical store is `cms.cms_contents` discriminated by `content_type`; the thin
> `imperialpedia.articles` table is a read projection rebuilt from `content.published` events. See
> [../02-content-cms.md](../02-content-cms.md) for the schema/store reconciliation and
> [04-rbac-and-workflow.md](./04-rbac-and-workflow.md) for the full workflow state machine.

## Conventions used in this document

- **Admin BFF surface.** The admin UI calls a stable `/v1` REST facade and a GraphQL read-BFF. The facade
  proxies the website-scoped cms-service routes (`/cms/websites/:websiteId/content…`) after resolving the
  active `websiteId` (Imperialpedia website) and re-checking authorization at `rbac-service`. Endpoints
  below are written in the `/v1` admin form; the proxied cms-service path is noted where it clarifies.
- **Envelope.** All REST responses use `{ success, data, error, meta:{ total, page, limit } }`.
- **Authorization.** Every mutation is RS256-authed (`@baalvion/auth-node`) and authorized by
  `rbac-service` `/v1/authorize` (deny-overrides). Capability strings are the canonical vocabulary; scope
  notes use category scope **S** (the editor's assigned `category_id` subtree).
- **Roles.** viewer < member < editor < manager < admin < owner < super_admin. The 8 product roles map to:
  Super Admin, Admin, Managing Editor (manager), Editor, SEO Manager, Legal Reviewer, Author, Contributor.

---

## All Content list

**Purpose.** The single source-of-truth index across every editorial type. It is the editorial team's home
base: filter by type/status/category/author/language, search, persist saved views, see SEO score and
workflow state at a glance, and run bulk actions. It replaces the per-type "find my work" pattern with one
governed list whose visible rows are scoped by the caller's role and category scope **S**.

**Route.** `/admin/content`

**Components.**
- `ContentToolbar` — `[+ New ▾]` type-picker dropdown, `[⤓ Import]`, `[⤒ Export]`, global result count.
- `ContentFilterBar` — `TypeFilter`, `StatusFilter`, `CategoryFilter` (tree select), `AuthorFilter`,
  `LanguageFilter`, debounced `SearchInput`, `SavedViewsMenu` (⚙).
- `ContentTable` — virtualized rows: select checkbox, Title (link to edit), Type chip, `StatusBadge`,
  Author, `SeoScorePill`, Updated (relative), row `⋯` actions (Edit, Preview, Duplicate, Move to Trash).
- `BulkActionBar` — appears on selection: Publish, Archive, Move to Trash, Assign category, Add tags, Export.
- `Pagination`, `SavedViewDialog`, `ColumnSettingsPopover`, `EmptyState`, `TableSkeleton`, `ErrorState`.

**Permissions required.**
- View list: `content:read`. All 8 roles have read; **row visibility is scoped**:
  - Super Admin / Admin / Managing Editor → all rows (no scope filter).
  - Editor / SEO Manager → rows within their category scope **S** (`content:read` ∩ S). SEO Manager sees
    all statuses but acts only via SEO gates.
  - Legal Reviewer → narrow: only items in `legal_review` plus read of any item routed to legal; cannot see
    drafts outside the legal queue (cross-ref the Legal Review Queue in
    [04-rbac-and-workflow.md](./04-rbac-and-workflow.md)).
  - Author → only `author_id = self` (own content).
  - Contributor → only `author_id = self`, restricted to non-published of own drafts.
- Bulk publish/archive within the bar require the per-action capability (see Bulk operations page).

**API endpoints used.**
- `GET /v1/content?type&status&category&author&language&q&page&limit&sort` — proxies
  `GET /cms/websites/:websiteId/content`. Returns paginated rows + `meta`.
- `GET /v1/content/saved-views` / `POST /v1/content/saved-views` / `DELETE /v1/content/saved-views/:id` —
  per-user persisted filter+sort (admin-BFF owned; see Database note).
- `GET /v1/categories` and `GET /v1/tags` — populate filter selects (proxy `…/categories`, `…/tags`).
- `POST /v1/content/bulk` — bulk action dispatch (proxies `…/content/bulk`).

**Database tables affected.**
- Read: `cms.cms_contents` (list + filters via indexes `cms_contents_type_status`, `(status)`, `(author_id)`,
  `(category_id)`; FTS via `cms_contents_title_fts` / `search_vector`), `cms.cms_categories`, `cms.cms_tags`.
- Saved views persisted in `cms.cms_contents`-adjacent admin store (`admin.saved_views`, BFF-owned) — does
  not mutate editorial tables.
- No write to editorial tables from the list itself (mutations go through Bulk/Edit).

**Wireframe.**
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  All Content        [+ New ▾]  [⤓ Import]  [⤒ Export]                       1,204 items     │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Type ▾  Status ▾  Category ▾  Author ▾  Language ▾   🔎 search…       ⚙ Saved views ▾ │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│  ☐  Title                               Type     Status         Author    SEO   Updated    │
│  ☐  Understanding Compound Interest      Article  ● Published    A. Rao    92    2h ago     │
│  ☐  Exchange-Traded Fund                 Encyc.   ◐ SEO Review   M. Khan   71    1d ago  ⋯  │
│  ☐  What is a P/E ratio?                 Term     ◌ Draft        —         48    3d ago     │
│  ☐  CPI shock: what it means             News     ◍ Legal Rev.  J. Diaz   80    5h ago     │
│  ── 3 selected: [Publish] [Archive] [Trash] [Assign category] [Add tags] [Export] ──       │
│                                                              ◀ 1  2  3  …  41 ▶   25/page ▾ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Empty/Loading/Error states.**
- **Empty (no content):** illustration + "No content yet" + primary `[+ New]`. If filters are active and
  yield nothing → "No results for these filters" + `Clear filters`.
- **Loading:** `TableSkeleton` (10 shimmer rows); filter bar stays interactive; saved views menu disabled
  until views resolve.
- **Error:** non-blocking banner "Couldn't load content" + `Retry`; preserves filter state in the URL so a
  retry reproduces the query.

**Key edge cases.** Filters serialize to URL search params (shareable, back-button safe). Author filter for
Author/Contributor roles is pinned to self and hidden. Large category trees lazy-load children. `sort` is
allowlisted server-side (no arbitrary column injection). Saved views are per-user and never leak another
user's view ids.

---

## Create (type picker)

**Purpose.** A guided entry to author a new item. Choosing a type sets `content_type`, seeds the correct
`custom_fields` JSON-Schema, the block palette, and the workflow profile (Full / Standard / Fast-track /
Glossary-lite), then creates a `draft` row and routes to the editor.

**Route.** `/admin/content/new` (deep-linkable as `/admin/content/new?type=article`).

**Components.** `TypePickerGrid` (7 cards: Article, Encyclopedia, Financial Term, Guide, Tutorial, News,
FAQ — each with icon, one-line description, required-blocks hint, workflow badge), `TemplatePicker`
(optional starter templates per type), `CreateContentForm` (title, optional slug override, category,
language), `WorkflowProfileNote`, `SubmitBar`. Financial Term card deep-links to the glossary-linked flow
(cross-ref Glossary Terms management below).

**Permissions required.**
- `content:create`. Roles: Author (member + `content:author` → own), Contributor (drafts only),
  Editor / Managing Editor / Admin / Super Admin. SEO Manager and Legal Reviewer **cannot create** prose
  (no `content:create`); they act on existing items only.
- Selecting category is constrained to scope **S** for Editors; Authors/Contributors pick from allowed
  categories only. `news` fast-track requires the item to land in a News category.

**API endpoints used.**
- `POST /v1/content` (`createContentSchema`) → proxies `POST /cms/websites/:websiteId/content`. Body sets
  `contentType`, `title`, optional `slug`, `categoryId`, `customFields` (validated by the type's schema),
  `language`. Returns the new draft `{ id, slug, status:'draft' }`; UI redirects to
  `/admin/content/[slug]/edit`.
- `GET /v1/categories`, `GET /v1/tags` — populate selectors.

**Database tables affected.**
- Insert: `cms.cms_contents` (one row, `status='draft'`, `author_id=self`, default empty `content_blocks`).
- Insert: `cms.cms_content_revisions` (revision 1 snapshot on first save) — created by cms-service.
- No `imperialpedia.articles` write (projection only fires on publish).

**Empty/Loading/Error states.**
- **Loading:** type cards render instantly (static); category/template selectors show skeletons.
- **Error (create failed):** inline form error; **slug collision** → server returns 409, form surfaces
  "Slug already used on this site" with an auto-suggested unique slug.
- **Validation:** title required (1–500); `customFields` failing the type schema blocks create with
  field-level messages.

**Key edge cases.** If `?type=` is invalid, fall back to the picker grid. Creating a `financial_term`
prompts to link/create the structured glossary term first (1:1 `cms_content_id`). Double-submit guarded by a
client idempotency token. A Contributor who navigates here always lands in a draft they alone can see.

---

## Edit (block editor entry)

**Purpose.** The working surface for an existing item — block editing, inspector (type/category/tags/
language/SEO), autosave, comments, versions, and the workflow action rail. **The detailed editor and block
palette design lives in [13-content-editor-blocks.md](./13-content-editor-blocks.md);** this page documents
the route, the data contract, and the permission/workflow gating that wraps the editor.

**Route.** `/admin/content/[slug]/edit`

**Components.** `EditorShell` (header: back, title, `StatusBadge`, autosave indicator, `⋯` menu),
`BlockEditorCanvas` (see 13), `InspectorPanel` (Settings, SEO score, custom-fields form by type),
`WorkflowActionRail` (Save draft, Preview, Submit for review / Approve / Request changes / SEO approve /
Legal approve / Publish / Schedule — buttons shown per role+state), `CommentsDrawer`, `VersionHistoryDrawer`,
`UnsavedChangesGuard`, `ConflictBanner`.

**Permissions required.**
- Open editor: `content:read` (+ scope **S** / ownership as in the list). Edit blocks:
  - `content:edit.own` — Author/Contributor on their own items.
  - `content:edit.any` — Editor (within S), Managing Editor, Admin, Super Admin.
- Workflow actions on this page each require their capability and are also constrained by the state machine
  ([04-rbac-and-workflow.md](./04-rbac-and-workflow.md)):
  `content:submit`, `content:review`, `content:seo_review` (SEO Manager), `content:legal_review`
  (Legal Reviewer — approve/reject only, no prose edit), `content:publish` / `content:schedule`
  (Managing Editor, Admin, Super Admin), `content:rollback` (restore a revision), `content:archive`.
- SEO Manager edits SEO metadata (`seo:metadata`) and gates `content:seo_review` but **cannot publish prose
  alone**. Legal Reviewer sees read-only content + legal actions only.

**API endpoints used.**
- `GET /v1/content/:id` — load full item (`…/content/:contentId`).
- `PUT /v1/content/:id/autosave` (`autosaveContentSchema`) — debounced ~2s (`…/content/:contentId/autosave`).
- `PATCH /v1/content/:id` (`updateContentSchema`) — explicit save (`…/content/:contentId`).
- `POST /v1/content/:id/transition` (`transitionSchema`: `submit_for_review|approve|request_changes|publish|
  schedule|unpublish|archive|restore_to_draft`) → `…/content/:contentId/workflow/transition`.
- `GET /v1/content/:id/workflow` + `GET …/workflow/log` — current state + approval log.
- `GET /v1/content/:id/revisions`, `POST /v1/content/:id/revisions/:revId/restore` — version history/rollback.
- Media block uploads call the media API (cross-ref [../03-seo-and-media.md](../03-seo-and-media.md)).

**Database tables affected.**
- Update: `cms.cms_contents` (blocks, seo_metadata, custom_fields, status via transition, `last_edited_by`,
  `revision_count`, `scheduled_at`/`published_at`).
- Insert: `cms.cms_content_revisions` (autosave/save snapshots; restore writes a new revision).
- Insert/Update: `cms.cms_media_references` (block media usage rows).
- Read/Write: `cms.cms_workflows` + `cms.cms_approval_logs` (state + audit) via transition.
- On `publish`: emits `content.published` → projector upserts `imperialpedia.articles`.

**Empty/Loading/Error states.**
- **Loading:** editor skeleton (title bar + 3 block placeholders); inspector deferred.
- **Not found / no access:** 404 page for unknown slug; 403 "You don't have access to this item" for
  out-of-scope (do not leak existence beyond role).
- **Error (autosave):** silent retry with backoff; persistent failure shows "Changes not saved — retry"
  and disables destructive workflow actions until a save succeeds.
- **Conflict:** if another editor saved a newer revision, `ConflictBanner` offers "Reload" or "View diff".

**Key edge cases.** Submit/publish run server-side validation gates (SEO minimums, required blocks, featured
image for article/news/encyclopedia) and **hard-block** on failure with a checklist. Legal-sensitive items
(formula or advice language) auto-route through Legal Review. Scheduling sets `scheduled_at` and registers a
BullMQ job; unpublish/archive cancels it. Navigating away with unsaved blocks triggers `UnsavedChangesGuard`.

---

## Articles management

**Purpose.** Type-scoped working view for `content_type='article'` — the highest-volume editorial type.
Adds article-specific columns (reading time, featured-image presence, disclosures count, dek) and quick
filters (needs-image, missing-SEO, stale) on top of the All Content machinery.

**Route.** `/admin/content?type=article` (canonical filtered view; an Articles tab links here). No new
route is invented — the All Content list with the `article` type filter is the surface.

**Components.** Reuses `ContentTable` with an article column preset (`ReadingTimeCell`, `FeaturedImageCell`,
`DisclosuresCell`), `ArticleQuickFilters` (Needs featured image, SEO < 70, Not updated in 90d),
`BulkActionBar`. New action: `[+ New Article]` deep-links `/admin/content/new?type=article`.

**Permissions required.** Same as All Content + Create/Edit for articles: `content:read` (scoped),
`content:create`/`content:edit.own`/`content:edit.any`. Publish gated to `content:publish`
(Managing Editor / Admin / Super Admin). Authors create+submit; Editors review+approve within **S**.

**API endpoints used.**
- `GET /v1/content?type=article&…` (filtered list).
- `POST /v1/content` with `contentType=article` (create).
- Bulk + transition as in All Content / Edit.

**Database tables affected.** Read/write `cms.cms_contents` (`content_type='article'`),
`cms.cms_content_revisions`, `cms.cms_media_references`; projection `imperialpedia.articles` on publish;
`cms.cms_categories`/`cms.cms_tags` for taxonomy.

**Empty/Loading/Error states.** Empty → "No articles yet" + `[+ New Article]`. Quick-filter with zero
results → inline "No articles match" + clear. Loading/Error inherit the All Content list behaviors.

**Key edge cases.** Article publish requires featured image (validation gate B.6 in
[../02-content-cms.md](../02-content-cms.md)). `disclosures[]` surfaced so compliance items aren't published
without required disclaimers.

---

## Encyclopedia management

**Purpose.** Type-scoped view for `content_type='encyclopedia'` — long-lived authoritative reference pages
with infobox, aliases, see-also graph, and an `authorityLevel` (stub/standard/authoritative). Encyclopedia
items always carry the **Legal Review** gate in their workflow profile.

**Route.** `/admin/content?type=encyclopedia` (filtered All Content view).

**Components.** `ContentTable` encyclopedia preset (`AuthorityLevelCell`, `AliasesCell`,
`ReferencesCountCell`, `LegalGateCell`), `EncyclopediaQuickFilters` (Stubs, Missing references, Pending
legal), `[+ New Encyclopedia]`. Infobox/see-also editing happens in the block editor (see 13) +
inspector custom-fields form.

**Permissions required.** `content:read` (scoped) to view; `content:create`/`content:edit.*` to author.
**Legal Reviewer** (`content:legal_review`) is required to clear the legal gate before publish; Managing
Editor/Admin hold `content:publish`. Knowledge-structure edits (`knowledge:edit`, `references:manage`) apply
to infobox/references for editors with those grants.

**API endpoints used.**
- `GET /v1/content?type=encyclopedia`, `POST /v1/content` (`contentType=encyclopedia`).
- `POST /v1/content/:id/transition` including `legal` routing; `…/workflow/log` for the legal audit trail.
- References resolve against `imperialpedia.references` (cross-ref [07-knowledge-graph.md](./07-knowledge-graph.md)).

**Database tables affected.** `cms.cms_contents` (`content_type='encyclopedia'`, `custom_fields.infobox/
aliases/seeAlso/authorityLevel`), `cms.cms_content_revisions`, `cms.cms_workflows`/`cms.cms_approval_logs`
(legal gate), `imperialpedia.references`/`imperialpedia.term_references` (citations), projection
`imperialpedia.articles` on publish.

**Empty/Loading/Error states.** Empty → "No encyclopedia pages yet". Missing-references quick filter helps
clear the validation gate "every reference block must resolve". Legal-pending filter is the Legal Reviewer's
focused work queue mirror.

**Key edge cases.** `seeAlso[]` are UUIDs that must resolve to existing items (dangling-link guard). Publish
is hard-blocked until both SEO and Legal gates pass. `authorityLevel='authoritative'` may require manager
sign-off (policy via rbac-service ABAC).

---

## Glossary Terms (editorial CRUD)

**Purpose.** Manage the structured **financial terms** that power tooltips, autocomplete, schema markup, and
the related-terms graph. The structured term lives in `imperialpedia.glossary_terms` (+ examples, relations,
references); its optional long-form explainer is a `content_type='financial_term'` CMS page linked 1:1 via
`cms_content_id`. This page is the **editorial CRUD** surface; deeper knowledge-graph operations are in
[07-knowledge-graph.md](./07-knowledge-graph.md), and `/admin/glossary` is the dedicated console.

**Route.** `/admin/glossary` (primary). The All Content list also exposes `?type=financial_term` for the
linked essays; the two are kept in sync (publishing the term can prompt linking/creating the essay).

**Components.** `GlossaryToolbar` (`[+ New Term]`, Import CSV, Merge aliases), `GlossaryFilterBar`
(Difficulty, Status, Category, search), `GlossaryTable`/`GlossaryGrid` (Term, difficulty chip, status,
view_count, linked-essay indicator), `TermEditorDrawer` (structured fields: term, slug, short_def, full_def,
formula_latex, aliases, difficulty, category), `ExamplesEditor` (`glossary_examples`), `RelatedTermsPicker`
(`glossary_relations` typed graph), `ReferencesPicker` (`references`/`term_references`), `TooltipPreview`,
`AiAssist` (suggestions only).

**Permissions required.**
- `glossary:edit` to create/edit a term; `glossary:publish` to publish (`draft→review→published`).
  Roles: Editor (within S), Managing Editor, Admin, Super Admin edit/publish; Author/Contributor may draft
  terms but cannot publish. SEO Manager can adjust term slugs/SEO via `seo:metadata`.
- A term shipping a formula or advice-sensitive definition routes through **Legal Review**
  (`content:legal_review`) before publish.
- `references:manage` for editing the shared citation store.

**API endpoints used.** (imperialpedia-service, proxied under `/v1/glossary`)
- `GET /v1/glossary/terms?difficulty&status&category&q&page&limit` — list.
- `POST /v1/glossary/terms`, `GET /v1/glossary/terms/:id`, `PATCH /v1/glossary/terms/:id`,
  `DELETE /v1/glossary/terms/:id`.
- `POST /v1/glossary/terms/:id/examples`, `PUT …/relations`, `PUT …/references`.
- `POST /v1/glossary/terms/:id/transition` (draft→review→published→archived).
- `POST /v1/glossary/terms/:id/link-content` — associate the 1:1 `financial_term` CMS essay.

**Database tables affected.** `imperialpedia.glossary_terms`, `imperialpedia.glossary_examples`,
`imperialpedia.glossary_relations`, `imperialpedia.references`, `imperialpedia.term_references`; linked
essay in `cms.cms_contents` (`content_type='financial_term'`, `custom_fields.glossaryTermId`).

**Empty/Loading/Error states.** Empty → "No terms yet" + `[+ New Term]` + Import CSV. Slug collision on
create → 409 with suggestion. Merge-aliases preview shows which term absorbs which before committing
(irreversible-action confirm). Loading → grid skeletons; tooltip preview lazy.

**Key edge cases.** `aliases` feed OpenSearch synonyms and the internal-linking dictionary — editing them
re-indexes. Deleting a term with inbound `glossary_relations` warns and detaches relations. Publishing a
term pushes `term`+`aliases` to auto-linking (max-1-per-term). Difficulty/category drive the public glossary
facets (search-service).

---

## Guides management

**Purpose.** Type-scoped view for `content_type='guide'` — structured, step-based how-tos with level,
estimated minutes, and prerequisites. Standard workflow profile.

**Route.** `/admin/content?type=guide` (filtered All Content view).

**Components.** `ContentTable` guide preset (`LevelCell`, `EstMinutesCell`, `StepsCountCell`,
`PrerequisitesCell`), `GuideQuickFilters` (By level, Missing steps), `[+ New Guide]`. Steps/prerequisites
edited via inspector custom-fields + `callout`/`heading` blocks (see 13).

**Permissions required.** `content:read` (scoped) to view; `content:create`/`content:edit.*` to author;
`content:review` (Editor) → `content:publish` (Managing Editor/Admin) to ship. Standard profile (no legal
gate unless content triggers it).

**API endpoints used.** `GET /v1/content?type=guide`, `POST /v1/content` (`contentType=guide`),
bulk + transition as standard.

**Database tables affected.** `cms.cms_contents` (`content_type='guide'`, `custom_fields.steps/level/
estMinutes/prerequisites`), `cms.cms_content_revisions`, projection `imperialpedia.articles` on publish.

**Empty/Loading/Error states.** Empty → "No guides yet". Missing-steps filter surfaces guides that fail the
"≥1 heading + structured steps" gate. Inherits list loading/error behaviors.

**Key edge cases.** `prerequisites[]` are UUIDs that must resolve (dangling guard). `estMinutes` bounded
(1–600). Level drives public difficulty facet.

---

## Tutorials management

**Purpose.** Type-scoped view for `content_type='tutorial'` — outcome-driven, often code-bearing learning
content with level, outcomes, and code language. Standard workflow profile; first-class `code` blocks.

**Route.** `/admin/content?type=tutorial` (filtered All Content view).

**Components.** `ContentTable` tutorial preset (`LevelCell`, `OutcomesCell`, `CodeLangCell`,
`InteractiveCell`), `TutorialQuickFilters` (By level, By language, Has interactive), `[+ New Tutorial]`.
Code blocks (Shiki) and callouts edited in the block editor (see 13).

**Permissions required.** Same as Guides: `content:read` (scoped), `content:create`/`content:edit.*`,
`content:review`→`content:publish`. `ai:use` optional for AI-assisted outcome drafting (suggestions only).

**API endpoints used.** `GET /v1/content?type=tutorial`, `POST /v1/content` (`contentType=tutorial`),
bulk + transition as standard.

**Database tables affected.** `cms.cms_contents` (`content_type='tutorial'`, `custom_fields.level/outcomes/
codeLang/interactive`), `cms.cms_content_revisions`, projection `imperialpedia.articles` on publish.

**Empty/Loading/Error states.** Empty → "No tutorials yet". `outcomes` requires ≥1 (validation) — quick
filter flags tutorials missing outcomes. Inherits list behaviors.

**Key edge cases.** `code` blocks must specify a valid `lang`; interactive tutorials may embed sandboxed
finmath/calculator widgets wired to imperialpedia calculator endpoints (cross-ref 13 §finmath).

---

## News management

**Purpose.** Type-scoped view for `content_type='news'` — time-sensitive items on the **Fast-track**
workflow (Author → Editor → Publish), with source URL, embargo time, wire flag, and ticker tags. Optimized
for speed: embargo-aware scheduling and a tight review loop.

**Route.** `/admin/content?type=news` (filtered All Content view).

**Components.** `ContentTable` news preset (`EmbargoCell`, `WireBadge`, `TickersCell`, `SourceLinkCell`),
`NewsQuickFilters` (Embargoed, Due today, From wire), `[+ New News]`, `EmbargoScheduler`. Fast-track action
rail surfaces Submit → Approve → Publish prominently.

**Permissions required.** `content:read` (scoped) to view; `content:create`/`content:edit.own` (Author),
`content:review` (Editor), `content:publish`/`content:schedule` (Managing Editor/Admin/Super Admin).
Fast-track skips SEO/Legal gates by default but inherits them if content triggers (e.g., advice language).

**API endpoints used.** `GET /v1/content?type=news`, `POST /v1/content` (`contentType=news`),
`POST /v1/content/:id/transition` (`schedule` for embargo, `publish`), bulk as standard.

**Database tables affected.** `cms.cms_contents` (`content_type='news'`, `custom_fields.sourceUrl/embargoAt/
wire/tickers`, `scheduled_at`), `cms.cms_content_revisions`, `cms.cms_workflows` (schedule job), projection
`imperialpedia.articles` on publish.

**Empty/Loading/Error states.** Empty → "No news yet". Embargoed items show a lock + release time; publishing
before `embargoAt` is blocked with "Embargoed until …". Due-today filter is the desk's worklist.

**Key edge cases.** `embargoAt` in the future forces a scheduled publish (BullMQ job). `tickers[]` validated
against `^[A-Z.:-]{1,12}$`. `sourceUrl` must be a valid URL. Wire items may carry an attribution requirement.

---

## FAQs management

**Purpose.** Type-scoped view for `content_type='faq'` — Q/A collections that emit `FAQPage` schema. Standard
workflow profile; structured Q/A pairs instead of free prose blocks.

**Route.** `/admin/content?type=faq` (filtered All Content view).

**Components.** `ContentTable` FAQ preset (`QuestionsCountCell`, `SchemaFaqBadge`), `FaqQuickFilters`
(Few questions, Schema-enabled), `[+ New FAQ]`, `QaPairEditor` (add/reorder Q/A pairs in the inspector).

**Permissions required.** `content:read` (scoped), `content:create`/`content:edit.*`,
`content:review`→`content:publish`. SEO Manager (`seo:metadata`) curates FAQ schema output.

**API endpoints used.** `GET /v1/content?type=faq`, `POST /v1/content` (`contentType=faq`),
bulk + transition as standard.

**Database tables affected.** `cms.cms_contents` (`content_type='faq'`, `custom_fields.questions[]`),
`cms.cms_content_revisions`, projection `imperialpedia.articles` on publish.

**Empty/Loading/Error states.** Empty → "No FAQs yet". A FAQ requires ≥1 Q/A pair (validation) — create is
blocked otherwise. Inherits list behaviors.

**Key edge cases.** Each question 3–300 chars, answer 1–5000 (validators). Reordering Q/A persists
`sort` within `questions[]`. `schemaFaq:true` controls whether `FAQPage` JSON-LD is emitted.

---

## Trash / Archive

**Purpose.** A recoverable, governed graveyard. Items moved to trash are soft-deleted (recoverable for a
retention window); **archive** is a workflow status (`archived`) for intentionally retired-but-kept content.
This page lets editors restore or permanently purge, separating "retired" (archive) from "removed" (trash).

**Route.** `/admin/content/trash` (new — no existing route fits; the All Content `Status=Archived` filter
covers archive browsing, this page owns trash + purge).

**Components.** `TrashTabs` (Trash | Archive), `TrashTable` (Title, Type, Deleted/Archived by, When, Retention
remaining), `BulkRestoreBar`, `PermanentDeleteDialog` (typed-confirm), `RetentionNotice`, `EmptyState`.

**Permissions required.**
- View trash/archive: `content:read` (scoped); Authors/Contributors see only their own trashed drafts.
- Restore from trash: `content:edit.any` (Editor within S, Managing Editor, Admin) or `content:edit.own`
  for own items; restoring to `draft` uses `content:rollback`/`restore_to_draft`.
- Archive/unarchive: `content:archive`.
- **Permanent delete: `content:delete`** — Admin / Super Admin only (Managing Editor by policy). This is the
  only hard-delete path and is fully audited.

**API endpoints used.**
- `GET /v1/content?status=archived` (archive tab) and `GET /v1/content?deleted=true` (trash tab).
- `POST /v1/content/:id/transition` with `archive` / `restore_to_draft` (un-archive).
- `POST /v1/content/bulk` with `action='delete'` (soft-delete to trash; `bulkUpdateSchema`).
- `DELETE /v1/content/:id?purge=true` — permanent purge (Admin/Super Admin; emits audit + cascades).

**Database tables affected.** `cms.cms_contents` (`status='archived'` or soft-delete flag/`deleted_at`),
cascades on purge to `cms.cms_content_revisions`, `cms.cms_media_references`; `imperialpedia.articles`
projection row removed on archive/purge of a published item. All purges land in `audit-service`
(`baalvion:events` → WORM log).

**Empty/Loading/Error states.** Empty → "Trash is empty" / "Nothing archived". Restore of an item whose slug
was reused → conflict prompt to pick a new slug. Purge requires typed confirmation and is irreversible
(banner warns; double-submit guarded).

**Key edge cases.** Retention window auto-purges trash after N days (policy) — surfaced as "auto-deletes in
X days". Purging a published item triggers CDN purge + search de-index. Legal-hold items cannot be purged
(ABAC obligation from rbac-service).

---

## Bulk operations

**Purpose.** Apply one action across up to **100** selected items (the `bulkUpdateSchema` ceiling) from any
list surface — publish, archive, soft-delete (trash), assign category, add tags, export. Each item is
authorized individually (deny-overrides), so a bulk run never escalates a single item past the caller's
rights; a partial result is reported per item.

**Route.** No standalone route — the `BulkActionBar` overlay on `/admin/content` (and type-scoped lists) and
`/admin/content/trash`. Documented here as a cross-cutting capability.

**Components.** `BulkActionBar` (selection count + action buttons), `BulkCategoryPicker`, `BulkTagPicker`,
`BulkConfirmDialog` (shows count + per-action warning), `BulkResultToast`/`BulkResultDrawer` (succeeded /
skipped-no-permission / failed-validation breakdown).

**Permissions required (per action).**
- Publish: `content:publish` (Managing Editor / Admin / Super Admin).
- Archive: `content:archive` (Editor within S, Managing Editor, Admin).
- Move to trash (`delete` action = soft): `content:edit.any`/`content:edit.own`; hard purge is **not** a bulk
  action (single-item, Admin only).
- Assign category: `taxonomy:manage` or `content:edit.any` within S.
- Add tags: `taxonomy:manage` / `content:edit.*`.
- Export: `content:read`.

**API endpoints used.**
- `POST /v1/content/bulk` (`bulkUpdateSchema`: `{ ids[≤100], action: publish|archive|delete|assign_category,
  categoryId? }`) → `POST /cms/websites/:websiteId/content/bulk`.
- Add-tags bulk uses `PATCH /v1/content/:id` fan-out server-side (BFF), or a dedicated
  `POST /v1/content/bulk-tags` where supported.

**Database tables affected.** `cms.cms_contents` (status/category/tag_ids updates), `cms.cms_content_revisions`
(snapshots), `cms.cms_workflows`/`cms.cms_approval_logs` (publish/archive transitions), `imperialpedia.articles`
(projection on bulk publish), `audit-service` (one audit event per affected item).

**Empty/Loading/Error states.** No selection → bar hidden. In-flight → progress with per-item status; the run
is resumable/idempotent on retry. **Partial failure is the norm** — the result drawer lists which ids were
skipped (no permission), which failed validation (e.g., publish blocked by missing SEO/featured image), and
which succeeded.

**Key edge cases.** Selecting "all 1,204" via header checkbox selects the **current filter**, not literally
all rows; bulk then chunks into ≤100 batches server-side. Publish in bulk re-runs each item's validation
gates and skips those that fail rather than aborting the batch. Mixed-type selections are allowed; type-
specific gates apply per item.

---

## Import / Export

**Purpose.** Move content in and out at scale — migrate from legacy/WordPress/Markdown, seed glossary terms
from CSV, and export for backup, translation hand-off, or audit. Imports are staged, validated, and
previewed before commit; exports are scoped by the active filter and authorized read set.

**Route.** `/admin/content/import` and `/admin/content/export` (the All Content `[⤓ Import]` / `[⤒ Export]`
buttons deep-link here). If a single route is preferred, `/admin/content/import-export` with tabs.

**Components.**
- Import: `ImportSourcePicker` (CSV, Markdown/zip, WordPress XML, JSON), `FileDropzone`, `FieldMappingTable`
  (source column → cms field / custom_field), `ImportPreview` (first N rows + validation errors),
  `ImportRunPanel` (progress, per-row result), `ImportSummary`.
- Export: `ExportScopePicker` (current filter / selected ids / all-in-type), `ExportFormatPicker`
  (JSON, CSV, Markdown zip), `FieldSelector`, `ExportRunPanel`, `DownloadLink`.

**Permissions required.**
- Import: `content:create` (rows land as `draft`, never auto-published) + `taxonomy:manage` if creating
  categories/tags. Roles: Editor (within S) / Managing Editor / Admin / Super Admin. Glossary CSV import
  needs `glossary:edit`. Bulk import that would publish requires `content:publish` (otherwise import is
  draft-only).
- Export: `content:read` (scoped to the caller's visible set — exports never include rows the caller can't
  read). `analytics:revenue`/sensitive fields excluded unless the role grants them.

**API endpoints used.**
- `POST /v1/content/import` (multipart) — stage + validate; returns a `jobId` + dry-run report.
- `POST /v1/content/import/:jobId/commit` — commit validated rows (creates drafts).
- `GET /v1/content/import/:jobId` — job status/result.
- `POST /v1/content/export` — start export (scope + format); `GET /v1/content/export/:jobId` — poll +
  signed download URL.
- `GET /v1/glossary/terms/import-template` / `POST /v1/glossary/terms/import` for glossary CSV.

**Database tables affected.** Insert into `cms.cms_contents` (drafts) + `cms.cms_content_revisions` on
import commit; `cms.cms_categories`/`cms.cms_tags` if creating taxonomy; `imperialpedia.glossary_terms`
(+examples/relations/references) for glossary import. Export reads `cms.cms_contents` and joins taxonomy;
no editorial writes. Import/export jobs tracked in a BFF job store; all commits emit `audit-service` events.

**Empty/Loading/Error states.**
- **Import dry-run with errors:** per-row error table (bad slug, missing required field, unresolved
  category) — commit is disabled until errors are resolved or rows excluded.
- **Import in progress:** progress bar + cancel; partial commits are transactional per batch.
- **Export building:** spinner → "Preparing export"; large exports run async and notify on completion
  (notification-service) with a time-limited signed URL.
- **Error:** malformed file → "Couldn't parse file" with the detected format mismatch.

**Key edge cases.** Imports are **always draft-first** (no silent publish). Slug collisions auto-suffix or
flag per the mapping config. HTML/Markdown is sanitized to the block allowlist on import (no stored-XSS).
Large files stream/chunk; the importer caps rows per job. Exports respect row-level read scope and strip
internal-only fields by role.

---

## Cross-references

- **Block editor & palette:** [13-content-editor-blocks.md](./13-content-editor-blocks.md).
- **Workflow state machine, queues, legal/SEO gates:** [04-rbac-and-workflow.md](./04-rbac-and-workflow.md).
- **Knowledge graph, references, entities, glossary relations depth:** [07-knowledge-graph.md](./07-knowledge-graph.md).
- **Taxonomy, categories & tags admin:** see Categories/Tags pages and [../02-content-cms.md](../02-content-cms.md) §B.2.
- **SEO scoring, media library, redirects:** [../03-seo-and-media.md](../03-seo-and-media.md).
- **Store reconciliation & schema/validation:** [../02-content-cms.md](../02-content-cms.md).
