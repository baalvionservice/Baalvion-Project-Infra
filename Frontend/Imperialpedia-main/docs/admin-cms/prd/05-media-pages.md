# 05 — Media Management (Admin Pages PRD)

> **Section:** Media management — the digital-asset spine for every editorial surface (Articles,
> Encyclopedia, Glossary, Guides, News). **Lens:** Lead Product Architect + Senior UI/UX Engineer.
> **Status:** Page-level PRD, grounded in [`03-seo-and-media.md` §B](../03-seo-and-media.md) (architecture
> of record), the real `media` schema, `cms.cms_media_references`, and the canonical RBAC matrix in
> [`04-rbac-and-workflow.md` §A.2](../04-rbac-and-workflow.md).

This section specifies the four admin pages that let editorial staff find, upload, organize, and govern
binary assets: the **Media Library** (`/admin/media`), **Uploads** (`/admin/media/uploads`), **Folders**
management (`/admin/media/folders`), and the **Asset Detail** drawer/page. Originals live in object storage
(S3/R2); the **NEW media-service** (`media` schema) owns metadata, presigned-upload orchestration,
derivative variants, and CDN URLs — it is a standalone bounded context so Amarise and other brands reuse it.
All assets are tenant-scoped via `@baalvion/tenancy` RLS; all mutations are RS256-authed and authorized
through `rbac-service /v1/authorize`. The UI hides/disables actions from the `GET /me/permissions`
capability list, but the server stays the authority.

**Shared facts referenced by every page below (defined once here):**

- **Envelope:** every REST call returns `{ success, data, error, meta:{ total, page, limit } }` under `/v1`.
- **Dedupe:** `media.assets` has a unique index `media_assets_checksum_org (org_id, checksum)` — re-uploading
  the same bytes resolves to the existing asset rather than creating a duplicate.
- **Usage links:** `cms.cms_media_references (content_id, media_id, usage_type)` is the single source of
  truth for "where is this asset used"; media-service reads it read-only to compute usage counts.
- **Canonical media capabilities** (from the capability vocabulary): `media:upload`, `media:edit`,
  `media:delete`. SEO/alt-text gating cross-references [`03-seo-and-media.md` §A.2 / §B.3](../03-seo-and-media.md).
- **Role access for media (from the §A.2 matrix):** *upload* = Super Admin, Admin, Managing Editor, Editor,
  SEO Manager, Author, Contributor (✓); Moderator ✗ (no `media:upload`). *delete* = Super Admin, Admin,
  Managing Editor (✓), Editor within scope **S**; SEO Manager, Author, Contributor, Moderator ✗. *edit
  metadata* (alt/caption/credit/tags) follows `media:edit` = any role that can upload may edit metadata on
  assets within its scope; Contributor may edit metadata only on assets it uploaded.

---

## Page 1 — Media Library

### Purpose

The default landing surface for digital-asset management: a fast, filterable grid/list of every asset the
current user is authorized to see, with at-a-glance **alt-text health**, **usage counts**, and **license
status** so editors can find the right image and spot governance gaps (missing alt text, unlicensed stock,
orphaned files) before they reach publish. This is the most-used media page and the entry point to Uploads,
Folders, and Asset Detail.

### Route

`/admin/media` (existing scaffolded route — REUSE; currently mock-backed, to be wired to media-service).

### Components

- `MediaLibraryHeader` — title + primary **Upload** button (routes to `/admin/media/uploads`) + view toggle
  (`grid` | `list`).
- `MediaFilterBar` — `kind` select (image/video/audio/doc/other), `folder` tree-select, `tag`
  multi-select, `license` select (CC-BY / owned / stock-licensed / unknown), `alt-text status` select
  (has-alt / missing-alt / n-a), free-text search (filename/alt/caption), sort (newest/oldest/largest).
- `MediaGrid` / `MediaList` — virtualized (windowed) tiles; each tile shows thumbnail (LQIP via
  `dominant_color`/`blurhash`), filename, kind badge, `bytes`, and two status chips: **alt** (green=set,
  amber=missing for images) and **usage** ("used in N").
- `AssetTile` with hover `DropdownMenu` (Open detail · Copy CDN URL · Replace · Download · Delete).
- `UsagePanel` (right rail, opens on selection) — lists referencing content from `cms_media_references`
  with deep links to `/admin/content/[slug]/edit`.
- `BulkActionBar` (appears on multi-select) — move to folder, add/remove tags, bulk alt-text editor, delete
  (delete disabled unless `media:delete` in scope).
- `Pagination` (server-driven via `meta`); `MediaEmptyState`, `MediaErrorState`, `MediaSkeletonGrid`.

### Permissions required

- **View:** rank ≥ `editor` enters `/admin/*`; Authors/Contributors reach a scoped subset of the library
  (their own + assigned-folder assets). Capability: implicit `media:upload` holders can read the library;
  list results are RLS- and scope-filtered server-side.
- **Bulk metadata edit:** `media:edit` — Super Admin, Admin, Managing Editor, Editor (scope **S**), SEO
  Manager, Author (own), Contributor (own).
- **Delete:** `media:delete` — Super Admin, Admin, Managing Editor (✓); Editor scope **S**; SEO Manager,
  Author, Contributor, Moderator denied. Step-up auth required when deleting a referenced asset (see edge
  cases). Moderator has no media access at all.

### API endpoints used

- `GET /v1/media?folder=&kind=&q=&tag=&license=&altStatus=&page=&limit=&sort=` — paginated list (envelope
  `meta` carries total/page/limit).
- `GET /v1/media/:id` — single asset hydrate for the detail rail (usage counts joined from
  `cms_media_references`).
- `PATCH /v1/media/:id` — inline alt/caption/tags edit and bulk metadata (one call per asset or a
  batch wrapper).
- `DELETE /v1/media/:id` — soft delete (blocked when references exist unless step-up + force).
- `GET /v1/media/folders` — folder tree for the filter tree-select.

### Database tables affected

- `media.assets` (read; `PATCH`/soft-`DELETE` on mutate) — schema `media`.
- `media.folders` (read for filter tree) — schema `media`.
- `cms.cms_media_references` (read-only, for usage counts/panel) — schema `cms`.

### Wireframe

```
┌─ Media Library ───────────────────────────────────  [ ▦ Grid │ ☰ List ]  [ ⬆ Upload ]─┐
│ ┌─ Filters ──────────────────────────────────────────────────────────────────────────┐ │
│ │ [🔍 search filename/alt/caption] [Kind ▾] [Folder ▾] [Tag ▾] [License ▾] [Alt ▾] [↕] │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────── Usage ───────────────────────────┐ │
│ │ [img LQIP]│ │ [img LQIP]│ │ [▶ video] │ │ chart-sp500.avif                          │ │
│ │ IMG  244KB│ │ IMG  88KB │ │ MP4  12MB │ │ alt: ✓  license: CC-BY  1440×810          │ │
│ │ alt ✓ ·3  │ │ alt ⚠ ·0  │ │ alt n/a ·1│ │ Used in 3 ▸                               │ │
│ └───────────┘ └───────────┘ └───────────┘ │  • S&P 500 Index Explained  /content/...   │ │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ │  • Bear Market Guide        /content/...   │ │
│ │ [img LQIP]│ │ [doc PDF] │ │ [img LQIP]│ │  • Investing 101 (featured) /content/...   │ │
│ └───────────┘ └───────────┘ └───────────┘ └────────────────────────────────────────────┘ │
│ [ ◀ Prev ]   Showing 1–24 of 1,182                                       [ Next ▶ ]      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states

- **Loading:** `MediaSkeletonGrid` (shimmer tiles matching grid density); filter bar stays interactive but
  disabled while first page loads.
- **Empty (no assets):** illustrated empty state with a primary **Upload your first asset** CTA →
  `/admin/media/uploads`.
- **Empty (filtered):** "No media matches these filters" + **Clear filters** action (does not lose folder
  context).
- **Error:** non-blocking banner "Couldn't load media" + **Retry**; if media-service is down (503), show a
  degraded notice and keep cached results from `@baalvion/cache` where available.

### Key edge cases

- **Delete of a referenced asset:** `DELETE` returns `409 { error: 'asset_in_use', meta:{ references:N } }`;
  the UI surfaces the referencing content list and requires explicit "delete anyway" + step-up auth (asset
  is soft-deleted; GC job, [`03-seo-and-media.md` §B.4](../03-seo-and-media.md), later sweeps unreferenced).
- **Missing alt on a publish-bound image:** alt-status chip is amber; cross-references the SEO publish gate —
  images used as `featured_image`/`block_image` cannot pass publish without alt (enforced in content
  workflow, surfaced here for triage).
- **Cross-tenant isolation:** RLS guarantees a user never sees another brand's assets even via direct
  `:id` access (returns `404`, not `403`, to avoid existence leakage).
- **Large folders:** list is virtualized + server-paginated; no full-folder client fetch.

---

## Page 2 — Uploads

### Purpose

A focused, drag-and-drop bulk ingestion surface that uploads many files in parallel **directly to object
storage via presigned PUT URLs** (bytes never transit the API), then finalizes metadata. It de-duplicates by
checksum, shows per-file progress, lets the user assign a destination folder and tags up front, and
optionally runs **AI auto-tag + alt-text suggestion** (vision model, human-confirmed). This page exists so a
single editor can onboard a batch of charts/figures in seconds without blocking on server round-trips.

### Route

`/admin/media/uploads` (NEW subroute — no existing scaffold fits; the Library "Upload" button targets it).

### Components

- `UploadDropzone` — drag-drop + file picker; accepts images/video/audio/doc; client-side guards
  (max size, mime allowlist) before requesting presigns.
- `UploadDestinationBar` — folder picker (`media.folders` tree), default-tags input, license selector,
  "Run AI auto-tag/alt" toggle (requires `ai:use`).
- `UploadQueue` — one `UploadRow` per file: thumbnail, filename, size, progress bar, state badge
  (queued/hashing/uploading/finalizing/done/duplicate/error), cancel/retry.
- `DedupeNotice` — when a checksum matches an existing asset, the row flips to **Duplicate → reused** with a
  link to the existing asset (no new row in `media.assets`).
- `AutoTagPreview` — AI-suggested tags + alt text per finished image, each **accept/reject** (never
  auto-applied silently); confirmed values flow into the finalize `PATCH`.
- `UploadSummary` — counts (uploaded / reused / failed) + **Go to Library** and **Upload more** actions.

### Permissions required

- **Upload:** `media:upload` — Super Admin, Admin, Managing Editor, Editor, SEO Manager, Author,
  Contributor (✓). Moderator denied. Contributor uploads are still subject to review when attached to
  content (no publish power), but the asset itself uploads fine.
- **AI auto-tag/alt:** `ai:use` — gated separately; the toggle is hidden/disabled without it. Cross-ref the
  AI section ([`05-analytics-monetization-ai.md` §11](../05-analytics-monetization-ai.md)) for model config.
- **Folder write / tagging at upload:** `media:edit` for the chosen destination folder scope.

### API endpoints used

- `POST /v1/media/presign` — body `{ filename, mime, bytes, checksum }`; returns
  `{ uploadUrl, storageKey, assetDraftId }` (or `{ duplicateOf }` when checksum already exists per tenant).
- `PUT {uploadUrl}` — direct-to-storage PUT (S3/R2); not an API route, no auth header beyond the signed URL.
- `POST /v1/media` (finalize) — body `{ storageKey, folderId, tags, license, alt, caption, credit }`;
  creates/activates the `media.assets` row, kicks variant generation.
- `PATCH /v1/media/:id` — apply accepted AI alt/tags after async suggestion completes.
- `GET /v1/media/folders` — destination folder tree.

### Database tables affected

- `media.assets` (insert on finalize; checksum dedupe lookup) — schema `media`.
- `media.folders` (read for destination) — schema `media`.
- (No `cms.cms_media_references` write here — references are created later when an asset is attached to
  content in the block editor.)

### Wireframe

```
┌─ Upload Media ─────────────────────────────────────────────────────────────────────────┐
│ Destination: [📁 /investing/charts ▾]   Tags: [equities ×][2024 ×][+]   License:[owned ▾]│
│ AI auto-tag & alt: ( ●○ on )  — suggestions require confirmation                         │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                         ⬆  Drag files here or click to browse                         │ │
│ │                     images · video · audio · pdf  (max 200MB/file)                    │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ Queue (4)                                                       uploaded 2 · reused 1 · err 1│
│  ▸ chart-sp500.png      2.1MB  ▰▰▰▰▰▰▰▰▰▰ 100% ✓ done    AI: alt "S&P 500 line chart"[✓][✗]│
│  ▸ figure-cpi.svg        88KB  ▰▰▰▰▰▰▰▰▰▰ 100% ⟳ reused → existing asset                  │
│  ▸ webinar-q3.mp4         12MB ▰▰▰▰▱▱▱▱▱▱  41% ⬆ uploading                  [ cancel ]    │
│  ▸ scan.tiff             6.4MB  ✗ unsupported type                          [ remove ]    │
│                                                       [ Upload more ]   [ Go to Library ▸]│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states

- **Empty (no files queued):** large dropzone is the empty state; copy lists accepted types + size cap.
- **Loading/in-flight:** per-row progress; the page warns on navigation away while uploads are active
  (`beforeunload`).
- **Error (presign denied):** row shows `403`/quota message; retry available. **Error (PUT to storage
  failed):** automatic retry with backoff, then manual retry; the draft row never becomes a live asset until
  finalize succeeds (no orphaned half-uploads in `media.assets`).
- **AI timeout/unavailable:** suggestions silently skipped (asset still uploads); a small "AI suggestions
  unavailable" note appears — alt/tags can be added later in Asset Detail.

### Key edge cases

- **Checksum dedupe race:** two concurrent uploads of identical bytes — presign returns `duplicateOf` for
  the second; the unique index `(org_id, checksum)` is the backstop.
- **Multipart for large video:** files over the single-PUT threshold use multipart presigned parts; the row
  aggregates part progress.
- **Mime spoofing:** server re-validates mime/magic-bytes at finalize; a mismatch rejects the asset even if
  the client allowed it.
- **Partial batch:** failed rows don't block successful ones; summary reports mixed outcomes.

---

## Page 3 — Folders management

### Purpose

Organize the asset tree: create, rename, move, and delete folders backed by `media.folders`
(materialized-path). Moving or renaming a folder re-paths its children atomically; folder-level access
follows RBAC scopes so a category-scoped Editor only manages folders within their remit. Keeps a 100M-scale
library navigable instead of one flat bucket.

### Route

`/admin/media/folders` (NEW subroute; also embedded as the tree-select used by Library and Uploads).

### Components

- `FolderTree` — recursive expandable tree from the materialized `path`; shows per-folder asset count and
  child count.
- `FolderToolbar` — **New folder**, **Rename**, **Move** (drag-drop or modal), **Delete**.
- `NewFolderDialog` / `RenameFolderDialog` — name validation (no slashes, dedupe per parent).
- `MoveFolderDialog` — destination picker with cycle-prevention (cannot move a folder into its own subtree).
- `DeleteFolderDialog` — guarded: choose **move children to parent** vs **block if non-empty**; never
  cascades a hard delete of referenced assets.
- `FolderBreadcrumb` — current path; `FolderEmptyState` / error inline alerts.

### Permissions required

- **Read tree:** any `media:upload` holder (to choose destinations).
- **Create / rename / move:** `media:edit` (and `taxonomy:manage`-adjacent organizational right) — Super
  Admin, Admin, Managing Editor (✓); Editor within scope **S** (only folders under assigned categories);
  SEO Manager, Author, Contributor, Moderator denied folder mutation.
- **Delete folder:** `media:delete` semantics — Super Admin, Admin, Managing Editor; Editor scope **S**.
  Deleting a folder never deletes referenced assets; on delete, child assets re-home to the parent folder
  (`folder_id` SET to parent / NULL).

### API endpoints used

- `GET /v1/media/folders` — full tree (or `?parent=` for lazy load of large trees).
- `POST /v1/media/folders` — body `{ name, parentId }` → creates row, computes `path`.
- `PATCH /v1/media/folders/:id` — rename and/or move (`{ name?, parentId? }`); re-paths descendants.
- `DELETE /v1/media/folders/:id?strategy=reparent|block` — delete with children policy.

### Database tables affected

- `media.folders` (insert/update/delete; `path` re-materialization on move/rename) — schema `media`.
- `media.assets` (bulk `folder_id` update on folder delete-reparent; `ON DELETE SET NULL` FK as a backstop)
  — schema `media`.

### Empty / Loading / Error states

- **Loading:** tree skeleton; expand triggers per-node lazy spinner for deep trees.
- **Empty:** "No folders yet — assets live at the root" + **New folder** CTA.
- **Error (move cycle):** dialog blocks with "Can't move a folder into itself or a descendant".
- **Error (delete non-empty + block strategy):** "Folder has N assets — choose to move them to the parent
  first" with a one-click switch to the reparent strategy.

### Key edge cases

- **Deep re-path performance:** rename/move of a high node updates many descendant `path` values in a single
  transaction; UI shows a brief "reorganizing N items" state.
- **Concurrent edits:** optimistic-concurrency on `PATCH` (reject stale `updated_at`) to avoid clobbering a
  parallel rename.
- **Scope leakage:** a scoped Editor cannot move a folder out of their assigned subtree into an unscoped
  branch (server rejects with `403`).

---

## Page 4 — Asset Detail

### Purpose

The single-asset workbench: edit governance metadata (**alt text, caption, credit, license**), inspect
generated **variants** and technical attributes (dimensions, mime, bytes, checksum, blurhash), and see the
full **usage map** (every content item referencing the asset, by `usage_type`). This is where alt-text
debt is paid down and license/attribution is recorded before publish.

### Route

`/admin/media/[id]` (NEW dynamic subroute) — also rendered as a slide-over drawer from the Library grid for
quick edits without navigation.

### Components

- `AssetPreview` — large preview (image/video/audio player/doc icon) with LQIP placeholder; **Replace
  file** action (re-presign + finalize, preserving the row + references).
- `AssetMetaForm` — `alt_text` (with char counter + AI-suggest button), `caption`, `credit`,
  `license` select; dirty-state save/cancel; **alt required** indicator when the asset is used as a
  `featured_image`/`block_image`.
- `AssetTechPanel` — read-only: `mime`, `bytes`, `width`/`height`/`duration_ms`, `checksum`, `dominant_color`,
  `blurhash`, `storage_key` (CDN URL copy).
- `VariantsList` — derivative table from `assets.variants` (`{w,h,format,key}`) with per-variant CDN URL.
- `TagEditor` — add/remove tags (`assets.tags` JSONB).
- `UsageMap` — table from `cms_media_references`: referencing content title, `usage_type`
  (featured_image/block_image/block_video/gallery/attachment), deep link to the content editor.
- `AssetDangerZone` — **Delete asset** (guarded by references + `media:delete` + step-up).
- `AuditTrail` (compact) — recent metadata changes (sourced from `audit-service` events).

### Permissions required

- **View:** any user authorized to see the asset in the Library (RLS + scope).
- **Edit metadata (alt/caption/credit/license/tags) + Replace file:** `media:edit` — Super Admin, Admin,
  Managing Editor, Editor (scope **S**), SEO Manager, Author (own assets), Contributor (own assets only).
- **AI alt suggestion:** `ai:use`.
- **Delete:** `media:delete` — Super Admin, Admin, Managing Editor (✓); Editor scope **S**; step-up auth on
  referenced assets. SEO Manager, Author, Contributor, Moderator denied.

### API endpoints used

- `GET /v1/media/:id` — full asset incl. variants + joined usage from `cms_media_references`.
- `PATCH /v1/media/:id` — body `{ alt?, caption?, credit?, license?, tags?, folderId? }`.
- `POST /v1/media/presign` + `POST /v1/media` — **Replace file** flow (new bytes, same asset id/references).
- `DELETE /v1/media/:id?force=` — delete (force + step-up when referenced).
- `GET /v1/media/:id/usage` (alias / convenience over the joined `usage` field) — referencing content list.

### Database tables affected

- `media.assets` (read; `PATCH` on metadata; `storage_key`/`variants` update on replace; soft-`DELETE`) —
  schema `media`.
- `cms.cms_media_references` (read-only usage map; rows are managed by the content editor, not here) —
  schema `cms`.
- `media.folders` (read for folder reassignment) — schema `media`.

### Wireframe

```
┌─ Asset · chart-sp500.avif ─────────────────────────────────────────────  [ Replace ][ ⋯ ]┐
│ ┌─────────────────────────────┐  ┌─ Metadata ─────────────────────────────────────────┐  │
│ │                             │  │ Alt text *  [ S&P 500 index, 5-yr line chart      ] │  │
│ │      [ image preview ]      │  │             52/125 · required (used as featured)    │  │
│ │        1440 × 810           │  │ Caption     [ Source: FRED, monthly close          ] │  │
│ │                             │  │ Credit      [ © Imperialpedia / FRED               ] │  │
│ └─────────────────────────────┘  │ License     [ owned ▾ ]   Tags [equities ×][+]      │  │
│ Tech: AVIF · 244KB · sha256 1f3… │  │                          [✨ Suggest alt (AI)]     │  │
│ Variants: 320w·640w·1024w·1440w  │  │            [ Cancel ]            [ Save changes ] │  │
│ ────────────────────────────────  └──────────────────────────────────────────────────┘  │
│ Used in 3                                                                                 │
│  • S&P 500 Index Explained        featured_image   ▸ /admin/content/sp500-explained/edit │
│  • Bear Market Guide              block_image       ▸ /admin/content/bear-market/edit     │
│  • Investing 101                  gallery           ▸ /admin/content/investing-101/edit   │
│ ── Danger zone ──  [ Delete asset ]  (blocked while referenced — requires step-up)        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states

- **Loading:** preview + form skeletons; tech panel and usage map load progressively.
- **Empty usage:** "Not used in any content yet — safe to delete" (delete enabled without force).
- **Error (save conflict):** optimistic-concurrency reject → "This asset changed since you opened it.
  Reload to see the latest." with a reload action.
- **Error (variant generation pending):** variants list shows "Generating derivatives…" with a poll; the
  original is always usable meanwhile.

### Key edge cases

- **Replace file keeps references:** the row id and all `cms_media_references` survive a replace, so embedded
  content updates everywhere at once; checksum + variants regenerate; old `storage_key` is GC-eligible.
- **Alt required gate:** for images referenced as `featured_image`/`block_image`, saving with empty `alt_text`
  warns and the content remains publish-blocked (gate lives in the content workflow; surfaced here).
- **License missing on stock asset:** a non-`owned` asset without `credit` is flagged amber; the public
  figure caption renders `credit` when present (governance from §B.4).
- **Soft delete vs hard delete:** delete soft-marks the asset; a referenced asset can only be removed with
  force + step-up; truly unreferenced assets are swept by the GC job, never hard-deleted while referenced.

---

## Cross-references

- **Architecture of record:** [`03-seo-and-media.md` §B](../03-seo-and-media.md) — media-service topology,
  `media.assets`/`media.folders` DDL, CDN/variant pipeline, governance (dedupe, license, GC, tenancy, video).
- **Alt-text → SEO publish gate:** [`03-seo-and-media.md` §A.2 / §B.3](../03-seo-and-media.md) and the SEO
  score engine (alt-missing penalty).
- **Permissions matrix (authoritative):** [`04-rbac-and-workflow.md` §A.2](../04-rbac-and-workflow.md) (media
  upload/delete rows) and §A.3 enforcement (edge → BFF `/v1/authorize` → controller → RLS).
- **AI auto-tag / alt model config:** [`05-analytics-monetization-ai.md` §11](../05-analytics-monetization-ai.md).
- **Where media attaches to content:** the Rich Block Editor in [`02-content-cms.md`](../02-content-cms.md)
  creates/removes `cms_media_references` rows — Asset Detail and Library only *read* that linkage.
```
