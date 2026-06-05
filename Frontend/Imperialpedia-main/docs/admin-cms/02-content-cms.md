# 02 — Content Management, Block Editor & Glossary

Covers **§2 (CMS content types, schemas, validation, workflow)**, **§3 (Rich Block Editor)**, **§5 (Glossary)**.

---

## A. Store reconciliation

All editorial content is **one table, `cms.cms_contents`, discriminated by `content_type`**. We extend the
existing enum rather than create a table per type (avoids JOIN sprawl, keeps one workflow/revision/SEO pipeline).

**Existing enum:** `page, post, article, product, event, job_listing, portfolio_item, news, doc`
**Extend to add:** `encyclopedia, financial_term, guide, tutorial, faq`

The thin `imperialpedia.articles` table is **demoted to a read projection**: on `content.published`
(event), a consumer upserts a denormalized row (title, slug, summary, cover, author, reading_time)
for fast public list/feed queries. Writes go only to `cms_contents`.

```
Editor ──write──▶ cms_contents ──cms.content.published──▶ [projector] ──▶ imperialpedia.articles (read model)
                                                       └─▶ search-service (index)
                                                       └─▶ CDN revalidate
```

---

## B. Content types (§2)

Each type = `content_type` value + a JSON-Schema for its `custom_fields` + the block palette it may use +
its workflow profile. Shared columns (title, slug, blocks, SEO, status, author) come from `cms_contents`.

| Type | `content_type` | Distinct `custom_fields` | Workflow profile | Required blocks |
|------|----------------|--------------------------|------------------|-----------------|
| **Article** | `article` | `readingTime`, `dek`, `disclosures[]` | Full (Contributor→…→Publish) | heading, paragraph |
| **Encyclopedia Page** | `encyclopedia` | `infobox{}`, `aliases[]`, `seeAlso[]`, `authorityLevel` | Full + Legal | infobox, references |
| **Financial Term** | `financial_term` | → governed by Glossary (§E); CMS holds the long-form essay, glossary holds the structured term | Glossary-lite | definition, formula |
| **Guide** | `guide` | `steps[]`, `level`, `estMinutes`, `prerequisites[]` | Standard | heading, callout |
| **Tutorial** | `tutorial` | `level`, `outcomes[]`, `codeLang`, `interactive` | Standard | code, callout |
| **News Article** | `news` | `sourceUrl`, `embargoAt`, `wire`, `tickers[]` | Fast-track (Author→Editor→Publish) | paragraph |
| **FAQ** | `faq` | `questions[]: {q, a, schemaFaq:true}` | Standard | — (Q/A pairs) |

### B.1 Validation rules (Zod, extending `cms-service/validators/contentSchemas.js`)

```ts
// Shared (already enforced): title 1..500, slug ^[a-z0-9-]+$ unique per website,
// excerpt ≤ 2000, seoMetadata (title ≤200, description ≤500, og*, canonical url, noIndex/noFollow).

const customFieldSchemas: Record<ContentType, ZodSchema> = {
  article:       z.object({ readingTime: z.number().int().min(0).optional(),
                            dek: z.string().max(300).optional(),
                            disclosures: z.array(z.string()).default([]) }),
  encyclopedia:  z.object({ infobox: z.record(z.unknown()).default({}),
                            aliases: z.array(z.string().max(200)).max(50).default([]),
                            seeAlso: z.array(z.string().uuid()).default([]),
                            authorityLevel: z.enum(['stub','standard','authoritative']).default('standard') }),
  financial_term:z.object({ glossaryTermId: z.string().uuid() }),         // 1:1 with glossary.terms
  guide:         z.object({ level: z.enum(['beginner','intermediate','advanced']),
                            estMinutes: z.number().int().positive().max(600),
                            prerequisites: z.array(z.string().uuid()).default([]) }),
  tutorial:      z.object({ level: z.enum(['beginner','intermediate','advanced']),
                            outcomes: z.array(z.string()).min(1),
                            codeLang: z.string().optional() }),
  news:          z.object({ sourceUrl: z.string().url().optional(),
                            embargoAt: z.string().datetime().optional(),
                            tickers: z.array(z.string().regex(/^[A-Z.:-]{1,12}$/)).default([]) }),
  faq:           z.object({ questions: z.array(z.object({
                              q: z.string().min(3).max(300),
                              a: z.string().min(1).max(5000) })).min(1).max(50) }),
};
```

**Cross-cutting validation gates** (server-side, enforced on `submit_for_review`, not just `save`):

1. **Slug uniqueness** per `website_id` (existing unique constraint).
2. **At least one heading + one paragraph** for prose types; FAQs require ≥1 Q/A.
3. **Every reference block** must resolve to a `glossary.references` or external URL (no dangling cites).
4. **Financial-formula blocks** must parse (see §D.7) — block save fails on invalid LaTeX/expression.
5. **SEO minimums** to leave `draft`: meta title 30–60 chars, description 70–160, ≥1 H1, alt text on every image. (Soft-warn in draft, hard-block on `submit_for_review`.)
6. **Featured image** required for `article/news/encyclopedia` before publish.

### B.2 Taxonomy — Categories & Tags

Already modeled: `cms_categories` (hierarchical via `parent_id`) and `cms_tags`. Imperialpedia profile:

- **Categories** are a curated tree (Investing → Stocks → Valuation), max depth 4, each maps to a public hub page and a `breadcrumb` + `BreadcrumbList` schema.
- **Tags** are flat, free-but-moderated; auto-suggested by AI (`/admin/ai` tag suggester) and reconciled nightly to merge near-duplicates.
- A content item: **exactly one** `category_id`, **0..20** `tag_ids` (existing `tag_ids JSONB`).

```sql
-- Category extension for hub pages & ordering (additive migration)
ALTER TABLE cms.cms_categories
  ADD COLUMN IF NOT EXISTS hub_content_id uuid NULL REFERENCES cms.cms_contents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon text NULL;
```

### B.3 The canonical content schema (as it should read after extension)

```sql
-- cms.cms_contents  (existing table; enum + 2 columns extended)
ALTER TYPE cms.enum_cms_contents_content_type ADD VALUE IF NOT EXISTS 'encyclopedia';
ALTER TYPE cms.enum_cms_contents_content_type ADD VALUE IF NOT EXISTS 'financial_term';
ALTER TYPE cms.enum_cms_contents_content_type ADD VALUE IF NOT EXISTS 'guide';
ALTER TYPE cms.enum_cms_contents_content_type ADD VALUE IF NOT EXISTS 'tutorial';
ALTER TYPE cms.enum_cms_contents_content_type ADD VALUE IF NOT EXISTS 'faq';

ALTER TABLE cms.cms_contents
  ADD COLUMN IF NOT EXISTS language        char(5)  NOT NULL DEFAULT 'en',     -- i18n
  ADD COLUMN IF NOT EXISTS translation_of  uuid     NULL REFERENCES cms.cms_contents(id),
  ADD COLUMN IF NOT EXISTS reviewed_for    jsonb    NOT NULL DEFAULT '{}',     -- {seo:ts, legal:ts, fact:ts}
  ADD COLUMN IF NOT EXISTS quality_score   int      NULL,                      -- AI content score 0..100
  ADD COLUMN IF NOT EXISTS search_vector   tsvector NULL;                      -- generated, see indexing

CREATE INDEX IF NOT EXISTS cms_contents_search_gin ON cms.cms_contents USING gin(search_vector);
CREATE INDEX IF NOT EXISTS cms_contents_type_status ON cms.cms_contents (content_type, status);
CREATE INDEX IF NOT EXISTS cms_contents_lang_trans ON cms.cms_contents (language, translation_of);
```

Full ER + indexing strategy: [06-security-database-api.md](./06-security-database-api.md#database).

---

## C. Content list & editor surfaces (UX)

### C.1 Content list (`/admin/content`)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Content            [+ New ▾]   [⤓ Import]                          1,204 items        │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Type ▾  Status ▾  Category ▾  Author ▾  Language ▾   🔎 search…   ⚙ saved views │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ☐  Title                              Type     Status        Author     SEO   Updated │
│  ☐  Understanding Compound Interest     Article  ● Published   A. Rao     92    2h ago  │
│  ☐  ETF                                 Encyc.   ◐ In Review   M. Khan    71    1d ago  │
│  ☐  What is a P/E ratio?                Term     ◌ Draft       —          48    3d ago  │
│  ☐  …                                                                                   │
│  ── Bulk: [Publish] [Archive] [Assign category] [Add tags] [Export] ──   ◀ 1 2 3 … ▶   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Backed by the existing `bulkUpdateSchema` (`publish|archive|delete|assign_category`, ≤100 ids).
Saved views persist filter+sort per user. SEO column is the per-article score (§03).

---

## D. Rich Block Editor (§3)

A **Notion/Gutenberg-class block editor** that persists to `content_blocks JSONB` (already the storage
contract). Built on **TipTap/ProseMirror** for inline prose, wrapped by a custom block framework so
blocks are first-class, reorderable, and **server-renderable** (RSC) for SSR/SEO.

### D.1 Block envelope (extends existing `contentBlockSchema`)

```ts
interface Block {
  id: string;                 // stable nanoid
  type: BlockType;
  order: number;
  content: Record<string, unknown>;   // type-specific payload (validated per type)
  meta?: { createdBy?: number; lockedBy?: number; comments?: number };
}
```

### D.2 Block palette (the 16 required + platform blocks)

| Block | `type` | `content` payload | Renders to |
|-------|--------|-------------------|-----------|
| Heading | `heading` | `{ level: 1..4, text, anchor }` | `<h2 id>` + auto TOC |
| Paragraph | `paragraph` | `{ html }` (sanitized ProseMirror) | `<p>` |
| Table | `table` | `{ rows, cols, cells[][], header:bool, caption }` | `<table>` + optional sort |
| Image | `image` | `{ mediaId, alt, caption, width, focalPoint }` | `<figure>`+CDN srcset |
| Video | `video` | `{ mediaId|url, provider, poster, captionsVttId }` | lazy `<video>`/embed |
| **Chart** | `chart` | `{ chartType, dataRef|inline, axes, source, asOf }` | SSR SVG + hydrate |
| **Infobox** | `infobox` | `{ title, image, rows:[{label,value,unit,source}], entityId? }` | sidebar card |
| Quote | `quote` | `{ html, attribution, source }` | `<blockquote>` |
| **Reference** | `reference` | `{ refId }` → `glossary.references` | numbered, links to §References |
| **Footnote** | `footnote` | `{ marker, html }` | inline marker + bottom list |
| **Citation** | `citation` | `{ style: apa|mla|chicago, fields{} }` | formatted cite + COinS |
| Callout | `callout` | `{ variant: info|warning|tip|risk|key-takeaway, html }` | colored card |
| Code | `code` | `{ lang, code, filename, highlightLines }` | Shiki-highlighted |
| **Math formula** | `math` | `{ latex, display: inline|block }` | KaTeX SSR |
| **Financial formula** | `finmath` | `{ latex, variables:[{sym,label,unit}], compute? }` | KaTeX + live calculator |
| Embed | `embed` | `{ provider, url, html? }` | sanitized oEmbed |
| Columns | `columns` | `{ ratio, children: Block[][] }` | responsive grid |
| Divider | `divider` | `{}` | `<hr>` |
| Button | `button` | `{ label, href, variant }` | CTA |
| Gallery | `gallery` | `{ items:[{mediaId,alt,caption}] }` | lightbox grid |
| HTML | `html` | `{ html }` (admin-only, sanitized) | raw (sanitized) |

### D.3 Editor UX (wireframe)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Back   Understanding Compound Interest            ◌ Draft   Autosaved 14:32   [⋯]      │
│ ┌──────────────────────────────────────────────────────────┬──────────────────────────┐│
│ │  Title:  Understanding Compound Interest                  │  INSPECTOR                ││
│ │  Slug:   understanding-compound-interest        [edit]    │  ┌─ Settings ─────────┐  ││
│ │ ┌──────────────────────────────────────────────────────┐ │  │ Type:  Article ▾   │  ││
│ │ │ ⠿ H1  Understanding Compound Interest                 │ │  │ Category: Investing│  ││
│ │ │ ⠿ ¶   Compound interest is interest on interest…      │ │  │ Tags: +interest +…│  ││
│ │ │ ⠿ ⨏   finmath:  A = P(1 + r/n)^{nt}      [calc ▸]     │ │  │ Language: en       │  ││
│ │ │ ⠿ ▦   callout(key-takeaway): The earlier you start…  │ │  └────────────────────┘  ││
│ │ │ ⠿ 📊  chart(line): Growth of $1,000 over 30y          │ │  ┌─ SEO ▰▰▰▰▱ 78 ─────┐  ││
│ │ │   + type "/" for a block …                            │ │  │ ✓ title  ✓ meta    │  ││
│ │ └──────────────────────────────────────────────────────┘ │  │ ⚠ alt missing (1)  │  ││
│ │  [ /slash menu: Heading · Table · Image · Chart · Math ]  │  │ ✓ internal links 4 │  ││
│ │                                                          │  └────────────────────┘  ││
│ │                                                          │  [Comments] [Versions]   ││
│ └──────────────────────────────────────────────────────────┴──────────────────────────┘│
│  [ Save draft ]   [ Preview ]   [ Submit for review ▸ ]                                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### D.4 Editor capabilities

- **Slash menu** (`/`) + drag-handle (`⠿`) reorder + keyboard-first; full a11y (ARIA, focus order).
- **Autosave** → existing `autosaveContentSchema` endpoint, debounced 2s; creates lightweight revisions.
- **Real-time co-editing** (NEW): Yjs/CRDT over `realtime-service` WebSocket; block-level presence + lock.
- **Inline comments** anchored to a block id → editorial workflow ([04](./04-rbac-and-workflow.md)).
- **Block comments / suggestions** mode (track-changes) for Editor review.
- **Paste-to-blocks**: Markdown/HTML/Docs paste auto-converts to blocks; images upload to media-service.
- **AI inline** (§ from [05](./05-analytics-monetization-ai.md)): "/ai improve", summarize, generate FAQ, suggest links — all suggestions, never silent auto-write.

### D.5 Server rendering & sanitization

- Blocks render server-side (RSC) to HTML for SEO + cache; the same renderer runs in the editor preview.
- **All HTML is sanitized** (DOMPurify/`sanitize-html`, allowlist) at write **and** render. `html`/`embed`
  blocks are admin-only and double-sanitized (web/security rule: never trust stored HTML).
- Math/finmath compiled with **KaTeX** server-side (no client MathJax flash).

### D.6 References, footnotes, citations (encyclopedia-grade)

- `reference` blocks point at rows in `glossary.references` (shared with glossary §E) → a numbered,
  deduplicated **References** section auto-rendered at article end with backlinks.
- `footnote` blocks render inline superscripts + a footnotes list; numbering is render-time stable.
- `citation` blocks store structured CSL-JSON; rendered in APA/MLA/Chicago and exported to BibTeX.

### D.7 Financial-formula block (the differentiator)

```json
{ "type": "finmath", "content": {
    "latex": "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}",
    "variables": [
      {"sym":"P","label":"Principal","unit":"USD","default":1000},
      {"sym":"r","label":"Annual rate","unit":"%","default":7},
      {"sym":"n","label":"Compounds/yr","default":12},
      {"sym":"t","label":"Years","default":30}],
    "compute": "P*Math.pow(1+(r/100)/n, n*t)" }}
```

- Renders the LaTeX (KaTeX) **and** an interactive calculator (readers change variables → live result),
  wired to the existing `imperialpedia-service` calculator endpoints (`calculatorController.js`).
- `compute` runs in a **sandboxed expression evaluator** (no `eval`; allowlisted math) — validated on save.

---

## E. Glossary System (§5)

Investopedia-style. The **structured term** lives in `imperialpedia-service` (knowledge domain); the
**long-form explainer** is a `content_type='financial_term'` CMS page linked 1:1. This keeps the term
machine-readable (for tooltips, search, schema markup, related-terms graph) while the essay gets the full
editorial pipeline.

### E.1 Schema (new `glossary` tables in `imperialpedia` schema)

```sql
CREATE TABLE imperialpedia.glossary_terms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term          varchar(200) NOT NULL,
  slug          varchar(220) NOT NULL UNIQUE,
  short_def     text NOT NULL,                       -- tooltip-length, ≤ 320 chars
  full_def      text NOT NULL,                       -- 1–3 paragraphs
  formula_latex text NULL,                           -- canonical formula if any
  pronunciation varchar(120) NULL,
  aliases       jsonb NOT NULL DEFAULT '[]',         -- ["PE","P/E ratio"]
  difficulty    varchar(16) NOT NULL DEFAULT 'beginner'
                  CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  category      varchar(120) NULL,                   -- Valuation, Derivatives, …
  cms_content_id uuid NULL,                          -- 1:1 long-form explainer (cms_contents.id)
  status        varchar(16) NOT NULL DEFAULT 'draft' -- mirrors workflow gate
                  CHECK (status IN ('draft','review','published','archived')),
  search_vector tsvector NULL,
  view_count    bigint NOT NULL DEFAULT 0,
  created_by    bigint NULL, updated_by bigint NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX glossary_terms_search_gin ON imperialpedia.glossary_terms USING gin(search_vector);
CREATE INDEX glossary_terms_difficulty ON imperialpedia.glossary_terms (difficulty);
CREATE INDEX glossary_terms_category   ON imperialpedia.glossary_terms (category);

CREATE TABLE imperialpedia.glossary_examples (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id   uuid NOT NULL REFERENCES imperialpedia.glossary_terms(id) ON DELETE CASCADE,
  title     varchar(200) NULL,
  body      text NOT NULL,                            -- worked example, may include $math$
  sort_order int NOT NULL DEFAULT 0
);

-- related-terms graph (directed, typed); also powers "See also" + internal linking
CREATE TABLE imperialpedia.glossary_relations (
  term_id     uuid NOT NULL REFERENCES imperialpedia.glossary_terms(id) ON DELETE CASCADE,
  related_id  uuid NOT NULL REFERENCES imperialpedia.glossary_terms(id) ON DELETE CASCADE,
  relation    varchar(24) NOT NULL DEFAULT 'related'  -- related|prerequisite|contrast|broader|narrower
                CHECK (relation IN ('related','prerequisite','contrast','broader','narrower')),
  PRIMARY KEY (term_id, related_id, relation)
);

-- shared reference/citation store (also used by article reference/citation blocks §D.6)
CREATE TABLE imperialpedia.references (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind      varchar(16) NOT NULL DEFAULT 'web'        -- web|book|journal|filing|dataset
                CHECK (kind IN ('web','book','journal','filing','dataset')),
  csl_json  jsonb NOT NULL,                           -- structured citation (CSL-JSON)
  url       text NULL, accessed_at date NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE imperialpedia.term_references (
  term_id uuid REFERENCES imperialpedia.glossary_terms(id) ON DELETE CASCADE,
  ref_id  uuid REFERENCES imperialpedia.references(id) ON DELETE CASCADE,
  PRIMARY KEY (term_id, ref_id)
);
```

### E.2 The 7 required glossary fields → where they live

| Required field | Storage |
|----------------|---------|
| **Term** | `glossary_terms.term` (+ `aliases`) |
| **Definition** | `short_def` (tooltip) + `full_def` (page) + optional `cms_content_id` essay |
| **Formula** | `formula_latex` (+ rich `finmath` blocks in the linked CMS page) |
| **Examples** | `glossary_examples[]` |
| **Related Terms** | `glossary_relations[]` (typed graph) |
| **Difficulty Level** | `difficulty` enum (4 levels) |
| **References** | `references[]` via `term_references` (shared with article citations) |

### E.3 Glossary admin (`/admin/glossary`) & behaviors

- List/grid of terms with difficulty + status + view chips; bulk publish/merge-aliases.
- Term editor: structured fields on the left, live tooltip + page preview on the right, related-terms
  graph picker, AI "draft definition / suggest related terms / generate example" (suggestions only).
- **Auto-linking:** a published term's `term`+`aliases` are pushed to the internal-linking dictionary
  ([03-seo-and-media.md](./03-seo-and-media.md#internal-linking)); the first mention of a term in any
  article auto-links to the glossary page (configurable, max-1-per-term to avoid over-linking).
- **Tooltip API:** public `GET /v1/glossary/:slug/tooltip` returns `{term, shortDef, difficulty, url}`
  for hover-cards across the site.
- **Schema markup:** every term emits `DefinedTerm` + `DefinedTermSet` JSON-LD; formula pages add
  `MathSolver`/`HowTo` where applicable (see SEO doc).
- **Search:** terms indexed in OpenSearch with synonyms = aliases → autocomplete, fuzzy, "did you mean".

### E.4 Glossary workflow

Lighter than full editorial but still gated: `draft → review (Editor) → published`. A term that ships a
formula or a "this is not financial advice"-sensitive definition also routes through **Legal Review**
(see [04-rbac-and-workflow.md](./04-rbac-and-workflow.md)).
