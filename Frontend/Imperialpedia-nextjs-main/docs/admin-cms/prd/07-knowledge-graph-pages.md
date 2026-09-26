# 07 — Knowledge Graph (Structured Knowledge Layer)

> **Section purpose.** The Knowledge Graph is Imperialpedia's structured, machine-readable knowledge layer — the
> dimension that turns a pile of editorial pages into an encyclopedia. It is **distinct from editorial Content**
> (block-based essays in `cms.cms_contents`, specified in [03-content-pages](./03-content-pages.md) and
> [02-content-cms](../02-content-cms.md)): where Content owns the long-form prose, the Knowledge Graph owns the
> *structured term* (definition, formula, difficulty, aliases), the *typed relationships* between terms, the
> *curated category tree* that organizes everything, the *shared CSL-JSON reference store* that both glossary and
> article citation blocks draw from, and the *entities* (companies, countries, industries, technologies) that
> pages attach to. These records power tooltips, schema.org markup, autocomplete, the related-terms graph, and
> internal auto-linking ([03-seo-and-media §A.7](../03-seo-and-media.md#a7-internal-linking-system)). This document
> specifies one admin page per H2. Roles use the canonical ladder `viewer < member < editor < manager < admin <
> owner < super_admin`; capability strings are the canonical vocabulary; tables are schema-qualified
> (`imperialpedia.*` for knowledge, `cms.*` for taxonomy that reuses the CMS tree).

---

## Terms — Glossary Term Editor

**Purpose.** Structured editor for `imperialpedia.glossary_terms`: the Investopedia-style record (term, short
definition for tooltips, full definition, canonical formula, aliases, difficulty, examples, references) that is
**1:1 linked** to an optional long-form CMS essay (`content_type='financial_term'`). This page edits the
*structured term*; the *essay* is edited in the block editor ([03-content-pages](./03-content-pages.md)). Keeping
them separate keeps the term machine-readable (tooltips, `DefinedTerm` JSON-LD, search synonyms, auto-linking)
while the essay flows through the full editorial pipeline.

**Route.** `/admin/glossary` (list) and `/admin/glossary/new`, `/admin/glossary/[slug]` (editor). Knowledge-graph
nav surfaces these under "Terms"; the canonical scaffolded routes are reused (do not duplicate under
`/admin/knowledge/terms` — that path is an alias that redirects to `/admin/glossary`).

**Components.**
- `GlossaryTermList` — table/grid toggle, difficulty + status chips, `view_count` sparkline, "has essay" badge.
- `GlossaryFilters` — difficulty, status, category, "missing formula/examples/references" data-quality filters.
- `TermEditorForm` — left column: `term`, `slug` (auto from term, edit-locked after publish → 301), `aliases[]`
  chip input, `short_def` (≤320 char counter), `full_def` (lightweight prose), `difficulty` select,
  `category` select, `pronunciation`.
- `FormulaField` — `formula_latex` input with live KaTeX preview + parse validation.
- `ExamplesRepeater` — ordered `glossary_examples[]` (title, body with `$math$`, drag-reorder `sort_order`).
- `EssayLinkPanel` — link/unlink/create the 1:1 `cms_content_id` financial-term essay; deep-links to block editor.
- `RelatedTermsMiniPicker` — quick add of relations (full editor on the Relationships page).
- `ReferencePicker` — attach rows from the shared reference store (see References page) via `term_references`.
- `TooltipPreview` + `PagePreview` — live hover-card and public page render.
- `AiAssist` — "draft definition / suggest related terms / generate example" (suggestions only, never auto-write).
- `WorkflowBar` — `draft → review → published` with conditional Legal Review routing.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Glossary   P/E Ratio                          ◌ Draft   Autosaved 14:32   [Submit ▸] [⋯] │
│ ┌───────────────────────────────────────────────────┬──────────────────────────────────┐ │
│ │ Term      Price-to-Earnings Ratio                 │  LIVE TOOLTIP                      │ │
│ │ Slug      price-to-earnings-ratio        [locked] │  ┌──────────────────────────────┐ │ │
│ │ Aliases   [P/E] [PE ratio] [+]                    │  │ P/E Ratio        ● beginner  │ │ │
│ │ Short def A valuation ratio comparing share…  248 │  │ A valuation ratio comparing… │ │ │
│ │ Full def  ┌───────────────────────────────────┐   │  │ Read full definition →       │ │ │
│ │           │ The price-to-earnings ratio…      │   │  └──────────────────────────────┘ │ │
│ │           └───────────────────────────────────┘   │  DATA QUALITY                      │ │
│ │ Formula   P/E = \frac{Price}{EPS}     ✓ valid     │  ✓ short_def  ✓ formula           │ │
│ │ Difficulty [● beginner ▾]   Category [Valuation ▾]│  ⚠ 0 examples   ✓ 3 references    │ │
│ │ Examples  ⠿ 1. AAPL at $190 / EPS $6.1 …  [+ add] │  ⚠ no related terms               │ │
│ │ Essay     ⛓ Linked: "Understanding the P/E…" [↗]  │  ESSAY  ● Published  SEO 92       │ │
│ │ References [#12 Damodaran] [#41 SEC 10-K] [+ add] │  [Related terms ↗] [Legal flag]   │ │
│ └───────────────────────────────────────────────────┴──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Permissions required.**
- View list/editor: `content:read` + `glossary:edit` — Editor (within assigned category scope **S**),
  SEO Manager, Legal Reviewer (read-only), Managing Editor, Admin, Owner, Super Admin. Author/Contributor with
  `content:create` may **create + edit OWN draft terms** (`content:edit.own`) but cannot edit others'.
- Create/edit term: `glossary:edit` — Author/Contributor (own, draft only), Editor (scope **S**), Managing
  Editor, Admin.
- Submit for review: `content:submit` — Author, Contributor, Editor.
- Publish term: `glossary:publish` (gated by `content:review` for the approving step) — Editor (scope **S**),
  Managing Editor, Admin, Owner. Authors/Contributors **never** publish.
- Legal flag/approve on sensitive terms: `content:legal_review` — Legal Reviewer (narrow), Admin, Super Admin.
- Delete/archive: `content:archive` / `content:delete` — Managing Editor, Admin, Owner (Super Admin bypass).
- All writes are RS256-authed and authorized via `rbac-service /v1/authorize` (deny-overrides); category scope is
  resolved as an ABAC obligation, not in the UI.

**API endpoints used.**
- `GET /v1/glossary?search=&difficulty=&status=&category=&page=&limit=` — list (paginated envelope).
- `GET /v1/glossary/:id` — full structured term (examples + relations + references hydrated).
- `POST /v1/glossary` — create; `PATCH /v1/glossary/:id` — update; `DELETE /v1/glossary/:id` — archive/delete.
- `POST /v1/glossary/:id/submit` · `POST /v1/glossary/:id/publish` · `POST /v1/glossary/:id/legal-flag`.
- `GET /v1/glossary/:slug/tooltip` — public hover-card payload (also used in preview).
- `POST /v1/glossary/:id/examples` · `PATCH/DELETE /v1/glossary/:id/examples/:exId`.
- `POST /v1/glossary/:id/references` (attach) · `DELETE /v1/glossary/:id/references/:refId`.
- `POST /v1/ai/glossary/suggest` — AI definition/example/related suggestions (`ai:use`).
- Essay link: `POST /v1/content` (create `financial_term`) / `GET /v1/content/:id` via cms-service BFF.

**Database tables affected.**
- `imperialpedia.glossary_terms` (read/write), `imperialpedia.glossary_examples` (read/write),
  `imperialpedia.term_references` (link rows), `imperialpedia.glossary_relations` (read for quick-add),
  `imperialpedia.references` (read via picker). `cms.cms_contents` (read/link the 1:1 essay, `cms_content_id`).
  Audit rows land in `audit` schema via `baalvion:events` (`knowledge.glossary.published`).

**Empty / Loading / Error states.**
- Empty list: "No terms yet — create the first glossary term" CTA; difficulty filter empties show a reset hint.
- Loading: skeleton rows (list) / skeleton form sections (editor); tooltip preview shows a shimmer.
- Error: 403 → "You can edit terms only in your assigned categories"; 409 slug conflict → inline "slug already
  used by '<term>'"; invalid LaTeX → red `FormulaField` border, blocks save of that field only.

**Edge cases.** Slug is immutable after first publish (auto-301 on change via SEO redirects). Deleting a term that
is the target of relations cascades the relation rows (`ON DELETE CASCADE`) — the editor warns with the inbound
count. A term whose definition is legal-sensitive (mentions returns/guarantees, or category ∈ regulated set) is
**force-routed through Legal Review** before publish. Unlinking an essay does not delete the CMS content.

---

## Relationships — Typed Knowledge Graph Editor

**Purpose.** Manage the directed, typed graph over `imperialpedia.glossary_relations`: `related`, `prerequisite`,
`contrast`, `broader`, `narrower`. This graph powers "See also", learning-path prerequisites, contrast pairs, and
the broader/narrower hierarchy used for breadcrumbs and topic clustering. The page provides both a focused
per-term relation editor and a whole-graph visualization for curation, gap-finding, and cycle detection.

**Route.** `/admin/knowledge/relationships` (invented — no scaffolded route fits a graph editor; closest siblings
are `/admin/glossary` and `/admin/categories`, neither of which is a relation surface).

**Components.**
- `GraphCanvas` — force-directed visualization (nodes = terms colored by difficulty, edges colored by relation
  type, directional arrows for `prerequisite`/`broader`/`narrower`). Pan/zoom, focus-on-node, filter by type.
- `TermRelationPanel` — pick a focus term → list of outgoing relations grouped by type; add/remove/retype.
- `RelationTypePicker` — the 5 relation enums with semantic hints (e.g. "prerequisite = learn first").
- `RelationSuggestions` — AI-proposed edges (`ai:use`) from co-citation/co-read + embedding similarity; accept/reject.
- `CycleWarning` — flags illegal cycles in `prerequisite`/`broader`/`narrower` (these must stay acyclic).
- `OrphanFinder` — terms with zero relations (graph-quality KPI); "no prerequisites / no see-also" lists.
- `InverseHint` — adding `A broader B` offers to auto-add the inverse `B narrower A`.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Knowledge Relationships     Focus: P/E Ratio ▾    Type ▾  [Acyclic ✓]   [+ Suggest edges] │
│ ┌──────────────────────────────────────────────┬───────────────────────────────────────┐ │
│ │           ( Valuation )                       │ RELATIONS · P/E Ratio                 │ │
│ │              ▲ broader                         │  prerequisite → EPS            [✕]    │ │
│ │   ( EPS )──prereq──▶( P/E Ratio )──contrast──▶ │  prerequisite → Stock Price    [✕]    │ │
│ │                          │ related            ( │  related      → Earnings Yield [✕]    │ │
│ │                          ▼                      │  contrast     → P/B Ratio      [✕]    │ │
│ │                    ( PEG Ratio )                │  broader      → Valuation      [✕]    │ │
│ │   ⚠ cycle: A→B→A blocked                        │  + add relation  [type ▾][term ▾][+] │ │
│ └──────────────────────────────────────────────┴───────────────────────────────────────┘ │
│ Orphans (0 relations): 14   ·   Missing prerequisites: 38   ·   [Export graph]            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Permissions required.**
- View graph: `content:read` + `glossary:edit` — Editor (scope **S**), SEO Manager (read; uses for linking),
  Managing Editor, Admin, Owner, Super Admin. Authors/Contributors: read-only of relations on their own terms.
- Add/remove/retype edges: `glossary:edit` + `knowledge:edit` — Editor (scope **S**), Managing Editor, Admin.
- Bulk apply AI suggestions: `glossary:edit` + `ai:use` — Editor (scope **S**), Managing Editor, Admin.
- Authorized per edge via `rbac-service`; scope checks apply to **both** endpoints of an edge (an Editor may only
  create an edge where at least the focus term is in scope).

**API endpoints used.**
- `GET /v1/glossary/:id/relations` — outgoing relations for a term.
- `POST /v1/glossary/:id/relations` `{ relatedId, relation }` — add edge (+ optional inverse).
- `DELETE /v1/glossary/:id/relations/:relatedId?relation=` — remove a specific typed edge.
- `GET /v1/glossary/graph?root=&depth=&type=` — subgraph for visualization (read BFF, cached).
- `POST /v1/ai/glossary/:id/suggest-relations` — suggested edges.

**Database tables affected.**
- `imperialpedia.glossary_relations` (read/write; composite PK `term_id, related_id, relation`).
- `imperialpedia.glossary_terms` (read for node labels/difficulty). Events: `knowledge.relation.changed`.

**Empty / Loading / Error states.**
- Empty: focus term with no edges shows "No relationships yet" + suggestion CTA; whole-graph empty → onboarding.
- Loading: canvas shows a centered spinner; relation panel skeletons; large graphs stream nodes progressively.
- Error: cycle attempt → toast "This would create a prerequisite cycle (P/E → EPS → P/E)"; duplicate edge → 409
  "relation already exists"; 403 on out-of-scope target term.

**Edge cases.** `prerequisite`, `broader`, `narrower` must remain **acyclic** — server rejects cycles; `related`
and `contrast` are symmetric and may form loops. Deleting a term cascades its edges (both directions). Inverse
auto-creation is opt-in per edge to avoid surprise writes. Graph queries are depth-capped (default 2) to protect
the read path at 100M-user scale.

---

## Categories — Curated Category Tree & Hubs

**Purpose.** Manage the **curated, hierarchical category tree** (`cms.cms_categories`) that organizes all editorial
content and glossary terms (e.g. Investing → Stocks → Valuation). Categories are not free tags — they are a
governed taxonomy (max depth 4), each mapping to a **public hub page** (`hub_content_id`), an explicit display
`sort_order`, an `icon`, and breadcrumb + `BreadcrumbList` schema. This is the single tree shared by Content and
Knowledge Graph; tags (flat, moderated) live at `/admin/tags` ([02-content-cms §B.2](../02-content-cms.md)).

**Route.** `/admin/categories` (scaffolded; reused). The alias `/admin/knowledge/categories` redirects here.

**Components.**
- `CategoryTree` — drag-to-reorder + drag-to-reparent nested tree; depth guard at 4; collapse/expand.
- `CategoryRow` — name, slug, content count, hub-page status chip, icon, `sort_order` handle.
- `CategoryEditorDialog` — name, slug (auto, redirect-on-change), `parent_id`, `description`, `icon` picker.
- `HubPageLinker` — link/create the `hub_content_id` (a `page`/`encyclopedia` CMS content) for the hub landing.
- `OrderingControls` — manual `sort_order` within a parent (drag handle + numeric).
- `BreadcrumbPreview` — live breadcrumb + JSON-LD `BreadcrumbList` for the selected node.
- `MergeMoveTool` — merge a category into another (reassigns content `category_id`) / move subtree.
- `CategoryUsagePanel` — counts of content + glossary terms under the node (delete-safety).

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Categories (curated tree · max depth 4)        🔎 search…        [+ Category]   1,204 docs │
│ ┌────────────────────────────────────────────────────┬───────────────────────────────────┐│
│ │ ⠿ ▸ Investing                       312   ⛳ hub ✓  │ EDIT · Valuation                  ││
│ │     ⠿ ▾ Stocks                      188   ⛳ hub ✓  │  Name      Valuation              ││
│ │         ⠿ • Valuation               41    ⛳ hub —  │  Slug      valuation     [→301]   ││
│ │         ⠿ • Dividends               33    ⛳ hub ✓  │  Parent    Stocks ▾               ││
│ │     ⠿ ▸ ETFs                        64    ⛳ hub ✓  │  Icon      [📊 ▾]   Order [3]     ││
│ │ ⠿ ▸ Economy                         140   ⛳ hub ✓  │  Hub page  — none —     [Create]  ││
│ │ ⠿ ▸ Crypto                          96    ⛳ hub ✓  │  Breadcrumb Investing › Stocks ›  ││
│ │   ⚠ depth limit reached on this branch             │            Valuation             ││
│ │ ── Bulk: [Reorder] [Move] [Merge] ──               │  [Save]  [Merge into…] [Delete]  ││
│ └────────────────────────────────────────────────────┴───────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Permissions required.**
- View tree: `content:read` — Editor (scope **S**, sees own categories), SEO Manager, Managing Editor, Admin,
  Owner, Super Admin. Authors/Contributors: read-only (to pick a category when authoring).
- Create/edit/reorder/reparent: `taxonomy:manage` — Editor (scope **S** — may reorder/edit within assigned
  categories only), Managing Editor, Admin, Owner. Authors/Contributors: **none**.
- Merge / move subtree / delete: `taxonomy:manage` + `content:archive` — Managing Editor, Admin, Owner
  (Super Admin bypass). Delete blocked while content/terms reference the node unless merge-reassign is chosen.
- Link/create hub page: `taxonomy:manage` + `content:create` — Managing Editor, Admin.
- Authorized via `rbac-service`; the scope obligation (`category set`) filters which subtree an Editor can mutate.

**API endpoints used.**
- `GET /v1/categories?tree=true` — full nested tree with counts (cached, read BFF).
- `POST /v1/categories` · `PATCH /v1/categories/:id` · `DELETE /v1/categories/:id?reassignTo=`.
- `POST /v1/categories/reorder` `{ parentId, orderedIds[] }` — persist `sort_order`.
- `POST /v1/categories/:id/move` `{ newParentId }` — reparent (depth-validated server-side).
- `POST /v1/categories/:id/merge` `{ targetId }` — merge + reassign content.
- `POST /v1/categories/:id/hub` `{ contentId }` — link hub page. Served by cms-service (taxonomy lives in `cms`).

**Database tables affected.**
- `cms.cms_categories` (read/write; `parent_id`, `hub_content_id`, `sort_order`, `icon`).
- `cms.cms_contents` (read for counts; `category_id` reassigned on merge; `hub_content_id` target).
  Slug changes write `cms.cms_seo_redirects` (auto-301). Events: `taxonomy.category.changed`.

**Empty / Loading / Error states.**
- Empty: seed CTA "Create your top-level categories (Investing, Economy, Crypto…)".
- Loading: tree skeleton; counts load lazily (don't block the tree render).
- Error: depth-4 reparent → blocked toast "Max category depth is 4"; delete-with-children → "Move or merge
  children first"; delete-with-content → forces `reassignTo`; 403 out-of-scope edit.

**Edge cases.** Reparenting recomputes the breadcrumb + emits 301s for descendant slugs if slug paths change.
A category cannot be its own ancestor (cycle guard). Merge is irreversible — confirm dialog shows the count of
content + terms that will be reassigned. Hub page must be `published` for the public hub to render.

---

## References — Shared CSL-JSON Reference & Citation Store

**Purpose.** The single source of truth for citations: `imperialpedia.references` holds structured **CSL-JSON**
records (web, book, journal, filing, dataset) that are reused by **both** glossary terms (`term_references`) and
article `reference`/`citation` blocks ([02-content-cms §D.6](../02-content-cms.md)). One reference, cited many
places — edit it once and every citing page updates. This page is the librarian surface: create, dedupe, validate,
and audit references; it renders formatted previews (APA/MLA/Chicago) and exports BibTeX.

**Route.** `/admin/knowledge/references` (invented — no scaffolded route covers a citation library; it is neither
`/admin/media` nor `/admin/glossary`).

**Components.**
- `ReferenceList` — table of references with `kind` badge, formatted short cite, usage count, "broken URL" flag.
- `ReferenceEditor` — CSL-JSON-backed form (type, author(s), title, container, year, DOI/ISBN, `url`,
  `accessed_at`); raw CSL-JSON toggle for power users.
- `CiteStylePreview` — live APA / MLA / Chicago rendering + BibTeX export of the current record.
- `DoiUrlImporter` — paste a DOI/URL → fetch + prefill CSL-JSON (`references:manage` + `ai:use`/lookup service).
- `DuplicateDetector` — fuzzy match on title+author+year → merge duplicates (rewrites `term_references` +
  citing block `refId`s).
- `UsagePanel` — where this reference is cited (glossary terms + CMS content blocks); blocks unsafe delete.
- `LinkRotChecker` — async crawl status of `url` (last checked, HTTP status) feeding a "broken references" view.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ References (CSL-JSON library)   Kind ▾   🔎 title/author/DOI…   [Import DOI] [+ Reference] │
│ ┌────────────────────────────────────────────────────┬───────────────────────────────────┐│
│ │ #  Citation                         Kind   Used  ⚠ │ EDIT · #12                         ││
│ │ 12 Damodaran, A. (2012). Investment journal  31    │  Type     book ▾                  ││
│ │ 41 U.S. SEC. Form 10-K (2023)       filing  18     │  Author   Damodaran, Aswath       ││
│ │ 07 BLS. CPI dataset (2024)          dataset  9     │  Title    Investment Valuation    ││
│ │ 55 example.com/etf-guide            web      4  ⚠ 404│ Year 2012  DOI 10.x  URL …       ││
│ │ ── Bulk: [Merge dupes] [Export BibTeX] [Recheck] ──│  PREVIEW (APA) Damodaran, A.…     ││
│ │                                                     │  Used by: 4 terms · 27 blocks ↗   ││
│ │                                                     │  [Save] [Merge into…] [Delete]    ││
│ └────────────────────────────────────────────────────┴───────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Permissions required.**
- View library: `content:read` + `references:manage` — Editor, SEO Manager, Legal Reviewer (read), Managing
  Editor, Admin, Owner, Super Admin. Authors/Contributors: read + attach existing references to own content.
- Create/edit reference: `references:manage` — Author (create, to cite own work), Contributor (create only,
  no edit/delete of others'), Editor, Managing Editor, Admin.
- Merge duplicates / delete: `references:manage` + `content:archive` — Editor (scope **S**), Managing Editor,
  Admin, Owner (Super Admin bypass). Delete blocked while `UsagePanel` shows live citations.
- Import via DOI/URL lookup: `references:manage` + `ai:use` — Author, Editor, Managing Editor, Admin.
- Authorized via `rbac-service`. References are shared (not category-scoped), but **delete/merge** of a reference
  used by out-of-scope content requires Managing Editor or above.

**API endpoints used.**
- `GET /v1/references?kind=&search=&broken=&page=&limit=` — list (paginated).
- `GET /v1/references/:id` — full CSL-JSON + usage. `POST /v1/references` · `PATCH /v1/references/:id`.
- `DELETE /v1/references/:id` — delete (409 if cited). `POST /v1/references/merge` `{ keepId, mergeIds[] }`.
- `POST /v1/references/import` `{ doi | url }` — fetch + prefill CSL-JSON.
- `GET /v1/references/:id/usage` — citing terms + content blocks. `GET /v1/references/:id/export?style=bibtex`.

**Database tables affected.**
- `imperialpedia.references` (read/write), `imperialpedia.term_references` (rewritten on merge),
  `imperialpedia.glossary_terms` (read for usage labels). `cms.cms_contents` (read: scan `content_blocks` JSONB
  for `reference`/`citation` blocks referencing `refId` on merge/usage). Events: `knowledge.reference.changed`.

**Empty / Loading / Error states.**
- Empty: "No references yet — import a DOI or add one manually".
- Loading: list skeleton; preview pane shows a placeholder cite; link-rot status loads async per row.
- Error: invalid CSL-JSON → inline validation; DOI import miss → "Couldn't resolve <doi>, fill manually";
  delete of cited reference → 409 with usage list; merge across in-use refs shows an impact preview first.

**Edge cases.** A reference cited by both a glossary term and article blocks cannot be deleted until all citations
are removed or remapped. Merging rewrites `term_references.ref_id` and every CMS block `refId` atomically (single
transaction) and emits a revalidation event so cached pages re-render. Broken-URL (`404`) status is informational,
never auto-deletes.

---

## Entities — Companies, Countries, Industries & Technologies

**Purpose.** Manage the knowledge-graph **entities** (`imperialpedia.entities`): the real-world things pages and
infoboxes attach to — companies, countries, industries, technologies (extensible to people/markets). Each entity
is a typed record (`type`, `name`, `slug`, `description`, `category`, `country`, `industry`, `image`, `tags`) with
type-specific fields in a flexible `attributes` JSONB (flattened to the frontend by the serializer). Entities power
infobox blocks (`entityId`), the encyclopedia "seeAlso", and structured `Organization`/`Country` JSON-LD.

**Route.** `/admin/knowledge/entities` (invented — no scaffolded route covers entities; distinct from
`/admin/glossary` terms and `/admin/categories` taxonomy).

**Components.**
- `EntityTypeTabs` — Companies | Countries | Industries | Technologies (filters `type`).
- `EntityList` — name, type, country/industry, tag chips, image thumb, "linked pages" count.
- `EntityFilters` — `type`, `country`, `industry`, `category`, search (name/description).
- `EntityEditorForm` — base fields + a **type-aware attribute panel** (`attributes` JSONB) rendered from a
  per-type field schema (e.g. company → ticker, exchange, founded, employees; country → ISO, currency, GDP;
  technology → maturity, category).
- `ImageField` — `image` URL / media picker (CDN).
- `TagInput` — `tags[]` chip editor.
- `InfoboxPreview` — renders the entity as the public infobox card (matches `infobox` block render).
- `LinkedContentPanel` — content/terms referencing this entity (`seeAlso`, infobox `entityId`).

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Entities   [Companies][Countries][Industries][Technologies]   🔎 search…    [+ Entity]    │
│ ┌────────────────────────────────────────────────────┬───────────────────────────────────┐│
│ │ ▣ Apple Inc.        company  US   Technology  ↗ 14  │ EDIT · Apple Inc. (company)       ││
│ │ ▣ NVIDIA            company  US   Semis       ↗ 9   │  Name   Apple Inc.   Slug apple   ││
│ │ ▣ India             country  —    —           ↗ 22  │  Country US  Industry Technology  ││
│ │ ▣ Semiconductors    industry —    —           ↗ 7   │  ── attributes (company) ──       ││
│ │                                                     │  Ticker AAPL  Exchange NASDAQ     ││
│ │                                                     │  Founded 1976  Employees 164,000  ││
│ │                                                     │  Tags [tech][hardware][+]         ││
│ │                                                     │  INFOBOX PREVIEW  [card render]   ││
│ │                                                     │  Linked: 14 pages ↗               ││
│ │                                                     │  [Save]  [Delete]                 ││
│ └────────────────────────────────────────────────────┴───────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Permissions required.**
- View entities: `content:read` + `knowledge:edit` — Editor, SEO Manager, Managing Editor, Admin, Owner,
  Super Admin. Authors/Contributors: read-only (to attach an `entityId` in infobox blocks).
- Create/edit (upsert by `type`+`slug`): `knowledge:edit` — Editor (scope **S** by `category`), Managing Editor,
  Admin, Owner. Authors/Contributors: **none** (entities are curated reference data, not user content).
- Delete: `knowledge:edit` + `content:archive` — Managing Editor, Admin, Owner (Super Admin bypass); blocked
  while `LinkedContentPanel` shows references.
- The existing controller enforces an admin gate (`admin|owner|super_admin|system`); the canonical PEP is
  `rbac-service` with `knowledge:edit`, which Editors hold within scope — the controller's hard admin check is
  tightened to defer to the PDP so scoped Editors can curate.

**API endpoints used.**
- `GET /v1/knowledge/entities?type=&search=&country=&industry=&category=&page=&limit=` — list (paginated;
  `data:{ items, pagination }`).
- `GET /v1/knowledge/entities/:type/:slug` — single entity (flattened).
- `POST /v1/knowledge/entities` — **upsert by `(type, slug)`** (201 create / 200 update).
- `DELETE /v1/knowledge/entities/:type/:slug` — delete.
- (Aliased from the existing mounted `/v1/entities` routes; `/v1/knowledge/entities` is the knowledge-graph
  namespace per the canonical APIs.)

**Database tables affected.**
- `imperialpedia.entities` (read/write; unique `(type, slug)`; type-specific data in `attributes` JSONB).
- `cms.cms_contents` (read: `content_blocks` infobox `entityId` + encyclopedia `seeAlso` for usage/linked-content).
  Events: `knowledge.entity.changed` (triggers infobox re-render + search reindex).

**Empty / Loading / Error states.**
- Empty per tab: "No companies yet — add your first entity".
- Loading: list skeleton; attribute panel waits on the per-type schema; infobox preview shimmer.
- Error: missing `type/name/slug` → inline validation (matches server 400); duplicate `(type, slug)` resolves to
  an **update** (upsert), surfaced as "Updated existing entity"; 403 out-of-scope; delete-while-linked → 409.

**Edge cases.** `slug` is unique **per type**, so `country/india` and `industry/india` can coexist. Upsert
semantics mean re-submitting an existing `(type, slug)` edits rather than errors — the editor shows a "this will
update an existing entity" hint when a match is detected. Type-specific `attributes` are validated against the
per-type schema before save; unknown keys are preserved (forward-compatible). Deleting an entity does not delete
the pages that referenced it — their infobox blocks fall back to a "entity removed" placeholder until re-pointed.

---

## Cross-references

- **Editorial content** (block essays, the `financial_term` long-form explainer, `infobox`/`reference`/`citation`
  blocks): [03-content-pages](./03-content-pages.md), [02-content-cms](../02-content-cms.md).
- **Internal auto-linking** (published term + aliases → linking dictionary): [03-seo-and-media §A.7](../03-seo-and-media.md#a7-internal-linking-system).
- **Workflow gates** (draft → review → published; conditional Legal Review): [04-rbac-and-workflow](../04-rbac-and-workflow.md).
- **Tags** (flat, moderated — not categories): `/admin/tags`, [02-content-cms §B.2](../02-content-cms.md).
- **Search/autocomplete** (terms + entities indexed, aliases as synonyms): `search-service` (:3036).
