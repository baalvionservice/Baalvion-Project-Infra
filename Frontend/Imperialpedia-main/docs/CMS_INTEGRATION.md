# Imperialpedia ↔ Baalvion CMS Integration

How content authored in **admin-platform** becomes live on the **Imperialpedia** website.

## Architecture (Hybrid)

Imperialpedia content has two owners, by type:

| Concern | Owner | Schema | Port | Notes |
|---|---|---|---|---|
| **Editorial** (articles, news, pages, docs) | **cms-service** | `cms` | 3018 | Multi-site CMS. Imperialpedia is the website with slug **`imperialpedia`** (`id f963f97f-e03f-4383-bac3-d8849e9a7c71`). Authored & published from **admin-platform** (`/cms`). |
| **Structured / interactive** (companies, markets, calculators, community, leaderboard, creators) | **imperialpedia-service** | `imperialpedia` | 3004 | Domain APIs the public site calls directly. |

The public Imperialpedia frontend (Next.js, **:3029**) reads **published** editorial content from cms-service's
unauthenticated public delivery API and renders it through the existing content-engine components.

```
 admin-platform (:3030)                 cms-service (:3018)                 Imperialpedia (:3029)
 ───────────────────────                ─────────────────────               ──────────────────────
 author content ──POST /cms/websites/:id/content──▶ cms_contents (draft)
 publish ───────POST …/content/:cid/workflow/transition {action:"publish"}──▶ status=published
                                        GET /public/imperialpedia/content?contentType=article ◀── server fetch
                                        GET /public/imperialpedia/content/:slug              ◀── server fetch
                                                                            renders list + detail (live)
```

## The publish pipeline

1. **Author** — admin-platform CMS editor → `POST /api/v1/cms/websites/:websiteId/content` (contentType `article`).
2. **Publish** — `WorkflowPanel` → `cmsWorkflowApi.transition` →
   `POST /api/v1/cms/websites/:websiteId/content/:contentId/workflow/transition` with `{ action: "publish" }`.
   - Roles: platform `super_admin/owner/admin` bypass CMS membership (act as `cms_admin`); otherwise needs
     a `cms_publisher`+ membership on the website.
   - "Publish Directly" (draft→published) is supported as well as the review path (draft→review→approved→published).
3. **Read** — the public site reads only `status=published, visibility=public` rows.

## Frontend wiring (this site)

- [`src/services/data/cms-public.ts`](../src/services/data/cms-public.ts) — server-side fetch client to the CMS
  public API + `cmsContentToArticle()` mapper + `blocksToHtml()` (CMS content blocks → HTML body).
- [`src/services/data/articles-service.ts`](../src/services/data/articles-service.ts) — now reads live CMS
  content first; falls back to the legacy mock set only when the CMS has **no** published articles yet or
  cms-service is unreachable (so the page is never empty during cutover).
- [`src/modules/content-engine/components/ArticlePage.tsx`](../src/modules/content-engine/components/ArticlePage.tsx)
  — renders `article.body` (the CMS-block HTML) when present.
- `.env.local`:
  ```
  NEXT_PUBLIC_CMS_PUBLIC_URL=http://localhost:3018/api/v1/public
  NEXT_PUBLIC_CMS_SITE_SLUG=imperialpedia
  ```

> CMS reads run **server-side** (RSC) — cms-service only allow-lists a few dev origins for browser CORS, and
> server fetches avoid CORS entirely. `:3029` was added to cms-service `CORS_ORIGINS` as a safety net.

## Live domains

- **Articles** (`contentType: article`) — `/articles` list + `/articles/[slug]` detail. Data: `articles-service.ts`.
- **News** (`contentType: news`) — `/news` list (`src/app/news/page.tsx`, async; live + static `data.news` fallback) and
  the root `/[slug]` detail renderer (`src/app/[slug]/page.tsx`, which is the news detail page — list links go to `/${slug}`).
  Data: `cms-public.ts` `getPublishedNews` / `getPublishedNewsBySlug` + `cmsContentToNews` / `blocksToNewsBody`.

## Recipe — add the next content domain

Articles + News above are the templates. To bring another editorial domain live:

1. **CMS** — ensure the content type is in the website's `modules` (Imperialpedia already has
   `["pages","article","doc"]`; add `"news"` to its `cms_websites.config` modules if needed). Author content of
   that `contentType` and publish it.
2. **Frontend data layer** — in the domain's service (e.g. `news-service.ts`), call
   `listCmsContent({ contentType: "news" })` / `getCmsContentBySlug(slug)` from `cms-public.ts`, then write a
   small `cmsContentTo<Domain>()` mapper (mirror `cmsContentToArticle`). Keep the mock fallback.
3. **Render** — if the page renders a rich body, use `blocksToHtml()` (or map blocks to the domain's section model).
4. **Verify** — publish one item, then load the public page; confirm it appears and the mock fallback disappears.

Structured domains (companies/markets/etc.) go to **imperialpedia-service** instead, not the CMS.

## cms-service fixes made for this integration

- `revisionService.createRevision` now derives the next revision number from `MAX(revision_number)` rather than
  the denormalized `revisionCount` (which drifts and collided with the `(content_id, revision_number)` unique index).
- `createRevision` runs on the **caller's transaction** — previously its `content.increment()` opened a second
  connection and self-deadlocked against the workflow transaction's row lock (pool timeout → rollback → publish
  silently failed).
- `auditService.logWorkflowAction` likewise runs on the caller's transaction — `cms_approval_logs` has an FK to
  `cms_workflows`, so its INSERT's FK check on the locked workflow row was a second self-deadlock source.
- `workflowService` `publish` transition now allows `from: ['approved','draft']`, matching the admin UI's
  "Publish Directly" action.

With these, the real transition endpoint publishes reliably (verified HTTP 200 publishing a draft straight through).

## Run / verify locally

```
# backends run under pm2 (auth, session, oauth, admin, commerce, cms, realtime …); Postgres/Redis in Docker
pm2 restart cms-service
pm2 start <repo>/Frontend/Imperialpedia-main/node_modules/next/dist/bin/next \
    --name imperialpedia-web --cwd <repo>/Frontend/Imperialpedia-main -- dev -p 3029

curl http://localhost:3018/api/v1/public/imperialpedia/content?contentType=article   # published list
# → http://localhost:3029/articles  and  /articles/<slug>  render the live content
```

`scripts/_publishProof.cjs` in cms-service mints a canonical super-admin RS256 token (from
`Backend/services/identity/.keys/jwt_private.pem`) and publishes a content id via the real transition endpoint —
handy for seeding published state during dev.
