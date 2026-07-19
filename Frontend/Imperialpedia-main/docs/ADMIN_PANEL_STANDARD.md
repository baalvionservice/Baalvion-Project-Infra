# Imperialpedia Admin Panel Standard v1

**Scope note, read first:** Imperialpedia-main has no admin panel of its own.
Its local `/admin` route is retired and redirects to `NEXT_PUBLIC_ADMIN_CONSOLE_URL`
(see [`src/middleware.ts`](../src/middleware.ts)), which points at the
centralized `admin-platform` app (`Frontend/admin-platform`, port 3030 in
dev) — the **single** admin console for every site in the monorepo, per the
project's centralized-admin-platform directive. This document governs the
Imperialpedia-specific surfaces inside `admin-platform`:
`src/app/(dashboard)/imperialpedia/**` (knowledge-graph entities + glossary,
backed by `imperialpedia-service`) and
`src/app/(dashboard)/cms/websites/[websiteId]/**` for the `imperialpedia`
tenant (editorial content, backed by `cms-service`).

**Do not build a second, local admin UI inside Imperialpedia-main.** Doing so
duplicates `admin-platform`'s existing entity/content editors and RBAC, and
gives editors two disagreeing places to change the same data.

## 1. Content model this panel manages

- **Knowledge-graph entities** (company/country/industry/technology) — one
  generic `entities` table in `imperialpedia-service`
  (`Backend/services/knowledge/imperialpedia-service/models/entities.js`).
  Base columns (`type`, `name`, `slug`, `description`, `category`, `country`,
  `industry`, `image`, `tags`) plus a flexible `attributes` JSONB column that
  the API serializer flattens back to top-level fields (competitors,
  technologies, founded_year, ticker, founders, etc. — see `CompanyEntity` in
  Imperialpedia-main's `src/types/entity.ts`).
- **Glossary terms** — `imperialpedia-service` `/glossary`.
- **Editorial content** (articles/news/pages/authors/categories/media) — the
  shared multi-tenant `cms-service`, scoped to the `imperialpedia` website
  row (`cms.cms_websites`).

## 2. Entity relationship integrity (CRITICAL — data-loss bug fixed)

- [ ] `EntityForm.tsx` must load and round-trip **every** field an entity
      has, not just the ones it renders a control for. The pre-fix version
      only ever sent 8 fixed fields (`type/name/slug/description/category/
      country/industry/image/tags`); since `upsertEntity`
      (`imperialpedia-service/controller/entitiesController.js`) replaces
      the **entire** `attributes` JSONB column with whatever extra fields are
      present in the request body, saving any entity through that form
      silently deleted its competitors, technologies, founded_year, ticker,
      founders, and every other attribute it had. The fix
      (`EntityForm.tsx` + `entities/[type]/[slug]/edit/page.tsx`) carries
      unknown fields through via `extraAttributes` so a save can never
      truncate data the form has no UI for.
- [ ] Any new field added to `EntityForm.tsx`'s explicit UI must also be
      added to `EntityValue` and the mutation payload — it is not enough to
      render an input; the field must actually reach the API request body.
- [ ] `country`, `industry`, `competitors`, and `technologies` are edited via
      `EntityPicker.tsx` — a searchable combobox against the real entity set
      (`GET /entities?type=...&search=...`) — never a free-text input. A
      free-text relationship field can reference a slug that doesn't exist;
      a picker can't.
- [ ] The Imperialpedia dashboard (`imperialpedia/page.tsx`) computes
      **broken relationships** — any competitor/technology/country/industry
      reference pointing at a slug absent from the live entity set — as this
      panel's analog of "broken links." Every relationship-bearing array
      field on every entity type must be included in that check when a new
      one is added (see `checkRefs()` calls in `imperialpedia/page.tsx`).

## 3. Overview dashboard

- [ ] `imperialpedia/page.tsx` shows real, computed numbers only: entity
      counts by type, glossary term counts, a 0–100 content health score
      (description/image/category completeness + relationship integrity),
      and the actual list of broken relationships with a direct edit link —
      never a static links grid with no data behind it.
- [ ] The platform-wide `/dashboard` (Command Center) is infra/identity
      scoped (users, sessions, service health) and intentionally does **not**
      duplicate content metrics — Imperialpedia's content health lives on
      its own section page, not bolted onto the infra dashboard.
- [ ] `cms/websites/[websiteId]/page.tsx`'s SEO score (`dashboard-data.ts`)
      measures title/description completeness over the most recent 50
      content items. Extending it to also check image alt text and
      duplicate slugs is tracked as a follow-up (see §5) — do not represent
      the current score as more comprehensive than it is.

## 4. Roles (already built — do not duplicate)

Per-site CMS roles (`cms.cms_website_members.role`): `cms_admin`,
`cms_editor`, `cms_publisher`, `cms_reviewer`, `cms_seo_manager`,
`cms_author`, `cms_contributor`, `cms_viewer`. These already implement the
Super Admin/Editor/Author/Analyst/Viewer spectrum this standard requires —
map new permission checks onto this existing enum rather than introducing a
parallel role system.

## 5. Known gaps (tracked, not fabricated around)

These exist in `admin-platform` today and were scoped but intentionally
**not** built in this pass, to avoid rushing security- and data-integrity-
adjacent surfaces:

- [ ] No JSON-LD/schema preview or Open Graph visual card preview in the SEO
      panel (`cms/websites/[websiteId]/seo/page.tsx`) — only raw
      title/description/canonical/OG-image-URL fields.
- [ ] The sitemap tab is three decorative toggles with no real generated
      status, timestamp, or URL count.
- [ ] The "Save Redirects" button in the same panel has no handler — it is
      currently non-functional.
- [ ] No caption field on media (`MediaDetailSheet.tsx` has alt text only),
      no upload-time image compression visible in the frontend flow, and no
      "N images missing alt text" report.
- [ ] No formal Published → Updated re-review state — an edit after
      publish creates a new revision (`RevisionHistory.tsx`, fully
      functional) without moving the item back through the approval
      pipeline.

Fix these in the order listed — the entity relationship/data-loss fix and
the content-health dashboard in this pass were prioritized because they were
the only two items in this list with active data-integrity risk.
