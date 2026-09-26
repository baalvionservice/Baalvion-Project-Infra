# 03 — SEO Management & Media Management

Covers **§4 (SEO)** and **§6 (Media)**. SEO is existential for an encyclopedia at 100M MAU — it is treated
as a first-class subsystem, not a metadata afterthought.

---

## A. SEO Management (§4)

### A.1 Where SEO data lives

- **Per-content SEO:** `cms_contents.seo_metadata JSONB` (already enforced by `seoMetadataSchema`:
  `title, description, keywords[], ogTitle, ogDescription, ogImage, canonicalUrl, noIndex, noFollow`).
- **Redirects:** `cms_seo_redirects` (already exists: `source_url, target_url, redirect_type 301|302, is_active, hit_count`).
- **Site-wide SEO config + structured-data defaults:** new `cms.seo_settings` (per website).
- **Computed/audit data** (scores, broken links, internal-link graph): new tables below.

### A.2 The 11 required SEO capabilities → design

| Capability | Design |
|-----------|--------|
| **Meta titles** | `seo_metadata.title`; live editor counter (30–60 chars); fallback = content title; templated per type (`{title} — Imperialpedia`). |
| **Meta descriptions** | `seo_metadata.description`; 70–160 chars; AI-suggested from first paragraphs; required before publish. |
| **Canonicals** | `seo_metadata.canonicalUrl`; auto-set to self; cross-language canonicals respect `translation_of`; duplicate-term pages canonical to the authoritative one. |
| **Open Graph** | `ogTitle/ogDescription/ogImage`; OG image auto-generated (see §A.6) if unset; emitted in `<head>` by the Next.js metadata API. |
| **Twitter Cards** | Derived from OG with `summary_large_image`; `twitter:site` from site settings. |
| **Schema markup** | Generated per content_type (§A.5) — `Article`, `DefinedTerm`, `FAQPage`, `HowTo`, `BreadcrumbList`, `Organization`. |
| **XML Sitemap** | Generated + segmented (≤ 50k URLs/file, sitemap index), per content_type + glossary; lastmod from `updated_at`; served at edge, regenerated on publish. |
| **Robots.txt** | Managed per environment in site settings; staging = `Disallow: /`; production allows public, blocks `/admin`, `/api`. |
| **Redirect Manager** | UI over `cms_seo_redirects`; bulk import (CSV), loop/chain detection, applied at **edge** (Cloudflare) + app fallback; auto-create 301 on slug change. |
| **Internal Linking System** | Glossary/keyword dictionary → auto-suggest + auto-link; link graph stored & visualized (§A.7). |
| **Broken Link Monitoring** | Crawler job validates internal + external links; results in `seo_link_checks`; dashboard + alerts (§A.8). |

### A.3 New SEO tables

```sql
CREATE TABLE cms.seo_settings (                       -- one row per website
  website_id      uuid PRIMARY KEY REFERENCES cms.cms_websites(id) ON DELETE CASCADE,
  title_template  text NOT NULL DEFAULT '{title} — Imperialpedia',
  default_og_image text NULL,
  twitter_site    varchar(40) NULL,
  robots_txt      text NULL,                           -- managed robots body
  organization_jsonld jsonb NOT NULL DEFAULT '{}',     -- Organization schema
  default_no_index boolean NOT NULL DEFAULT false,      -- true on staging
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cms.seo_scores (                          -- computed per content, 1:1
  content_id   uuid PRIMARY KEY REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  score        int NOT NULL DEFAULT 0,                  -- 0..100 weighted
  checks       jsonb NOT NULL DEFAULT '{}',             -- {titleLen:ok, metaLen:warn, h1:ok, altMissing:1, …}
  readability  int NULL,                                -- Flesch
  word_count   int NULL,
  computed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cms.seo_link_checks (                     -- broken-link monitor results
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  url         text NOT NULL,
  link_type   varchar(10) NOT NULL CHECK (link_type IN ('internal','external')),
  http_status int NULL,
  ok          boolean NOT NULL DEFAULT true,
  last_checked timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seo_link_checks_broken ON cms.seo_link_checks (ok) WHERE ok = false;

CREATE TABLE cms.internal_links (                      -- the internal link graph
  from_content uuid NOT NULL REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  to_content   uuid NOT NULL REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  anchor_text  text NULL,
  PRIMARY KEY (from_content, to_content, anchor_text)
);
```

### A.4 SEO score engine

A pure function over a content item + its rendered HTML, returning `{score, checks}`. Runs on
autosave (soft) and on `submit_for_review` (hard gate). Weighted rubric (tunable):

```
title present & 30–60 chars ............ 10
meta description 70–160 ................ 10
exactly one H1 ......................... 8
focus keyword in title/H1/first 100w ... 12
all images have alt .................... 10
≥2 internal links, ≥1 external ......... 10
canonical set & valid .................. 6
slug ≤ 75 chars, hyphenated ............ 4
readability (Flesch ≥ 50) .............. 8
word count ≥ type minimum .............. 6
schema markup valid .................... 8
no broken links ........................ 8
                              total = 100
```

The dashboard **SEO Score** tile = avg of `seo_scores.score` across published content.

### A.5 Structured data (JSON-LD) per content type

| content_type | Schema emitted |
|--------------|----------------|
| `article`, `news` | `Article` / `NewsArticle` + `BreadcrumbList` + `Person` (author) |
| `encyclopedia` | `Article` + `DefinedTermSet` (if it anchors terms) |
| `financial_term` | `DefinedTerm` + `DefinedTermSet` |
| `faq` | `FAQPage` |
| `guide`, `tutorial` | `HowTo` (steps) |
| all | `Organization`, `WebSite` + `SearchAction` (sitelinks search box) |

JSON-LD is generated server-side from structured fields (never hand-typed), validated against schema.org
shapes, and unit-tested. Rich-result eligibility is surfaced in the editor SEO inspector.

### A.6 Auto OG-image generation

If `ogImage` is unset, generate a branded card at request time via an edge `@vercel/og`-style renderer
(title + category + author + Imperialpedia mark), cached at CDN. Editors can override per article.

### A.7 Internal linking system

- **Dictionary:** published glossary terms + aliases + curated keyword→URL map (`/admin/seo/linking`).
- **Suggest at edit time:** the editor scans prose, proposes links (accept/reject); never silently rewrites.
- **Auto-link on publish:** first mention of a dictionary term links to its page (cap 1/term, skip headings/quotes).
- **Graph:** `internal_links` populated on publish; `/admin/seo/internal-links` shows orphan pages (no inbound
  links), over-linked pages, and suggested links to boost thin/orphan content.

### A.8 Broken-link monitoring

- Nightly crawler (queue job) revalidates internal links (against `cms_contents` existence) and samples
  external links (HEAD/GET, rate-limited, cached by host). Writes `seo_link_checks`.
- Slug changes auto-insert a `301` into `cms_seo_redirects` and rewrite known inbound internal links.
- Broken links → dashboard widget + `notification-service` digest to the SEO Manager.

### A.9 SEO admin surfaces (existing routes)

`/admin/seo` (overview + score trend), `/admin/seo-audit` (per-page audit + fix-its), `/admin/seo/redirects`,
`/admin/seo/sitemaps`, `/admin/seo/internal-links`, `/admin/seo/linking`. Core Web Vitals (LCP/INP/CLS)
pulled from RUM/CrUX into the SEO overview (perf budget from web rules: LCP<2.5s, INP<200ms, CLS<0.1).

---

## B. Media Management (§6)

### B.1 Architecture

Originals live in **object storage (S3/R2)**; a thin **media-service (NEW)** owns metadata, upload
orchestration (presigned PUT), derivative/transform rules, and CDN URLs. The existing
`cms_media_references` table links media to content (`featured_image|block_image|block_video|gallery|attachment`).
Media-service is its own bounded context (`media` schema) so other apps (Amarise, etc.) can reuse it.

```
Admin ──presign──▶ media-service ──PUT (direct)──▶ S3/R2 (originals)
                       │  metadata + variants                 │
                       ▼                                      ▼
                 media.assets (Postgres)            Cloudflare Images / Imgproxy (on-the-fly resize)
                       │
                 cms_media_references (link to content)
```

### B.2 Schema (`media` schema)

```sql
CREATE TABLE media.assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NULL,                               -- tenancy (RLS-scoped)
  folder_id    uuid NULL REFERENCES media.folders(id) ON DELETE SET NULL,
  kind         varchar(12) NOT NULL CHECK (kind IN ('image','video','audio','doc','other')),
  filename     varchar(300) NOT NULL,
  mime         varchar(100) NOT NULL,
  bytes        bigint NOT NULL,
  width        int NULL, height int NULL, duration_ms int NULL,
  storage_key  text NOT NULL,                           -- S3 object key (originals)
  checksum     varchar(64) NOT NULL,                    -- sha256 → dedupe
  alt_text     text NULL,
  caption      text NULL,
  credit       text NULL,                               -- attribution / license
  license      varchar(40) NULL,                        -- CC-BY, owned, stock-licensed…
  dominant_color varchar(9) NULL,                       -- LQIP/placeholder hint
  blurhash     varchar(50) NULL,
  variants     jsonb NOT NULL DEFAULT '[]',             -- [{w,h,format,key}]
  tags         jsonb NOT NULL DEFAULT '[]',
  uploaded_by  bigint NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX media_assets_checksum_org ON media.assets (org_id, checksum);  -- dedupe per tenant
CREATE INDEX media_assets_folder ON media.assets (folder_id);
CREATE INDEX media_assets_kind   ON media.assets (kind);

CREATE TABLE media.folders (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    uuid NULL,
  parent_id uuid NULL REFERENCES media.folders(id) ON DELETE CASCADE,
  name      varchar(200) NOT NULL,
  path      text NOT NULL,                              -- materialized path /investing/charts
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_folders_parent ON media.folders (parent_id);
```

### B.3 The 6 required media capabilities → design

| Capability | Design |
|-----------|--------|
| **Media Library** | `/admin/media` — grid/list, filter by kind/folder/tag/license, search by filename/alt/caption, usage panel ("used in 3 articles" via `cms_media_references`). |
| **Image Optimization** | On-the-fly resize/format (AVIF/WebP) at the CDN/imgproxy; variants recorded in `assets.variants`; originals never served. Explicit `width`/`height` always returned (no CLS). |
| **CDN Integration** | Cloudflare in front of object store; signed URLs for private/premium assets; long-cache immutable derivatives (content-hashed keys). |
| **Alt Text Management** | `alt_text` required for images used as `featured_image`/`block_image` before publish (ties into SEO gate); bulk alt-text editor + AI alt-text suggester (vision model, human-confirmed). |
| **Bulk Upload** | Drag-drop multi-file with presigned parallel uploads, progress, auto-dedupe (checksum), folder assignment, optional AI auto-tag/alt. |
| **Folder Structure** | `media.folders` materialized-path tree; move/rename re-paths children; folder-level permissions follow RBAC scopes. |

### B.4 Media governance

- **Dedupe** by sha256 per tenant (`media_assets_checksum_org` unique) — re-uploading the same file reuses it.
- **License/credit** required for stock/3rd-party; surfaced on the public figure caption when present.
- **Garbage collection:** a periodic job flags assets with zero `cms_media_references` older than N days for
  review (never hard-deletes referenced media).
- **Tenancy:** `media` schema uses `@baalvion/tenancy` RLS so multi-brand (Amarise/Imperialpedia) media never bleeds.
- **Video:** large uploads → multipart presigned; optional transcode pipeline (HLS) for long-form; captions
  (`.vtt`) stored as `doc` assets and linked from `video` blocks for a11y + SEO.
