# Imperialpedia — Content Author's Guide

> **Who this is for:** anyone who will **write, upload, or publish content** on
> Imperialpedia — writers, editors, SEO/content uploaders, and glossary/data
> contributors. No coding required. If you can use a web form, you can publish here.

---

## 1. What is Imperialpedia (in one minute)

Imperialpedia is a **financial knowledge & news platform** — think "Investopedia +
live markets." The public site lives at **imperialpedia.com** (locally
`http://localhost:3029`). It has four kinds of content you might create:

| You want to publish… | Use | Example |
|---|---|---|
| A news story or analysis article | **CMS → Article / News** | "Fed holds rates steady in June" |
| An evergreen explainer / guide / landing page | **CMS → Post / Page** | "How to choose a checking account" |
| A financial **definition** | **Glossary term** | "What is EBITDA?" |
| A structured **entity** (company, person, place) | **Entity** | "Apple Inc." node |

There are **two tools**, and the table above tells you which to open. The rest of
this guide walks through each.

---

## 2. Getting access

1. Open the admin console: **`http://localhost:3030`** (prod: the admin subdomain).
2. Sign in. Ask your administrator for an account; the platform owner can create
   one for you with a **Writer**, **Editor**, or **Admin** role.
   - **Writer** — create content and submit it for review (cannot publish).
   - **Editor / Admin** — create, review, publish, schedule, and bulk-import.
3. After login you land on the dashboard. Everything below is reached from the
   left sidebar.

> Demo super-admin (local only): `superadmin@baalvion.com` / `<set-by-your-admin>`.

---

## 3. Writing editorial content (the CMS)

This is where **articles, news, posts and pages** are written. It's the source for
most public pages, the `/articles` hub, topic pages, and the live `/world` page.

### 3.1 Open the Imperialpedia website

Sidebar → **CMS → Websites → Imperialpedia**
(direct URL: `/cms/websites/imperialpedia`).

Inside the website you'll see: **Content, Categories, Tags, Media, SEO,
Workflows, Calendar, Members**.

### 3.2 Create a piece of content

**Content → New**, then fill in:

| Field | What to put |
|---|---|
| **Type** | `article` (news/analysis), `news` (short, time-sensitive), `post` (evergreen), or `page` (standalone landing page). |
| **Title** | The headline. Clear and specific — this becomes the `<h1>` and the default SEO title. |
| **Slug** | The URL piece (auto-filled from the title). Keep it short, lowercase, hyphenated. |
| **Excerpt** | One-sentence summary. Shown on cards **and** used as the SEO/meta description. Always write one. |
| **Featured image** | The card/hero image. Use the **Media** library or an allowed image URL (see §6). |
| **Category** | Pick one (e.g. Banking, Investing, Markets). Drives where it appears. |
| **Tags** | Optional keywords for grouping/related content. |

### 3.3 Write the body with **blocks**

The body is built from **blocks** (the Block Builder). Click **Add Block** and choose:

- **Paragraph** — normal text.
- **Heading** — section titles (use these — they help readers and SEO).
- **Image** — with alt text + caption.
- **Quote** — pull-quote with optional attribution.
- **Callout** — highlighted note/tip box.
- **Code** — code or formula snippet.
- **Divider** — visual break.
- **Button** — a call-to-action link.
- **Embed / Video** — external link or video.
- **HTML** — raw HTML (advanced; only if you know what you're doing).

Drag blocks to reorder. Use the **Preview** to see exactly how it will look.

### 3.4 Set SEO (do this — it's how you get found)

Open the **SEO** fields on the content:

- **SEO title** — defaults to the title; you can override (aim 50–60 chars).
- **Meta description** — defaults to the excerpt (aim 140–160 chars).
- **Keywords** — a few relevant terms.

Good titles + descriptions are the single biggest lever for search traffic.

### 3.5 Publish or schedule

Content moves through a simple **workflow**:

```
Draft  →  In review  →  Published        (or)  →  Scheduled → (auto-publishes)
```

- **Save Draft** — work-in-progress, not public.
- **Submit for review** — Writers send to an Editor.
- **Publish** — goes live immediately (Editor/Admin).
- **Schedule** — pick a future date/time; it auto-publishes then.

Published content appears on the live site within seconds (a revalidation signal
refreshes the affected pages). If you don't see it, see §7.

---

## 4. Uploading content in bulk (high-volume)

For loading **many** articles at once (migrations, syndication, SEO content packs),
use **Content → Bulk Import** ("Bulk Import Content" dialog). Paste a **JSON array**
or **CSV** and every row is created, categorized, and published in one go.

### JSON format

```json
[
  {
    "title": "Example Article Title",
    "categorySlug": "banking",
    "excerpt": "One-line summary used in cards and SEO.",
    "body": "First paragraph.\n\nSecond paragraph.",
    "publish": true
  }
]
```

### CSV format (header row required)

```csv
title,categorySlug,excerpt,body,publish
Example Article Title,banking,One-line summary,"First paragraph.\nSecond paragraph.",true
```

**Field reference**

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | The headline. |
| `slug` | — | Auto-generated from the title if omitted. |
| `type` | — | Defaults to `article`. |
| `categorySlug` | — | Must match an existing category slug (e.g. `banking`). |
| `excerpt` | — | Summary + SEO description. |
| `featuredImage` | — | Optional. Leave blank to auto-generate original branded artwork from the title/category/tags (see §6) — most articles should omit this. |
| `body` | — | Plain text; blank lines (`\n\n`) become separate paragraphs. |
| `publish` | — | `true` publishes now (default). `false` leaves it as a draft. |
| `scheduledAt` | — | ISO date/time to schedule instead of publishing now. |

Tip: the dialog has **"Insert JSON sample"** and **"Insert CSV sample"** buttons —
start from those. It shows a per-row success/failure report when done.

---

## 5. Glossary terms & entities (structured knowledge)

These are **not** in the CMS — they live in the Imperialpedia knowledge tool.
Sidebar → **Imperialpedia** (`/imperialpedia`).

### Glossary terms — `/imperialpedia/glossary` → **New**
Investopedia-style definitions. Fields: **term**, **definition**, optional
**formula**, **examples**, and **related terms**. These power the `/glossary`
section and the in-article term tooltips.

### Entities — `/imperialpedia/entities` → **New**
Knowledge-graph nodes — **companies, people, places** — keyed by **type** and
**slug** with a **name**. Used for structured/SEO entity pages and linking.

---

## 6. Images & media

- **Leave `featuredImage` blank.** The CMS automatically generates original,
  on-brand artwork for every article from its title, category, and tags the
  moment you publish (or re-generates it if you rename the article later) — no
  stock photos, no external image hosts, nothing to source or upload.
- Prefer the **Media** library only when you need a *specific* real photo
  (e.g. an executive headshot, a screenshot). Uploaded media is served from
  this site's own storage — external image URLs (Unsplash, Picsum, Placehold,
  or any other third-party host) are not allowed, for licensing and
  performance reasons.
- Always add **alt text** (accessibility + SEO) for any image you do upload.
- Use landscape images around **1200×675** for featured/hero images.

---

## 7. "I published it but don't see it" — quick fixes

| Symptom | Fix |
|---|---|
| Article not on the site | Confirm status is **Published** (not Draft/In review). |
| Still not showing after a minute | The page caches briefly; wait ~1–5 min or re-publish. |
| Image is broken | The URL host isn't allowed (see §6) — upload to Media instead. |
| Wrong/empty category page | Make sure a **Category** is selected. |
| Bulk import row failed | Read the error in the import report — usually a bad `categorySlug` or duplicate slug. |

---

## 8. Quality checklist (before you hit Publish)

- [ ] Clear, specific **title** (becomes the `<h1>` + SEO title)
- [ ] A one-sentence **excerpt** (becomes the meta description)
- [ ] A **featured image** with **alt text**
- [ ] One **category** + a few **tags**
- [ ] Body uses **headings** to break up sections
- [ ] Links work; no placeholder text left in
- [ ] Previewed it
- [ ] SEO title ≤ 60 chars, meta description ≤ 160 chars

---

## 9. Where your content shows up

| Content | Appears on |
|---|---|
| Article / News | `/articles`, category & topic pages, and the live `/world` page feed |
| Post / Page | Its own URL (`/<slug>`) and any section it's linked from |
| Glossary term | `/glossary` and as tooltips inside articles |
| Entity | Structured entity pages and internal links |

---

## 10. Controlling the live World page (`/world`) from the admin panel

The `/world` markets-and-news page is **driven by the CMS** — whatever you
publish takes over the feed automatically (it falls back to wire headlines only
when the CMS has nothing yet). Market prices are always live.

- **Publish a `news` or `article`** → it appears in the World **hero / Latest /
  sections** (newest first). The top item becomes the lead story.
- **Target a region** (US / Europe / Asia / China / Emerging): create a
  **Category** whose **slug** matches the region — `us`, `europe`, `asia`,
  `china`, `emerging` — and assign your content to it. That content then leads
  the matching region page (e.g. `/world/europe`). Uncategorized content shows
  across the general World feed.
- The page refreshes within ~2 minutes of publishing.

So: to control the World news, just publish (and optionally region-categorize)
content in the CMS — no code, no config.

---

That's it — pick the right tool (§1), fill the form, publish. Welcome to the
Imperialpedia newsroom.
