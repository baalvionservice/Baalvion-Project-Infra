<div align="center">

**The public index of every product Baalvion builds and operates — generated from the platform's own site registry, so the catalogue cannot describe a portfolio that does not exist.**

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Docker standalone" src="https://img.shields.io/badge/output%3A%20standalone-2496ED?style=for-the-badge&logo=docker&logoColor=white">
</p>

<sub><a href="#overview">Overview</a> · <a href="#architecture">Architecture</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#getting-started">Getting started</a> · <a href="#project-structure">Structure</a></sub>

</div>

---

## Overview

**Baalvion Stack** (`baalvion-stack-web`) is the portfolio hub: one page listing every property the
group runs, one page per property, and the operating status of each stated plainly rather than
dressed up. It is the complete index, not a selection — products that do not serve traffic are
listed and labelled, not hidden.

- **Dev port:** `3072` (`next dev -p 3072`)
- **Canonical host declared in code:** `https://baalvionstack.com` (`metadataBase` in
  `src/app/layout.tsx`, and the base URL in `robots.ts`, `sitemap.ts`, `llms.txt/route.ts` and
  `structured-data.ts`) — see [Status](#status--known-issues); not verified as serving
- **Build output:** `output: 'standalone'`, with every page statically rendered at build time
- **Only workspace dependency:** `@baalvion/sites`

## Architecture

### The registry is the only source of products

`src/lib/products.ts` opens with the rule the whole app is built on: there is exactly one source
for which products exist, what they are called, where they live and whether they are running —
the `@baalvion/sites` registry (`Backend/packages/sites`). This file adds editorial copy on top of
it and nothing else.

That split exists because the registry already had to supersede four hand-maintained product
arrays that had drifted apart (`auth-service`'s `brandFromOrigin`, `notification-service`'s brands,
`admin-service`'s `platformRegistryService`, and `about-baalvion`'s `network.ts`, which still
listed 11 products while the registry knew 19). A second hardcoded array here would buy the same
gap back.

So the layering is:

| Layer | Source | What it decides |
|---|---|---|
| Identity | `SITES` from `@baalvion/sites` | which products exist, `id`, name, domains, `status`, services, payment rails |
| Copy | `COPY` in `src/lib/products.ts`, keyed by registry `site_id` | category, the property's own tagline, one factual description, capabilities |
| Presentation | `CATEGORY_ORDER`, `productsByCategory()`, `counts()` | grouping and headline numbers, all derived |

A registry site with no `COPY` entry still renders — with its registry name, no description, and a
fallback category. A missing description shows as missing.

Rules the mapping enforces in `toProduct()`:

- **A link only if it is live.** `href` is set only when `status === 'live'` and a domain exists;
  linking a not-live domain would send visitors to a dead host and make the status label read as
  decoration.
- **A screenshot only if one was actually captured.** `image` requires both `live` and membership
  of the explicit `CAPTURED` set (14 ids, matching the files in `public/products/`), so a live
  property whose capture failed falls back to the no-image layout instead of rendering a broken
  `<img>`.
- **Counts are derived, never typed in** — `counts()` computes total / live / in development /
  internal from the registry (19 entries at the time of writing).
- **Status is stated, not softened.** `STATUS_LABEL` maps `live` / `not_live` / `internal` to
  "Live" / "In development" / "Internal", and `StatusChip` renders it as a leading rule rather
  than a pill.

### Routes

| Route | Rendering |
|---|---|
| `/` | `dynamic = 'force-static'` — hero, then products grouped by category |
| `/products/[slug]` | `generateStaticParams()` over `PRODUCTS`, `dynamicParams = false` — one static page per registry id |
| `/sitemap.xml` | Generated from `PRODUCTS`; live properties get priority `0.8`, others `0.4` |
| `/robots.txt` | Allow-all, with sitemap and host |
| `/llms.txt` | A `force-static` route handler: a plain-text portfolio summary for AI crawlers, with each entry's real status and an explicit note that no visitor counts, revenue, funding or founding dates exist in the source |

The slug is the registry's stable `site_id`, so product URLs never depend on a display name.

### Navigation and structured data, also derived

`buildMenus()` in `layout.tsx` builds the mega-menu panes from `productsByCategory()`, so a newly
registered product appears in the navigation the same way it appears everywhere else — there is no
menu list to maintain. `Nav.tsx` keeps every link in the HTML and hides closed panels with `hidden`
rather than unmounting them, so the whole catalogue stays crawlable.

`src/lib/structured-data.ts` emits an Organization graph whose `owns` edges point at each live
property's real domain, plus catalogue and per-product graphs — the point being to state that these
properties are one company's portfolio rather than unrelated domains. It deliberately emits no
`aggregateRating`, `review`, `foundingDate`, employee counts or awards: there is no verified source
for any of them.

## Tech Stack

Next.js 15.5.21 (App Router) · React 19 · TypeScript · Tailwind CSS · `@baalvion/sites`.
IBM Plex Sans / IBM Plex Mono via `next/font/google`; the palette is a small set of HSL custom
properties (`ink`, `paper`, `paper-alt`, `muted-ink`, `line`, `accent`) surfaced through
`tailwind.config.ts`.

## Getting Started

```bash
pnpm install
pnpm run dev        # http://localhost:3072
pnpm run build
pnpm run typecheck
```

`@baalvion/sites` is a `tsup` package whose `dist/` is gitignored, so it must be built before this
app can resolve it — run through Turborepo from the repo root, or build the package first.

## Project Structure

```
src/
  app/
    page.tsx                  # the catalogue index
    products/[slug]/page.tsx  # one page per registered product
    llms.txt/route.ts  robots.ts  sitemap.ts  layout.tsx  globals.css
  components/
    Nav.tsx          # registry-driven mega menus
    StatusChip.tsx   # live / in development / internal
  lib/
    products.ts        # registry -> Product, plus the editorial COPY layer
    structured-data.ts # Organization, catalogue and product JSON-LD
public/products/       # 14 homepage screenshots of live properties
Dockerfile             # repo-root build context, via turbo prune
deploy/README.md       # VPS compose service + Caddy block
```

## Status / Known issues

- **The catalogue is baked in at build time.** The registry is read during `next build`, so the
  image is a snapshot of the registry at that moment — registering a new product means rebuilding
  and redeploying. `Dockerfile` and `deploy/README.md` both call this out as the intended trade for
  having one source of truth and no runtime drift.
- **Deployment is manual.** `deploy/README.md` documents the VPS path (a `baalvion-stack-web:local`
  image, an `app-stack-web` compose service on port 3072, and a Caddy block for the apex and
  `www`). No CI workflow or compose file in this repo references this app.
- **Whether `baalvionstack.com` serves this app was not verified here.** `deploy/README.md` records
  that at the time it was written the apex resolved to Cloudflare with no working origin, which
  also blocks Caddy's ACME challenge. Treat the host as declared in code, not confirmed live.
- **`proxy.baalvionstack.com` is a different product.** It is the `proxy` entry in the registry
  (`Frontend/Proxy-BaalvionStack`), served independently; the deploy notes explicitly leave that
  DNS record alone.

---

<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
