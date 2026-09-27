# 13 — Content Editor & Block Specifications

> **Parent specs:** [02-content-cms.md §D](../02-content-cms.md) (block palette, editor wireframe, finmath), [03-seo-and-media.md](../03-seo-and-media.md) (media refs, internal linking, schema markup), [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) (workflow gates, inline comments), [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md) (AI inline, disclosures).
> **Audience:** Engineering (editor + cms-service), Editorial.
> **Scope:** the per-block contract for the Notion/Gutenberg-class editor that persists to `cms.cms_contents.content_blocks JSONB`. This file is the **authoritative block reference**; [02 §D](../02-content-cms.md) frames the surface, this drills each block.

The editor lives at the scaffolded routes `/admin/content/new` and `/admin/content/[slug]/edit`. It does **not** introduce a new store — every block is an element of the existing `content_blocks` array on `cms_contents` (see migration `20260005-create-cms-contents.js`).

---

## A. The block envelope (ground truth)

Every block is one element of `content_blocks JSONB`, validated by `contentBlockSchema` in
`Backend/services/knowledge/cms-service/validators/contentSchemas.js`:

```ts
interface Block {
  id: string;        // stable nanoid(12), client-generated, immutable for the block's life
  type: BlockType;   // enum — this PRD ADDS the 12 specced types to the existing union
  order: number;     // int ≥ 0; persisted but de-duplicated server-side to array index on save
  content: Record<string, unknown>;  // type-specific, validated per §C by a discriminated union
}
```

**`order` is advisory.** The array index is canonical; `order` is rewritten to `index` on every save so
a corrupt/duplicate `order` can never reorder rendered output. `id` is the anchor for comments,
co-editing presence, and revision diffs — it must never be reassigned on edit.

### A.1 Type-union extension (additive)

The existing `contentBlockSchema` enum is
`paragraph,heading,image,video,gallery,code,quote,divider,html,callout,table,embed,button,columns`.
This PRD requires extending it with the 6 missing knowledge-grade types so the 12 blocks below all validate:

```ts
const blockType = z.enum([
  // existing
  'paragraph','heading','image','video','gallery','code','quote','divider','html','callout','table','embed','button','columns',
  // added by this PRD (knowledge/finance grade)
  'chart','math','finmath','faq','reference','citation','disclosure',
]);
```

> Migration note: this is a Zod-only change (the column is free-form JSONB) — **no SQL migration**. Old
> rows keep validating; new types are accepted forward. Unknown types render as a safe placeholder, never throw.

### A.2 Per-block validation is a discriminated union

`content` is validated by a `z.discriminatedUnion('type', [...])` keyed on `type`, replacing the loose
`z.record(z.unknown())` for the 12 known blocks while still tolerating platform blocks. **Validation runs
at write** (autosave + save + submit) **and is re-asserted before render** — never trust stored JSON.

---

## B. Editor mechanics (cross-block)

### B.1 Slash menu

Typing `/` on an empty line (or `Cmd/Ctrl-J` anywhere) opens the inserter — a fuzzy-filtered, grouped,
keyboard-driven menu. Each block below declares its **slash entry** (label, aliases, group). Groups:
**Basic** (Heading, Paragraph, Callout), **Media** (Image, Video), **Data** (Table, Chart),
**Knowledge** (Formula, FAQ, References, Citations), **Compliance** (Financial Disclosure).

```
┌─ / type to filter ─────────────────────────┐
│ BASIC                                       │
│  H  Heading            #, h1, title         │
│  ¶  Paragraph          text, p              │
│  ▦  Callout            note, tip, warning   │
│ DATA                                        │
│  ⊞  Table              grid, rows           │
│  📊 Chart               graph, line, bar     │
│ KNOWLEDGE                                   │
│  √  Formula (math)     katex, equation      │
│  ⨏  Formula (finance)  finmath, calculator  │
│  ?  FAQ                accordion, q&a        │
│  ❡  References         bibliography, cite-list│
│  ”  Citations          apa, mla, chicago    │
│ COMPLIANCE                                  │
│  §  Financial Disclosure  risk, disclaimer  │
└─────────────────────────────────────────────┘
```

Entries are filtered by the current content type's allowed palette ([02 §B](../02-content-cms.md)) and by the
author's grants — e.g. `html` requires `admin`; `disclosure` insert requires `content:edit.own`+ the
content being a financial type.

### B.2 Drag reorder

Each block has a left **drag handle (`⠿`)**. Drag = HTML5 DnD with a keyboard fallback
(`Alt-Shift-↑/↓` moves focused block). On drop the client renumbers `order` optimistically and emits a
single autosave with the **full reordered array** (not a patch — array position is canonical). A Yjs
move op (§B.5) carries the reorder to co-editors; server rewrites `order := index` on persist.

### B.3 Autosave → revisions

Debounced **2s** after the last keystroke (and on blur / route-change / 30s heartbeat). Calls the existing
`autosaveContentSchema` endpoint `PATCH /v1/cms/contents/:id/autosave` (`{title?, contentBlocks?, excerpt?, seoMetadata?}`).
Autosave **does not** advance the workflow; it persists `content_blocks` and bumps `updated_at`.

A **revision** (`cms.cms_content_revisions`) is written by the server, not on every autosave (that would
flood the table). Policy: a new `revision_number` row with a `snapshot` of the full content is created on
(a) **explicit Save draft**, (b) **every workflow transition** (submit/approve/publish — see [04](../04-rbac-and-workflow.md)),
and (c) a **time-boxed checkpoint** (first autosave after a ≥5-min idle gap). `change_note` is "autosave
checkpoint" for (c), the user's note otherwise. `revision_count` on `cms_contents` is incremented in the
same transaction. Restore = load `snapshot` into the editor as a new draft (never destructive).

### B.4 Inline comments anchored to block id

Comments target `block.id` (+ optional ProseMirror text range for prose blocks). They are stored outside
the block (so editing a block never mutates comment data) in `cms.cms_content_comments`
(new, additive — `id, content_id, block_id, anchor jsonb, author_id, body, resolved bool, thread_parent_id, created_at`).
The right-rail **Comments** tab lists threads; a block with open comments shows a `💬 n` badge on its handle.
Comments drive the editorial review loop ([04](../04-rbac-and-workflow.md)); resolving requires `content:review`.
If a commented block is deleted, its threads are marked `orphaned` (kept for audit), not hard-deleted.

### B.5 Real-time co-editing (Yjs/CRDT)

The editor binds a **Yjs document** (`Y.Array` of block maps; prose blocks use `Y.XmlFragment` for
ProseMirror) to the `realtime-service` WebSocket (`y-websocket` provider over the existing JWT-auth'd WS).
Room id = `cms:content:{contentId}`. Presence (cursors, selected block, avatars) via the Yjs awareness
protocol. **Block-level soft lock:** a finmath/chart/table block being structurally edited (not prose) sets
`awareness.lock = blockId`; peers get a read-only overlay on that block until release. CRDT resolves
concurrent prose edits; structural ops (insert/delete/move block) are last-writer-wins on the `Y.Array`.
The Yjs doc is **ephemeral transport** — the durable source of truth is still `content_blocks` written via
autosave by the room's elected leader (lowest sid), so a total WS outage degrades to single-user autosave.

### B.6 Paste-to-blocks

Pasting converts to blocks via a pipeline: **clipboard → sanitize → parse → block array**.
- **Markdown** → blocks (`#`→heading, fenced ` ``` `→code, `|...|`→table, `> `→quote, `$$...$$`→math).
- **Google Docs / Word HTML** → normalized via the same allowlist sanitizer (§B.7), then mapped to blocks;
  pasted `<img>` are **re-uploaded** to media-service (never hotlink), returning a `mediaId`.
- **Bare URL** on its own line → `embed`/`video` if oEmbed-recognized, else an inline link.
- Paste **inside** a prose block stays inline (ProseMirror handles marks); paste **on an empty line**
  fans out to multiple blocks. Max 500 blocks per paste (guard); excess is truncated with a toast.

### B.7 Sanitization (write AND render — non-negotiable)

Per [web/security.md] and [02 §D.5](../02-content-cms.md): **all HTML is sanitized with an allowlist
(`sanitize-html`) at write and re-sanitized at render.** Allowlist: structural + inline text tags, `a[href]`
(http/https/mailto/relative only, `rel="nofollow noopener"` forced on external), `img` only via our CDN
origin. **Stripped:** `<script>`, `<style>`, `on*` handlers, `javascript:`/`data:` URIs (except whitelisted
image data on paste pre-upload), `<iframe>` except from the embed allowlist (§ Video/Embed). `html` and
`embed` blocks are **admin-only** (`role:manage`/`system:settings`) and **double-sanitized**. KaTeX is
compiled server-side in a `trust:false`, `strict:true` config so `\href`/`\includegraphics` are rejected.

---

## C. The 12 block specifications

Each: **(1) editor UX / slash entry, (2) exact `content` JSONB + realistic example, (3) Zod validation,
(4) server render target, (5) storage/security.**

### C.1 Heading

1. **UX / slash:** `/heading` (aliases `#`, `h1`, `title`; group Basic). Markdown `## ` autoconverts.
   Inspector lets author pick level 1–4; anchor auto-derives from text (editable). Headings feed the
   right-rail **TOC** and the public page's `TableOfContents` + `BreadcrumbList` ([03](../03-seo-and-media.md)).
2. **Content + example:**
```json
{ "id": "h_8fK2", "type": "heading", "order": 0,
  "content": { "level": 2, "text": "How compound interest works", "anchor": "how-compound-interest-works" } }
```
3. **Zod:**
```ts
z.object({ level: z.number().int().min(1).max(4),
           text: z.string().min(1).max(200),
           anchor: z.string().regex(/^[a-z0-9-]+$/).max(120) })
```
   Server enforces **exactly one `level:1`** per document (the H1 == title is rendered separately; in-body
   H1 is coerced to H2 with a warn). Anchors deduped per document (`-2` suffix).
4. **Render:** `<h{2..4} id="{anchor}">{text}</h>` — plain text only (no inline HTML in headings). H1 of
   the page is the `title` column, not a block.
5. **Storage/security:** text is plain-string escaped; no sanitizer needed (no HTML accepted).

### C.2 Paragraph

1. **UX / slash:** default block; `/paragraph` (`text`, `p`). Rich inline via ProseMirror toolbar:
   **bold, italic, code, link, sup/sub, glossary-link**. `/ai improve` acts on the focused paragraph
   ([05](../05-analytics-monetization-ai.md)) — suggestion only.
2. **Content + example:**
```json
{ "id": "p_Lq07", "type": "paragraph", "order": 1,
  "content": { "html": "Compound interest is <strong>interest on interest</strong>. See <a href=\"/glossary/principal\" data-glossary=\"principal\">principal</a>." } }
```
3. **Zod:** `z.object({ html: z.string().max(20000) })` — then the string is **parsed + sanitized** (§B.7);
   schema validation does not equal safety, so the sanitizer's output replaces the stored value on save.
4. **Render:** `<p>{sanitizedHtml}</p>`. `data-glossary` marks render as hover-card tooltip links via the
   public `GET /v1/glossary/:slug/tooltip` API ([02 §E.3](../02-content-cms.md)).
5. **Storage/security:** stored value is the **post-sanitize** HTML (defense at write); re-sanitized at
   render. Links to external domains get `rel="nofollow noopener"` injected.

### C.3 Image

1. **UX / slash:** `/image` (`img`, `photo`). Opens the **media picker** (media-service, [03](../03-seo-and-media.md))
   or drag-drop/paste → upload. Inspector: alt (required), caption, width preset (`content|wide|full`),
   focal point (click-to-set on a thumbnail). **No raw URLs** — only a `mediaId` from media-service.
2. **Content + example:**
```json
{ "id": "img_M3a1", "type": "image", "order": 2,
  "content": { "mediaId": "9b1f...uuid", "alt": "Line chart of $1,000 growing to $7,612 over 30 years",
               "caption": "Growth of a one-time deposit at 7% compounded monthly.",
               "width": "wide", "focalPoint": { "x": 0.5, "y": 0.35 } } }
```
3. **Zod:**
```ts
z.object({ mediaId: z.string().uuid(),
           alt: z.string().min(1).max(300),        // hard-required at submit (SEO gate, [02 §B.1])
           caption: z.string().max(500).optional(),
           width: z.enum(['content','wide','full']).default('content'),
           focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional() })
```
4. **Render:** `<figure><img>` with CDN `srcset`/`sizes` derived from media-service variants, `loading="lazy"`
   (eager+`fetchpriority=high` only if it's the featured image), explicit `width`/`height` (no CLS),
   `<figcaption>` sanitized. Emits `ImageObject` schema where used as primary.
5. **Storage/security:** only the `mediaId` is stored — URL/dimensions/variants are resolved at render from
   media-service, so a moved/optimized asset never breaks the block. Empty `alt` blocks publish (`media:upload`
   does not bypass the SEO alt gate).

### C.4 Video

1. **UX / slash:** `/video` (`embed-video`, `youtube`). Two modes: **hosted** (mediaId → our player) or
   **provider** (paste a YouTube/Vimeo URL → oEmbed). Inspector: poster image (mediaId), captions/VTT
   (required for hosted >30s — a11y gate), provider auto-detected.
2. **Content + example:**
```json
{ "id": "vid_7Zb2", "type": "video", "order": 3,
  "content": { "provider": "youtube", "url": "https://www.youtube.com/watch?v=abc123XYZ",
               "poster": "media:5c2e...uuid", "captionsVttId": null, "title": "Compounding explained" } }
```
   Hosted variant: `{ "provider":"hosted", "mediaId":"...uuid", "poster":"media:...", "captionsVttId":"...uuid" }`.
3. **Zod:**
```ts
z.discriminatedUnion('provider', [
  z.object({ provider: z.enum(['youtube','vimeo']), url: z.string().url(),
             poster: z.string().optional(), captionsVttId: z.string().uuid().nullable().optional(),
             title: z.string().max(200).optional() }),
  z.object({ provider: z.literal('hosted'), mediaId: z.string().uuid(),
             poster: z.string().optional(), captionsVttId: z.string().uuid().nullable().optional(),
             title: z.string().max(200).optional() }) ])
```
   Provider URLs validated against an **allowlist of hosts** (youtube.com/youtu.be, vimeo.com); anything
   else is rejected (no arbitrary iframe).
4. **Render:** lazy **facade** (poster + play button) that swaps to the provider `<iframe>` (sandboxed,
   allowlisted `src`) or our `<video>` on click — keeps the player out of LCP. Emits `VideoObject` schema.
5. **Storage/security:** provider iframe `src` is reconstructed server-side from the allowlisted host + video
   id (the pasted URL is parsed, not echoed), neutralizing `?autoplay`/injection. CSP `frame-src` limited to
   the allowlist ([web/security.md]).

### C.5 Table

1. **UX / slash:** `/table` (`grid`, `rows`). Spawns a 2×2; toolbar to add/remove rows/cols, toggle header
   row, set caption, mark a column **sortable/numeric**. Paste a TSV/Markdown table fills cells.
2. **Content + example:**
```json
{ "id": "tbl_Qp44", "type": "table", "order": 4,
  "content": { "header": true, "caption": "Final balance by compounding frequency (P=$1,000, r=7%, t=30y)",
    "cols": [ {"key":"freq","label":"Frequency","align":"left"},
              {"key":"amt","label":"Final amount","align":"right","numeric":true,"sortable":true} ],
    "rows": [ ["Annually","$7,612.26"], ["Monthly","$8,116.50"], ["Daily","$8,166.86"] ] } }
```
3. **Zod:**
```ts
z.object({ header: z.boolean().default(true),
  caption: z.string().max(300).optional(),
  cols: z.array(z.object({ key: z.string().max(40), label: z.string().max(120),
    align: z.enum(['left','center','right']).default('left'),
    numeric: z.boolean().optional(), sortable: z.boolean().optional() })).min(1).max(20),
  rows: z.array(z.array(z.string().max(2000))).max(500)
}).refine(c => c.rows.every(r => r.length === c.cols.length), 'every row must match column count')
```
4. **Render:** semantic `<table>` with `<caption>`, `<thead>` if `header`, `scope` on header cells; client
   progressive-enhances sortable numeric columns (no JS = static table still correct). Wide tables get a
   horizontal scroll container with `role="region"` + `aria-label` for keyboard scroll.
5. **Storage/security:** cells are **plain text only** (no HTML in cells — inline math allowed as `$...$`
   parsed at render). Cell strings are escaped; the count `refine` blocks ragged tables that would mis-render.

### C.6 Formula (Math — KaTeX)

1. **UX / slash:** `/math` (`katex`, `equation`, `√`). Modal with a LaTeX field + **live KaTeX preview** and a
   symbol palette. Inline math is typed `$...$` inside paragraphs; this block is **display** math.
2. **Content + example:**
```json
{ "id": "math_Vx9", "type": "math", "order": 5,
  "content": { "latex": "FV = PV \\cdot (1 + i)^{n}", "display": "block" } }
```
3. **Zod:**
```ts
z.object({ latex: z.string().min(1).max(4000), display: z.enum(['inline','block']).default('block') })
  // .superRefine: server compiles with katex.renderToString({throwOnError:true, trust:false, strict:true});
  //               a parse error fails the save (per [02 §B.1] gate 4 — no broken equations persist).
```
4. **Render:** **server-side KaTeX** → static HTML+CSS (no client MathJax flash, no layout shift). `aria-label`
   carries a readable rendering of the expression for screen readers.
5. **Storage/security:** only LaTeX source is stored; rendered to HTML at build/SSR. KaTeX runs `trust:false`
   so `\href`, `\url`, `\includegraphics`, and HTML extension macros are rejected — the formula cannot
   inject markup or links.

### C.7 Formula (Finance — finmath, variables + sandboxed compute)

The differentiator ([02 §D.7](../02-content-cms.md)). Renders the equation **and** an interactive calculator.

1. **UX / slash:** `/finmath` (`calculator`, `⨏`). Editor has: LaTeX field (live KaTeX), a **variables
   table** (symbol, label, unit, default, min/max/step), a **compute expression** field, and a **Test panel**
   that runs the sandbox on the defaults and shows the result + any error. A **"link to platform calculator"**
   toggle binds the block to a real `imperialpedia-service` endpoint (see render) instead of the inline expr.
2. **Content + example:**
```json
{ "id": "fin_Cp01", "type": "finmath", "order": 6,
  "content": {
    "latex": "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}",
    "variables": [
      { "sym":"P","label":"Principal","unit":"USD","default":1000,"min":0,"max":10000000,"step":100 },
      { "sym":"r","label":"Annual rate","unit":"%","default":7,"min":0,"max":100,"step":0.1 },
      { "sym":"n","label":"Compounds / yr","default":12,"min":1,"max":365,"step":1 },
      { "sym":"t","label":"Years","default":30,"min":1,"max":100,"step":1 } ],
    "compute": "P * pow(1 + (r/100)/n, n*t)",
    "result": { "label":"Final amount","unit":"USD","precision":2 },
    "calculatorBinding": { "type":"compound-interest", "map": { "principal":"P","rate":"r","years":"t","frequency":"n" } } } }
```
3. **Zod:**
```ts
z.object({
  latex: z.string().min(1).max(4000),
  variables: z.array(z.object({
    sym: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,9}$/),
    label: z.string().min(1).max(80), unit: z.string().max(16).optional(),
    default: z.number(), min: z.number().optional(), max: z.number().optional(), step: z.number().positive().optional()
  })).min(1).max(12),
  compute: z.string().max(500).optional(),
  result: z.object({ label: z.string().max(80), unit: z.string().max(16).optional(),
                     precision: z.number().int().min(0).max(10).default(2) }),
  calculatorBinding: z.object({ type: z.string().max(60), map: z.record(z.string()) }).optional()
}).superRefine((c, ctx) => {
  // 1) KaTeX compiles (as §C.6). 2) `compute` parses under the sandbox grammar and references only
  //    declared `variables[].sym` + allowlisted fns. 3) unique syms. 4) if calculatorBinding present,
  //    `type` ∈ {compound-interest,retirement,loan,sip} and `map` keys are valid endpoint inputs.
})
```
4. **Render & compute model — two paths:**
   - **Inline expression (`compute`):** evaluated in a **sandboxed expression evaluator — never `eval`/`Function`**.
     Use an AST-based evaluator ([`expr-eval`]/`mathjs` in restricted mode) with an **allowlist** of operators
     (`+ - * / ^ ()`), functions (`pow, sqrt, ln, log, exp, abs, min, max, round`), and the declared symbols
     only. No member access, no globals, no `Math` object, no strings, no loops; numeric inputs are clamped to
     `min/max`; result is the bound `result` formatting. The same sandbox runs **client-side** (live as the
     reader drags sliders) **and** is re-validated **server-side at save** (gate 4) so a broken expr never ships.
   - **Platform-calculator binding (`calculatorBinding`):** the reader's inputs are POSTed to the **real**
     `imperialpedia-service` endpoint — `POST /v1/calculators/{type}` (`compound-interest|retirement|loan|sip`,
     see `controller/calculatorController.js`) — using `map` to translate `{P,r,t,n}` → `{principal,rate,years,frequency}`.
     This reuses the authoritative server math + amortization schedule + optional history save, and lets the
     block render a full schedule chart, not just a scalar. Binding is preferred for the 4 supported families;
     `compute` covers the long tail.
   KaTeX renders the equation server-side; the calculator hydrates client-side (progressive — static equation
   + result for no-JS / SSR / SEO).
5. **Storage/security:** stored = LaTeX + variable specs + the **expression string** (not executable code).
   The sandbox's allowlist is the security boundary; the server **re-parses and rejects** any expr referencing
   undeclared symbols or non-allowlisted tokens on save, so stored exprs are provably safe before any reader
   runs them. Binding calls are unauthenticated public calculator endpoints (rate-limited at the gateway);
   no secrets, no PII unless the reader is logged in and opts to save history.

### C.8 Chart

1. **UX / slash:** `/chart` (`graph`, `📊`). Inspector: chart type (`line|bar|area|pie|scatter|candlestick`),
   data source (**inline** table editor, **CSV paste**, or **dataRef** to a market_asset / calculator series
   from imperialpedia-service), axes labels, series colors (from the design tokens, not free hex), `source`
   attribution + `asOf` date (required for financial data — provenance).
2. **Content + example:**
```json
{ "id": "cht_Rk20", "type": "chart", "order": 7,
  "content": { "chartType": "line",
    "series": [ { "name":"$1,000 @ 7%/mo",
      "points": [ {"x":0,"y":1000},{"x":10,"y":2009},{"x":20,"y":4038},{"x":30,"y":8117} ] } ],
    "axes": { "x":{"label":"Year"}, "y":{"label":"Balance (USD)","format":"currency"} },
    "dataRef": null, "source": "Imperialpedia compound-interest calculator", "asOf": "2026-06-04" } }
```
   `dataRef` variant: `{ "dataRef": { "kind":"asset","assetId":"AAPL","metric":"close","range":"1Y" }, "series":[] }`.
3. **Zod:**
```ts
z.object({
  chartType: z.enum(['line','bar','area','pie','scatter','candlestick']),
  series: z.array(z.object({ name: z.string().max(120),
    points: z.array(z.object({ x: z.union([z.number(), z.string()]), y: z.number(),
      open: z.number().optional(), high: z.number().optional(), low: z.number().optional(), close: z.number().optional() })).max(2000)
  })).max(12),
  axes: z.object({ x: z.object({ label: z.string().max(80).optional() }),
                   y: z.object({ label: z.string().max(80).optional(),
                                 format: z.enum(['number','currency','percent']).default('number') }) }),
  dataRef: z.object({ kind: z.enum(['asset','calculator','dataset']), assetId: z.string().optional(),
                      metric: z.string().optional(), range: z.string().optional() }).nullable().optional(),
  source: z.string().min(1).max(200),   // required — provenance, non-empty for financial content
  asOf: z.string().date().optional()    // required when dataRef.kind==='asset' (freshness)
})
```
4. **Render:** **server-rendered static SVG** (deterministic, SEO/crawlable, zero CLS) that **hydrates** into
   an interactive chart (hover tooltips, legend toggle) on the client. `dataRef` series are resolved at
   render time from imperialpedia-service (cached via `@baalvion/cache`) so charts stay current; inline series
   render as-is. Includes an accessible `<table>` fallback (the data) behind a "View data" disclosure and an
   `aria-label` summary. Source/`asOf` rendered as a caption.
5. **Storage/security:** inline points are numbers only (no expressions). `dataRef` resolution is **read-only**
   and tenant-scoped; a `dataRef` to an asset the tenant can't see returns an empty series + a "data
   unavailable" caption rather than leaking existence. Colors come from tokens (no arbitrary CSS injection).

### C.9 FAQ

1. **UX / slash:** `/faq` (`accordion`, `q&a`). An editable list of Q/A pairs; each answer is a mini
   ProseMirror (bold/link/inline-math). Reorder via drag. AI "generate FAQ from article" proposes pairs
   ([05](../05-analytics-monetization-ai.md)) — author confirms each.
2. **Content + example:**
```json
{ "id": "faq_Wq8", "type": "faq", "order": 8,
  "content": { "items": [
    { "q": "Is compound interest better than simple interest?",
      "a": "<p>Yes — it earns interest on prior interest, so it grows faster over time.</p>" },
    { "q": "How often should interest compound?",
      "a": "<p>More frequent compounding yields slightly more; daily &gt; monthly &gt; annually.</p>" } ] } }
```
3. **Zod:**
```ts
z.object({ items: z.array(z.object({
  q: z.string().min(3).max(300),
  a: z.string().min(1).max(5000)       // sanitized HTML (§B.7) after validation
})).min(1).max(50) })
```
   Mirrors the `faq` content-type `custom_fields.questions` schema ([02 §B.1](../02-content-cms.md)) so an FAQ
   *block* and an FAQ *page* share validation.
4. **Render:** semantic `<dl>`/accordion (`<details>`/`<summary>` for no-JS), each answer sanitized. **Emits
   `FAQPage` JSON-LD** ([03](../03-seo-and-media.md)) — high-value rich-result surface; only published FAQ
   blocks contribute to the page's structured data.
5. **Storage/security:** answers sanitized at write + render; `q` is plain text. Dedupe identical questions
   (warn). Schema markup is generated from the **sanitized** answer text (no markup leaks into JSON-LD).

### C.10 Callout

1. **UX / slash:** `/callout` (`note`, `tip`, `warning`, `▦`). Variant picker:
   `info | tip | warning | risk | key-takeaway`. Body is mini ProseMirror.
2. **Content + example:**
```json
{ "id": "cal_Nm3", "type": "callout", "order": 9,
  "content": { "variant": "key-takeaway",
    "html": "<p>The earlier you start, the more time compounding has to work. A 10-year head start can double your final balance.</p>" } }
```
3. **Zod:**
```ts
z.object({ variant: z.enum(['info','tip','warning','risk','key-takeaway']),
           html: z.string().min(1).max(8000) })   // sanitized after validation
```
4. **Render:** a colored card with an icon per variant, `role="note"` (`role="alert"` for `risk`/`warning`),
   tokenized colors (semantic, not decorative). `key-takeaway` callouts are harvested into the page's
   "Key takeaways" summary box and may seed the meta description.
5. **Storage/security:** body sanitized at write + render. Variant is a closed enum (no arbitrary class →
   no CSS injection). `risk` variant on financial content is a **signal** (not a substitute) for the
   mandatory Financial Disclosure (§C.12).

### C.11 References

The numbered bibliography. Backed by the **shared** `imperialpedia.references` + `term_references` store
([02 §E.1](../02-content-cms.md)) so an article's citations and a glossary term's references are one corpus.

1. **UX / slash:** `/references` (`bibliography`, `cite-list`, `❡`). Usually **one per document**, placed
   last. The author adds references via a picker (search existing `references`, or "add new" → CSL-JSON form:
   title, authors, kind, url, accessed date). In-body, an author drops a **citation marker** (an inline
   `reference` mark in a paragraph: `data-ref="{refId}"`) which auto-numbers and back-links to this block.
2. **Content + example:**
```json
{ "id": "ref_End1", "type": "reference", "order": 20,
  "content": { "refIds": [ "11aa...uuid", "22bb...uuid" ], "style": "numeric", "title": "References" } }
```
   (The block references rows in `imperialpedia.references`; it does **not** inline the citation data, so a
   source corrected once updates everywhere.)
3. **Zod:**
```ts
z.object({ refIds: z.array(z.string().uuid()).min(1).max(200),
           style: z.enum(['numeric','author-date']).default('numeric'),
           title: z.string().max(120).default('References') })
  // server gate ([02 §B.1] gate 3): every refId must resolve to an imperialpedia.references row — no dangling cites.
```
4. **Render:** an `<ol>` of formatted references with stable numbering matching in-body markers; each entry
   carries COinS + a backlink to its first in-body mention. Numbering is **render-time stable** (derived from
   order of first mention, not array order). Emits `citation`/`Citation` schema where applicable.
5. **Storage/security:** the block stores only `refIds` (FK-like into `references`); CSL-JSON + URLs live in
   `imperialpedia.references` and are tenant-scoped/sanitized there. A deleted reference still in use blocks
   the delete (or is flagged dangling on the submit gate), preventing broken bibliographies.

### C.12 Financial Disclosure (mandatory on financial content at publish)

The compliance block. **Required** on any content flagged financial (types `financial_term`, `article`/`news`
with `tickers[]`, anything with a `finmath`/`chart[dataRef=asset]` block) before it can reach `published`.

1. **UX / slash:** `/disclosure` (`risk`, `disclaimer`, `§`; group Compliance). The author picks a **template**
   (`general-not-advice | investment-risk | affiliate | sponsored | forward-looking`) from a managed library;
   the body is **pre-filled and locked to template text** by default. Editing the body beyond a template
   requires `content:legal_review` (Legal Reviewer) — authors/editors can select a template and fill the
   merge fields (e.g. affiliate partner), not rewrite legal language. The editor **auto-inserts** a
   `general-not-advice` disclosure when a financial signal is first added, and the **submit/publish gate**
   hard-blocks if a financial document lacks a disclosure (see below).
2. **Content + example:**
```json
{ "id": "dsc_Z9", "type": "disclosure", "order": 21,
  "content": { "template": "investment-risk", "templateVersion": 3, "locked": true,
    "fields": { "asOf": "2026-06-04" },
    "html": "<p><strong>Not investment advice.</strong> This material is for educational purposes only. Investing involves risk, including possible loss of principal. Past performance does not guarantee future results.</p>",
    "approvedBy": 4021, "approvedAt": "2026-06-04T11:02:00Z" } }
```
3. **Zod:**
```ts
z.object({
  template: z.enum(['general-not-advice','investment-risk','affiliate','sponsored','forward-looking']),
  templateVersion: z.number().int().positive(),
  locked: z.boolean().default(true),
  fields: z.record(z.string().max(300)).default({}),
  html: z.string().min(20).max(6000),                 // sanitized; on locked=true must equal rendered template
  approvedBy: z.number().int().optional(), approvedAt: z.string().datetime().optional()
}).superRefine((c, ctx) => {
  // if locked: html must match the stored template@templateVersion rendered with `fields` (no silent edits).
  // unlocking (locked=false / custom html) requires content:legal_review — enforced at the API, asserted here.
})
```
4. **Render:** a visually distinct `role="note"` compliance card, always rendered (cannot be `noindex`-hidden),
   placed by policy near the top (forward-looking/sponsored) or in the footer (general). Sponsored/affiliate
   disclosures additionally emit the FTC-style `Sponsored`/`disclosure` markup and pair with monetization
   tagging ([05 §Monetization](../05-analytics-monetization-ai.md)).
5. **Storage/security & the publish gate:**
   - Stored with `template`, `templateVersion`, and `approvedBy/At` so audit-service can prove **which legal
     text version** shipped (WORM hash-chain, [06](../06-security-database-api.md)).
   - **Publish gate (server, on `submit_for_review`→`published`):** if the document is financial and has **no**
     `disclosure` block → **hard block** (`DISCLOSURE_REQUIRED`). If a non-template (`locked:false`) disclosure
     exists without a Legal Review approval → **hard block** → route to Legal Review Queue ([04](../04-rbac-and-workflow.md)).
   - Template library is admin/legal-managed; bumping a template version flags affected published pages for
     re-review rather than silently changing live legal text.

---

## D. Editor wireframe with right-rail inspector

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Back   Understanding Compound Interest        ◌ Draft · v17   Autosaved 14:32   👥3   [⋯]     │
├──────────────────────────────────────────────────────────────────┬────────────────────────────┤
│  Title  Understanding Compound Interest                           │  INSPECTOR                  │
│  Slug   understanding-compound-interest                  [edit]   │  ┌─[Block ▾][SEO][Comments]─┐│
│ ┌──────────────────────────────────────────────────────────────┐ │  │ [Versions]               ││
│ │ ⠿ H2   How compound interest works                  💬2       │ │  ├─ BLOCK: finmath ────────┤│
│ │ ⠿ ¶    Compound interest is interest on interest…             │ │  │ LaTeX  A=P(1+r/n)^{nt}   ││
│ │ ⠿ ⨏    finmath  A = P(1 + r/n)^{nt}     [Test ▸]   🔒A.Rao    │ │  │ Variables  P,r,n,t  [+]  ││
│ │ ⠿ ▦    callout(key-takeaway): The earlier you start…         │ │  │ Compute  P*pow(1+(r/100…││
│ │ ⠿ 📊   chart(line): Growth of $1,000 over 30y                 │ │  │ Binding  compound-interest││
│ │ ⠿ ⊞    table: Final balance by frequency                     │ │  │ Result   Final amount $  ││
│ │ ⠿ ?    faq: 2 questions                                       │ │  │ ▸ Test: P1000 r7 n12 t30 ││
│ │ ⠿ §    disclosure(investment-risk)  🔒 legal-locked  ✓ appr   │ │  │   = $8,116.50            ││
│ │ ⠿ ❡    references: 4 sources                                  │ │  └──────────────────────────┘│
│ │   + type "/" for a block …                                    │ │  ┌─ SEO  ▰▰▰▰▱ 78 ─────────┐ │
│ │ [ /  Heading · Table · Image · Chart · Math · finmath · FAQ ] │ │  │ ✓ title  ✓ meta-desc     │ │
│ └──────────────────────────────────────────────────────────────┘ │  │ ⚠ alt missing (1 image)  │ │
│  Outline (TOC):  How compound interest works › Worked example     │  │ ✓ internal links 4       │ │
│                                                                   │  │ ✓ disclosure present     │ │
│                                                                   │  └──────────────────────────┘│
├──────────────────────────────────────────────────────────────────┴────────────────────────────┤
│  [ Save draft ]   [ Preview ]   [ Submit for review ▸ ]            👥 A.Rao  M.Khan  (you)        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Inspector tabs:** **Block** (context-sensitive props for the focused block — the panel above shows finmath),
**SEO** (live score + per-rule checklist, mirrors [03](../03-seo-and-media.md); the "disclosure present" row
is the §C.12 gate surfaced early), **Comments** (threads per block id, §B.4), **Versions** (revision list →
restore, §B.3). Top bar: workflow status + revision number, live autosave indicator, co-editor presence
count (`👥3`), and `[⋯]` (duplicate, export, move, delete — each `rbac`-gated).

---

## E. Cross-references (do not duplicate here)

| Concern | Authoritative spec |
|---------|--------------------|
| Content types, palette per type, content-type custom_fields, list UX | [02 §B–§C](../02-content-cms.md) |
| Block palette table, finmath rationale, sanitization policy | [02 §D](../02-content-cms.md) |
| Media picker, CDN srcset, alt/SEO scoring, internal linking, JSON-LD | [03-seo-and-media.md](../03-seo-and-media.md) |
| Workflow states, who-can-publish, Legal Review Queue, comment→review loop | [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) |
| AI inline (improve/summarize/FAQ/link), disclosure/monetization tagging | [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md) |
| Revisions/audit/WORM, references table, security headers, CSP | [06-security-database-api.md](../06-security-database-api.md) |
| Glossary term ↔ `financial_term` page, references corpus | [02 §E](../02-content-cms.md) |

**Capabilities referenced** (canonical vocabulary): `content:create`, `content:edit.own`, `content:edit.any`,
`content:submit`, `content:review`, `content:legal_review`, `content:publish`, `content:rollback`,
`media:upload`, `seo:metadata`, `glossary:edit`, `references:manage`, `ai:use`, `system:settings`.
All editor mutations are RS256-authed and authorized via `rbac-service` `/v1/authorize` (deny-overrides).
```
