# 16 — Page-by-Page RBAC Matrix (PRD)

> **Section:** The complete, page-by-page authorization matrix for the Imperialpedia Admin
> Panel across the **8 canonical roles**. This document is the *single normative reference*
> for "who can reach and do what on every admin page." It does **not** restate the role model,
> the editorial workflow state machine, or the per-page component specs — those live in
> [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) (matrix concepts + workflow),
> [11-users-pages.md](./11-users-pages.md) (people surfaces), [12-system-pages.md](./12-system-pages.md)
> (system surfaces), and the section PRDs 01–15. Authorization is **always** decided by
> `rbac-service` `POST /v1/authorize` (deny-overrides); the frontend only hides/disables what
> the `GET /me/permissions` capability list says is unavailable — **the server is the authority**.

## The 8 roles (canonical, in column order)

| # | Role | Key | Base rank | ABAC scope | One-line intent |
|---|------|-----|-----------|------------|-----------------|
| 1 | **Super Admin** | `super_admin` | `super_admin` | global | Bypasses all checks. Break-glass, every action 🔒 audited. |
| 2 | **Admin** | `admin` | `admin` | org/site | Runs the site: settings, users **≤ own rank**, all content, monetization. |
| 3 | **Managing Editor** | `manager` | `manager` | site | Editorial calendar + final publish + scheduling. |
| 4 | **Editor** | `editor` | `editor` | category set **S** | Review/edit/approve content within assigned categories. |
| 5 | **SEO Manager** | `editor` + `seo:*` | `editor` | site | SEO review gate, redirects, sitemaps, linking. **Cannot publish prose alone.** |
| 6 | **Legal Reviewer** | `editor` + `content:legal_review` | `editor` | **NARROW** | Sees only the Legal Review Queue + read content; legal approve/reject only. |
| 7 | **Author** | `member` + `content:author` | `member` | own + assigned | Create/edit **OWN** content, submit for review; **cannot publish**. |
| 8 | **Contributor** | `member` (restricted) | `member` | own | **Drafts only**; every submission reviewed; no media delete, no publish. |

> *Moderator* (`member` + `community:moderate`) is the 9th platform role but is **out of column
> scope** for this matrix — it has no editorial-pipeline authority and is covered on the
> Moderators roster page in [11-users-pages.md](./11-users-pages.md#moderators----adminusersmoderators).
> Where a page mentions Moderator (Media, Community), it is called out in the notes.

## Cell legend

| Cell | Meaning |
|------|---------|
| **Full** | Unrestricted access to the page's actions (subject to rank ceilings + step-up where noted). |
| **Scoped (S)** | Access limited by ABAC scope — Editor by **category set**, Author/Contributor by **own** rows (`O`). `scope_id` on `rbac.role_assignments` is the binding. |
| **Read** | Can view the page/its data but cannot mutate. |
| **None** | No access — the page is not in their nav, the edge route-group denies, and `/v1/authorize` returns `deny`. |
| 🔒 | Allowed but **step-up (re-MFA) + WORM audit** required (break-glass / destructive). |

Each cell is justified by the **canonical capability vocabulary** (e.g. `content:publish`,
`seo:redirects`). A page is reachable only if the role holds **≥ 1** of the page's read
capabilities; an action inside it requires that action's specific capability.

---

# 1. Master Matrix — one row per page

Grouped by section. Capability hints in the page row show the load-bearing strings; the full
per-page capability list is the inventory `permissions` field (and the section PRDs).

## §A Dashboard & Widget Catalog

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Executive Dashboard** `/admin/dashboard` (role-adaptive) | Full | Full | Full | Scoped (S) | Read (SEO+audit tiles) | Read (legal queue tile only) | None¹ | None¹ |
| **Author/Contributor Personal Dashboard** `/admin/dashboard` | Full | Full | Full | Scoped (S) | Read | Read | **Scoped (own)** | **Scoped (own)** |
| **Widget Catalog (W1–W7)** `/admin/dashboard` (embedded) | Full | Full | Full | Scoped (S) | Read (W: SEO, audit) | Read (W: legal queue) | Scoped (own W) | Scoped (own W) |

¹ Author/Contributor land on the **Personal Dashboard** variant (next row), not the executive one.
Caps: `analytics:view`, `content:read`/`content:review`, `seo:audit`, `analytics:revenue` (money tiles → Super Admin/Admin only; Managing Editor read), `audit:view`, `system:events`, `content:legal_review`.

## §B Content Management Pages

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **All Content list** `/admin/content` | Full | Full | Full | Scoped (S) | Read | Read | Scoped (own) | Scoped (own) |
| **Create (type picker)** `/admin/content/new` | Full | Full | Full | Full | None² | None | Full | Full (draft only) |
| **Edit (block editor)** `/admin/content/[slug]/edit` | Full | Full | Full | Scoped (S) | Scoped (S, SEO meta only) | Read | Scoped (own) | Scoped (own, draft) |
| **Articles** `/admin/content?type=article` | Full | Full | Full | Scoped (S) | Read | Read | Scoped (own) | Scoped (own, draft) |
| **Encyclopedia** `/admin/content?type=encyclopedia` | Full | Full | Full | Scoped (S) | Read | Scoped (legal review) | Scoped (own) | Scoped (own, draft) |
| **Glossary Terms (editorial CRUD)** `/admin/glossary` | Full | Full | Full | Scoped (S) | Read (SEO meta) | Scoped (legal review) | Scoped (own draft) | Scoped (own, draft) |
| **Guides** `/admin/content?type=guide` | Full | Full | Full | Scoped (S) | Read | Read | Scoped (own) | Scoped (own, draft) |
| **Tutorials** `/admin/content?type=tutorial` | Full | Full | Full | Scoped (S) | Read | Read | Scoped (own, +`ai:use`) | Scoped (own, draft) |
| **News** `/admin/content?type=news` | Full | Full | Full | Scoped (S) | Read | Read | Scoped (own) | Scoped (own, draft) |
| **FAQs** `/admin/content?type=faq` | Full | Full | Full | Scoped (S) | Read (SEO meta) | Read | Scoped (own) | Scoped (own, draft) |
| **Trash / Archive** `/admin/content/trash` | Full 🔒(delete) | Full 🔒(delete) | Full (archive/restore) | Scoped (S, restore) | None | None | Scoped (own, restore) | None³ |
| **Bulk operations** `/admin/content` (BulkActionBar) | Full | Full | Full | Scoped (S) | None | None | Scoped (own subset) | None |
| **Import / Export** `/admin/content/import` · `/export` | Full 🔒 | Full | Full | Scoped (S, export own scope) | Read (export) | None | Scoped (export own) | None |

² SEO Manager creates **no prose** — it operates the SEO gate, not authoring. ³ Contributor has **no delete** and no archive (`content:delete`/`content:archive` not held). Caps: `content:create/read/edit.own/edit.any/submit/review/publish/schedule/rollback/archive/delete`, `seo:metadata`, `knowledge:edit`, `references:manage`, `glossary:edit/publish`, `taxonomy:manage`, `ai:use`.

## §C Editorial Pipeline Surfaces

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Workflow Queue / Kanban** `/admin/editorial/queue` | Full | Full | Full (publish+schedule) | Scoped (S, review) | Scoped (SEO column) | Scoped (legal column) | Read (own cards, submit) | Read (own cards, submit) |
| **My Reviews** `/admin/editorial/reviews` | Full | Full | Full | Scoped (S) | Scoped (SEO reviews) | Scoped (legal reviews) | None⁴ | None⁴ |
| **Legal Review Queue** `/admin/editorial/legal` | Full | Full | 🔒 (audited) | None | None | **Full (sole work surface)** | None | None |
| **Revisions / Diff / Rollback** `/admin/content/[slug]/revisions` | Full | Full | Full (rollback) | Scoped (S, rollback) | Read | Read | Scoped (own, view) | Scoped (own, view) |
| **Editorial Calendar** `/admin/scheduler` | Full | Full | Full (schedule+publish) | Scoped (S, read) | Read | None | Read (own scheduled) | None |

⁴ Authors/Contributors are **reviewees**, not reviewers — they submit from the Queue, they do not hold `content:review`. Caps: `content:review/seo_review/legal_review/publish/schedule/submit/rollback/read`.

## §D Media Management

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Media Library** `/admin/media` | Full | Full | Full | Scoped (S) | Read+edit (own uploads) | None⁵ | Scoped (own) | Scoped (own, no delete) |
| **Uploads** `/admin/media/uploads` | Full | Full | Full | Full | Full (+`ai:use`) | None⁵ | Full (own dest) | Full (own dest, no delete) |
| **Folders management** `/admin/media/folders` | Full | Full | Full | Scoped (S, create/rename/move) | Read tree | None | Read tree | Read tree |
| **Asset Detail** `/admin/media/[id]` | Full 🔒(delete referenced) | Full 🔒 | Full 🔒 | Scoped (S, edit; delete 🔒) | Scoped (own, edit meta) | None | Scoped (own, edit meta) | Scoped (own, edit meta; no delete) |

⁵ Legal Reviewer is **narrow** (legal queue + read content); it does not enter the media admin. **Moderator** has **no media access** at all. `media:delete` = Super Admin/Admin/Managing Editor + Editor(S); referenced-asset delete is **step-up**. Caps: `media:upload/edit/delete`, `ai:use`.

## §E SEO Management

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **SEO Overview & Audit** `/admin/seo` · `/admin/seo-audit` | Full | Full | Full | Scoped (S, read) | Full | None | Read (own analytics) | None |
| **Metadata Manager** `/admin/seo/metadata` | Full | Full | Full | Scoped (S) | Full | None | Scoped (own meta) | None⁶ |
| **Redirects** `/admin/seo/redirects` | Full | Full | Full | None | **Full** | None | None | None |
| **Sitemaps & Robots** `/admin/seo/sitemaps` | Full | Full | Read | None | **Full** (+`system:settings`) | None | None | None |
| **Internal Linking** `/admin/seo/internal-links` · `/linking` | Full | Full | Full | Scoped (S, `edit.any`) | **Full** | None | Scoped (own, `edit.own`) | None |
| **Broken Links** `/admin/seo/broken-links` | Full | Full | Full | Scoped (S) | **Full** (audit+redirect) | None | None | None |

⁶ Contributor holds no `seo:metadata` (drafts only). Caps: `seo:metadata/redirects/sitemaps/links/audit`, `analytics:view`, `content:edit.own/edit.any`, `system:settings` (sitemap/robots config tab).

## §F Knowledge Graph (structured knowledge layer)

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Terms — Glossary Term Editor** `/admin/glossary[/new][/[slug]]` | Full | Full | Full (publish) | Scoped (S, review/edit) | Read (SEO meta) | Scoped (legal review) | Scoped (own draft, submit, `ai:use`) | Scoped (own, draft) |
| **Relationships — KG Editor** `/admin/knowledge/relationships` | Full | Full | Full | Scoped (S, `knowledge:edit`) | None | None | None | None |
| **Categories — Tree & Hubs** `/admin/categories` | Full | Full | Full (`taxonomy:manage`) | Scoped (S, read) | Read | None | Read | None |
| **References — CSL-JSON Store** `/admin/knowledge/references` | Full | Full | Full (`references:manage`) | Scoped (S, manage) | None | Read (cite verify) | Scoped (own cites) | None |
| **Entities — Companies/Countries/…** `/admin/knowledge/entities` | Full | Full | Full (`knowledge:edit`) | Scoped (S, edit) | None | None | None | None |

Caps: `glossary:edit/publish`, `knowledge:edit`, `references:manage`, `taxonomy:manage`, `content:read/edit.own/submit/review/archive/delete`, `ai:use`, `seo:metadata`, `content:legal_review`.

## §G Analytics Dashboards

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Overview** `/admin/analytics` | Full (+revenue) | Full (+revenue) | Full (no money tiles) | Scoped (S) | Full (SEO lens) | None | Scoped (own) | None |
| **Traffic** `/admin/analytics/traffic` | Full | Full | Full | Scoped (S) | Full | None | Scoped (own) | None |
| **Search** `/admin/analytics/top-keywords` | Full | Full | Full (+create handoff) | Scoped (S, +create) | Full | None | Scoped (own) | None |
| **Revenue** `/admin/analytics/revenue` | Full | Full | **Read** | None | None | None | None⁷ | None |
| **Engagement** `/admin/analytics/engagement` | Full | Full | Full | Scoped (S) | Full | None | Scoped (own) | None |
| **Top Content** `/admin/analytics/top-content` | Full (+rev sort) | Full (+rev sort) | Full (no rev column) | Scoped (S) | Full | None | Scoped (own) | None |
| **User Growth** `/admin/analytics/growth` | Full | Full | Full | None | Read | None | None | None |

⁷ Authors see **their own** earnings via the account area, not the platform Revenue page. `analytics:revenue` (money tiles/columns) = Super Admin, Admin only; Managing Editor **read-only** on `/admin/finance`. Caps: `analytics:view`, `analytics:revenue`, `content:create` (Search→draft handoff).

## §H Monetization

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Ads** `/admin/ads` | Full | Full | None | None | None | None | None | None |
| **Affiliates** `/admin/monetization/affiliates` | Full | Full | None | None | None | None | None | None |
| **Sponsored Content** `/admin/monetization/sponsored` | Full | Full | Read⁸ | None | None | None | None | None |
| **Memberships (Plans)** `/admin/monetization/plans` | Full | Full | None | None | None | None | None | None |
| **Subscriptions** `/admin/monetization/subscriptions` | Full | Full | None | None | None | None | None | None |
| **Finance / Payouts** `/admin/finance` | Full 🔒(disburse) | Full 🔒(disburse) | **Read** | None | None | None | None | None |

⁸ Managing Editor may **read** sponsored items to plan the calendar (`content:read`) but holds no `monetization:sponsored`. `monetization:ads/affiliates/sponsored/memberships` = **Super Admin, Admin only**. Payout **disbursement** is step-up. Caps: `monetization:*`, `analytics:view`, `analytics:revenue`, `content:read`.

## §I AI Tools

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Draft Assistant** `/admin/ai/draft` | Full | Full | Full | Scoped (S) | None⁹ | None | Scoped (own) | Scoped (own draft) |
| **Fact Checker** `/admin/ai/fact-check` | Full | Full | Full | Scoped (S, review) | Read | Read | Scoped (own) | Scoped (own) |
| **SEO Assistant** `/admin/ai/seo` | Full | Full | Full | Scoped (S) | **Full** | None | None | None |
| **Internal Link Assistant** `/admin/ai/links` | Full | Full | Full | Scoped (S) | **Full** (+`glossary:edit`) | None | None | None |
| **AI Jobs / Usage Console** `/admin/ai-hub` | Full (+`ai:configure`) | Full (+`ai:configure`) | Read (usage) | Read (own jobs) | Read (own jobs) | None | Read (own jobs) | None |
| **News AI Pipeline** `/admin/news-ai` | Full (+`ai:configure`) | Full (+`ai:configure`) | Full (run/curate) | Scoped (S, draft) | None | None | Scoped (own draft, submit) | None |

⁹ SEO Manager uses the **SEO** AI tools (SEO Assistant, Link Assistant), not the prose Draft Assistant. `ai:configure`/`system:settings` (model + budget config) = Super Admin, Admin only. Caps: `ai:use/configure`, `content:create/read/edit.own/edit.any/submit/review`, `seo:metadata/links/redirects/sitemaps`, `glossary:edit`, `audit:view`, `analytics:view/revenue`, `system:settings`.

## §J Users & Roles Administration

> Full per-page specs in [11-users-pages.md](./11-users-pages.md). `user:manage`/`role:manage`
> are **Admin (≤ own rank) + Super Admin** only; Managing Editor gets scoped read + own-site
> invite of ≤ editor; everyone else **None**.

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Authors** `/admin/authors` | Full | Full | Read (verify/provision) | Scoped (S, read) | None | None | None | None |
| **Editors** `/admin/users/editors` | Full | Full (≤ own rank) | Scoped (own site, ≤ editor) | None | None | None | None | None |
| **Moderators** `/admin/users/moderators` | Full | Full | Read | None | None | None | None | None |
| **Roles** `/admin/roles` | Full (any) 🔒 | Full (≤ own rank) 🔒 | None | None | None | None | None | None |
| **User Detail** `/admin/users/[userId]` | Full 🔒(impersonate) | Full (≤ own rank) 🔒 | Read (own-site scope) | None | None | None | None¹⁰ | None¹⁰ |
| **Invitations** `/admin/users/invitations` | Full (any role) | Full (≤ own rank) | Scoped (own site: Author/Contributor/Editor) | None | None | None | None | None |
| **Creators** `/admin/creators` | Full | Full | Full (verification decisions) | Scoped (S, read) | None | None | None¹⁰ | None¹⁰ |

¹⁰ Authors/Contributors/Creators manage **their own** profile, sessions and 2FA via the public account area — never the admin people surfaces. Rank ceiling: **Admin cannot grant/edit ≥ admin** (`requireTenantAdmin`, server-side). Role-change, suspend, impersonate, binding edits = **step-up + WORM**. Caps: `user:read/manage`, `role:manage`, `analytics:view/revenue`, `community:moderate`, `audit:view`.

## §K System Administration

> Full per-page specs in [12-system-pages.md](./12-system-pages.md). This is the **most
> restricted** band: Super Admin + Admin only, with a Security/Break-glass sub-band reserved
> for Super Admin. Managing Editor and below are **None** everywhere except the scoped
> content/media slice of Audit Logs.

| Page · route | Super Admin | Admin | Managing Editor | Editor | SEO Manager | Legal Reviewer | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| **Audit Logs** `/admin/audit-logs` | Full (global) | Full (org/site) | **Read (content.*/media.* only)** | None | None | None | None | None |
| **Events** `/admin/system/events` | Full 🔒(replay) | Full 🔒(replay) | None | None | None | None | None | None |
| **APIs** `/admin/api-hub` | Full 🔒 | Full 🔒(scopes ≤ own caps) | None | None | None | None | None | None |
| **Webhooks** `/admin/system/webhooks` | Full 🔒 | Full 🔒 | None | None | None | None | None | None |
| **Settings** `/admin/settings` | Full (incl. Security tab) | Full (**no Security tab** 🔒) | None | None | None | None | None | None |
| **Health** `/admin/health` | Read (realtime) | Read (realtime) | None | None | None | None | None | None |
| **Backups** `/admin/backup` | Full 🔒(restore) | Read+run-backup/drill 🔒(restore→denied prod) | None | None | None | None | None | None |
| **Feature Flags** `/admin/feature-flags` | Full (incl. `security.*` 🔒) | Non-security flags only (`security.*` 🔒→denied) | None | None | None | None | None | None |

Caps: `audit:view`, `system:events/api/webhooks/settings/backup`. The **Security** Settings tab,
`security.*` feature flags, and **prod restore** are **break-glass Super-Admin-only**; the API-key
console caps issued scopes at the **issuing admin's own** capabilities. All actions step-up + audited.

---

# 2. Capability → Roles reverse map

Which roles hold each capability string (the canonical vocabulary). `S` = scope-limited
(category/own); 🔒 = held but step-up/audited; ✗ implicit where a role is absent. This is the
binding shape for `rbac.role_permissions` (per role, per tenant).

## Content lifecycle

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Legal | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| `content:create` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ (draft) |
| `content:read` | ✓ | ✓ | ✓ | S | ✓ | ✓ (assigned) | O | O |
| `content:edit.own` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ (draft) |
| `content:edit.any` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `content:submit` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| `content:review` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `content:seo_review` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `content:legal_review` | ✓ | ✓ | 🔒 | ✗ | ✗ | ✓ | ✗ | ✗ |
| `content:publish` | ✓ | ✓ | ✓ | S† | ✗ | ✗ | ✗ | ✗ |
| `content:schedule` | ✓ | ✓ | ✓ | S† | ✗ | ✗ | ✗ | ✗ |
| `content:archive` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `content:delete` | ✓ | ✓ | 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ |
| `content:rollback` | ✓ | ✓ | ✓ | S | ✗ | ✗ | O (draft) | ✗ |

† Editor publish/schedule only **if delegated** by Managing Editor on a category (obligation `delegated:publish`).

## Knowledge, taxonomy, references, media

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Legal | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| `taxonomy:manage` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `glossary:edit` | ✓ | ✓ | ✓ | S | ✗ | ✗ | O (draft) | O (draft) |
| `glossary:publish` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `knowledge:edit` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| `references:manage` | ✓ | ✓ | ✓ | S | ✗ | ✗ | O (cites) | ✗ |
| `media:upload` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| `media:edit` | ✓ | ✓ | ✓ | S | O (own) | ✗ | O (own) | O (own) |
| `media:delete` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |

## SEO, analytics

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Legal | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| `seo:metadata` | ✓ | ✓ | ✓ | S | ✓ | ✗ | O (own) | ✗ |
| `seo:redirects` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `seo:sitemaps` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `seo:links` | ✓ | ✓ | ✓ | S | ✓ | ✗ | O (own) | ✗ |
| `seo:audit` | ✓ | ✓ | ✓ | S | ✓ | ✗ | ✗ | ✗ |
| `analytics:view` | ✓ | ✓ | ✓ | S | ✓ (SEO) | ✗ | O (own) | ✗ |
| `analytics:revenue` | ✓ | ✓ | Read | ✗ | ✗ | ✗ | ✗ | ✗ |

## Monetization, AI

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Legal | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| `monetization:ads` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `monetization:affiliates` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `monetization:sponsored` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `monetization:memberships` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ai:use` | ✓ | ✓ | ✓ | S | ✓ (SEO tools) | ✗ | O (own) | O (own draft) |
| `ai:configure` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Users, system, community

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Legal | Author | Contributor |
|---|---|---|---|---|---|---|---|---|
| `user:read` | ✓ | ✓ | S (own site) | ✗ | ✗ | ✗ | ✗ | ✗ |
| `user:manage` | ✓ | ✓ (≤ own rank) 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `role:manage` | ✓ (any) 🔒 | ✓ (≤ own rank) 🔒 | S (own-site invite ≤ editor) | ✗ | ✗ | ✗ | ✗ | ✗ |
| `audit:view` | ✓ (global) | ✓ (org/site) | S (content.*/media.*) | ✗ | ✗ | ✗ | ✗ | ✗ |
| `system:events` | ✓ 🔒 | ✓ 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `system:api` | ✓ 🔒 | ✓ 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `system:webhooks` | ✓ 🔒 | ✓ 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `system:settings` | ✓ (incl. Security 🔒) | ✓ (no Security) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `system:backup` | ✓ 🔒 (restore) | ✓ (backup/drill; restore 🔒→denied prod) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `community:moderate` | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |

> `community:moderate` is also held by the **Moderator** role (out of column scope here);
> see [11-users-pages.md](./11-users-pages.md#moderators----adminusersmoderators).

---

# 3. Special-case notes

These are the non-obvious rules the matrix cells above encode. Where the matrix and prose
disagree, **the more restrictive reading wins** and `/v1/authorize` is the tiebreaker.

1. **Legal Reviewer is NARROW.** It is `editor` rank + a single `content:legal_review` grant.
   Its **only** work surface is the **Legal Review Queue** (`/admin/editorial/legal`) plus
   **read** access to the content it must clear (`content:read` on assigned items). It holds
   **no** `content:edit.*`, `content:publish`, `seo:*`, `media:*`, `user:*`, `system:*` — every
   other admin page is **None**. On the matrix it appears only in the Legal column of the
   Workflow Queue, the Legal Review Queue (Full), Encyclopedia/Glossary legal-review, Fact
   Checker (read), and References (cite verify, read). It can `approve`/`reject` legal only —
   it cannot send content back into authoring or alter prose.

2. **SEO Manager cannot publish prose alone.** It is `editor` + `seo:*` grants. It owns the
   **SEO gate** (`content:seo_review`), Redirects, Sitemaps/Robots, Internal Linking, Broken
   Links, the SEO AI tools, and `seo:metadata`. It holds **no** `content:publish`,
   `content:edit.any` (prose), `content:review` (editorial), or `content:create`. It can move an
   item `seo_review → legal_review/changes_requested`, never `approved → published`. Final
   publish stays with Managing Editor/Admin.

3. **Contributor is draft-only.** `member` (restricted) + `content:author`. Can create and edit
   **own drafts** and `content:submit`; **every** submission is reviewed. It holds **no**
   `content:publish`, `content:archive`, `content:delete`, `media:delete`, `content:rollback`,
   `seo:metadata`, `analytics:*` (beyond own dashboard), or any `user:*`/`system:*`. Bulk ops,
   Trash delete, Import, and Export are **None**.

4. **Author is own-only (`O`).** `member` + `content:author`. Same authoring powers as
   Contributor **plus** `seo:metadata` on **own** content, `seo:links` on own, `references:manage`
   for own citations, `glossary:edit` on own drafts, `ai:use` on own, and own-content analytics.
   Still **cannot publish** (`content:publish` not held) and cannot touch others' content
   (`content:edit.any` not held) — ownership is enforced by the controller
   (`author_id === userId`) and RLS, not just the UI.

5. **Admin cannot exceed own rank when managing users.** On Roles, Editors, User Detail,
   Invitations, and Creators, Admin's `user:manage`/`role:manage` is capped at **≤ own rank**:
   it cannot grant, edit the bindings of, or change a user into `admin`/`owner`/`super_admin`.
   Enforced **server-side** by `requireTenantAdmin`/`requireScopeAdmin`; the UI only mirrors the
   ceiling. API keys an Admin issues are likewise capped at the **Admin's own** capabilities.

6. **Super Admin break-glass is audited.** Super Admin bypasses all RBAC checks, but every
   sensitive action — impersonation, prod backup **restore**, `security.*` feature flags, the
   **Security** Settings tab, event **replay**, webhook reveal/rotate, role-binding edits on
   system roles — is **step-up (re-MFA) + written to the WORM `audit.audit_logs` hash-chain**.
   Break-glass is *allowed*, never *silent*.

7. **Managing Editor is editorial, not financial/admin.** It owns the calendar, final publish,
   scheduling, taxonomy, glossary publish, media management, and scoped roster **reads** + own-site
   invites of ≤ editor. It has **no** monetization, **no** role registry (`/admin/roles`),
   **no** system band (events/api/webhooks/settings/backup/flags), and **read-only** on
   `/admin/finance` and `/admin/analytics/revenue`. Its `content:legal_review` and
   `content:delete` are **🔒 break-glass** (audited), not routine.

8. **Editor scope (S) is meaningless without a category set.** An `editor` with an empty
   `scope_id` can review/edit/publish **nothing**. Scope is bound on
   `rbac.role_assignments.scope_id` via the Editors page; SEO Manager's `seo_review` scope is
   likewise category-bound. Scope changes take effect on the next token refresh (TTL).

9. **Money is hidden, not just disabled.** Pages/columns gated on `analytics:revenue`
   (Revenue, Finance, payout fields, revenue sort on Top Content) are **hidden** for roles
   lacking it, to avoid leaking financial figures — consistent with the §12 PII posture.

10. **Personal vs Executive Dashboard.** `/admin/dashboard` is **role-adaptive**: editor-rank+
    sees the Executive variant (scoped), Author/Contributor see the **Personal** variant (own
    drafts, submissions, own earnings, own analytics) — they never see org-wide KPIs.

---

# 4. Enforcement notes (defense in depth)

The matrix is **declarative**; these four layers make it real. No layer is sufficient alone.

### Layer 1 — Edge / route group (`/admin/*`)
- Next.js 15 App Router middleware on the `/admin` route group requires an **authenticated
  RS256 session** (issuer `baalvion-auth`, aud `baalvion-platform`) with rank **≥ `editor`**.
- Author/Contributor (rank `member`) reach **only** the Personal Dashboard subset and their
  own content/media surfaces; all editor-rank+ admin pages 404/redirect at the edge.
- Nav itself is rendered from `GET /me/permissions` so a role never *sees* a page it cannot reach
  — but the edge guard is the real gate, not the hidden nav.

### Layer 2 — `rbac-service` PDP (`POST /v1/authorize`, deny-overrides)
- **Every mutation** (and every sensitive read, e.g. Revenue/Audit) calls
  `POST /v1/authorize` with `{ subject{sub,roles,org_id}, action:"<capability>",
  resource{type,id,scope} }`. Decision is **deny-overrides**: any explicit `deny` in
  `rbac.role_permissions` (or a parent role) beats any `allow`.
- **Obligations** returned by the PDP are honored by the caller: `limit:own` (ownership filter),
  `require_mfa` (triggers step-up via `POST /v1/auth/mfa/challenge` → `/verify`),
  `delegated:publish`, `limit:own_site`, `scope:<category-set>`.
- The capability list the UI consumes comes from `GET /me/permissions`; the **server**
  (`/authorize`) remains authoritative — the UI list is a convenience, not a security boundary.
- Decisions are written to `rbac.decision_logs` (PDP audit); `POST /v1/simulate` dry-runs a
  decision **without** writing a log.

### Layer 3 — Service controller (ownership-or-rank gate)
- `cms-service` and `imperialpedia-service` controllers enforce the **ownership-or-rank** check
  already used in the codebase: `author_id === userId || rank ≥ admin` for `O`-scoped actions;
  category-membership check for `S`-scoped actions. This catches a forged/replayed capability
  list that slips past the UI.
- Workflow transitions are **atomic**: `workflowService.transition` runs the state change +
  `createRevision` (`cms.cms_revisions`) + `auditService.logWorkflowAction` **inside one DB
  transaction** (the documented self-deadlock fix in
  [04-rbac-and-workflow.md §B.2](../04-rbac-and-workflow.md)).
- Rank ceilings (`requireTenantAdmin`/`requireScopeAdmin`) enforce **≤ own rank** for all
  user/role mutations server-side — the Admin ceiling in note 5 lives here, not in the UI.

### Layer 4 — Row-level (RLS + scope filters)
- `@baalvion/tenancy` Postgres **RLS** keeps multi-brand/tenant rows isolated
  (`app.current_tenant` GUC; services run under a `NOSUPERUSER` `baalvion_app` role so RLS is
  never bypassed). Cross-tenant reads/writes are blocked at the database.
- **Category-scope (`S`)** filters list queries on `cms.cms_contents` by the editor's
  `scope_id` category set; **ownership (`O`)** filters by `author_id`/`created_by` for
  Author/Contributor. So `/admin/content` returns *different rows* per role even on the same URL.
- Audit Logs scoping: Managing Editor's `audit:view` is filtered to `action LIKE 'content.%'`
  / `'media.%'` rows in `audit.audit_logs` — enforced in the query, not just the view.

### Step-up + audit (🔒 cells)
- All 🔒 cells require **step-up re-MFA** before commit and write an immutable entry to the
  WORM, SHA-256 hash-chained `audit.audit_logs` via `audit-service` (:3032), fed by the
  `baalvion:events` Redis stream. Cancelling step-up aborts the mutation cleanly — nothing is
  written. This covers: content delete, prod restore, impersonation, role-binding edits,
  `security.*` flags, the Security Settings tab, event replay, webhook/API-key reveal/rotate,
  and Managing-Editor legal-review/delete.

---

## Cross-section references

- **Role model, base ranks, workflow state machine, transition rules:** [04-rbac-and-workflow.md](../04-rbac-and-workflow.md).
- **Per-page component specs — people surfaces:** [11-users-pages.md](./11-users-pages.md).
- **Per-page component specs — system surfaces (Audit/Events/APIs/Webhooks/Settings/Health/Backup/Flags):** [12-system-pages.md](./12-system-pages.md).
- **Content pages, block editor, glossary:** [03-content-pages.md](./03-content-pages.md), [13-content-editor-blocks.md](./13-content-editor-blocks.md), [02-content-cms.md](../02-content-cms.md).
- **Editorial pipeline UI (Kanban, reviews, calendar):** [04-editorial-pages.md](./04-editorial-pages.md), [14-workflow-ui.md](./14-workflow-ui.md).
- **Media / SEO / Knowledge Graph / Analytics / Monetization / AI pages:** [05-media-pages.md](./05-media-pages.md), [06-seo-pages.md](./06-seo-pages.md), [07-knowledge-graph-pages.md](./07-knowledge-graph-pages.md), [08-analytics-pages.md](./08-analytics-pages.md), [09-monetization-pages.md](./09-monetization-pages.md), [10-ai-tools-pages.md](./10-ai-tools-pages.md).
- **Sidebar IA / nav grouping that renders from `GET /me/permissions`:** [01-sidebar-ia.md](./01-sidebar-ia.md).
- **2FA/step-up details, session/`jti` policy, PII masking, WORM audit internals:** [06-security-database-api.md](../06-security-database-api.md).
