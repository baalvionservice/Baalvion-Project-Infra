<div align="center">

**The public marketing site for the Baalvion trade platform — a statically exported Next.js app covering the platform, the three trade roles, and the company, with no backend of its own.**

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Static export" src="https://img.shields.io/badge/output%3A%20export-1f2937?style=for-the-badge">
</p>

<sub><a href="#overview">Overview</a> · <a href="#architecture">Architecture</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#getting-started">Getting started</a> · <a href="#project-structure">Structure</a></sub>

</div>

---

## Overview

**Baalvion Marketing** (`baalvion-marketing-web`) is the top-of-funnel site for the Baalvion trade
platform: what the platform does, what it does for each of the three roles in a trade, and how to
get in touch. It hands every authenticated journey off to the Trade Portal — it holds no product UI
and no account surface.

- **Dev port:** `3044` (`next dev --turbopack -p 3044`)
- **Canonical host declared in code:** `https://baalvion.com` (`src/lib/site.ts`) — **contested,
  see [Status](#status--known-issues)**
- **Build output:** a pure static export (`output: 'export'`, `images.unoptimized`) — no server
  runtime, no data fetching, no auth
- **Hand-off target:** `https://trade.baalvion.com` (and `/login`), from `TRADE_PORTAL` in
  `src/lib/site.ts`

## Architecture

### Routes

Eleven pages, all pre-rendered at build time:

| Route | Page |
|---|---|
| `/` | Home — hero, platform overview, benefits, how it works, journey, testimonials, stats, FAQ, CTA |
| `/platform` | What the platform does across the procurement lifecycle |
| `/solutions` | The three roles side by side |
| `/solutions/buyers` · `/solutions/sellers` · `/solutions/trade-agents` | One page per role |
| `/about` | Why Baalvion exists, story, leadership |
| `/resources` | Guides and FAQs |
| `/contact` | Contact form and business details |
| `/legal/privacy` · `/legal/terms` | Policies (both set `robots: { index: false }`) |

Plus `not-found.tsx`, and `robots.ts` / `sitemap.ts`, which are marked `dynamic = 'force-static'`
so the static export emits them as files.

### Content model

No CMS and no fetching — copy lives in two typed modules:

- `src/lib/site.ts` — `SITE` (name, url, title, description, which also feeds `metadataBase`, the
  title template and the Organization JSON-LD in `layout.tsx`), `TRADE_PORTAL`, `NAV_LINKS`, and
  `ROLE_META`.
- `src/lib/solutions-content.ts` — `SOLUTIONS_CONTENT`, keyed by the `Role` union
  (`buyers | sellers | trade-agents`). The three role pages render from it through one shared
  `role-solution` section, so a role page is a content entry rather than a new layout.

### Design system

Styling comes from the shared workspace package rather than a local theme: `src/app/globals.css`
imports `@baalvion/design/base.css`, and `tailwind.config.ts` extends
`require('@baalvion/design/tailwind')` as a preset. Type is loaded via `next/font/google` in
`src/app/fonts.ts` — Space Grotesk (display), Inter (text), IBM Plex Mono (data/labels).

## Tech Stack

Next.js 15.5.21 (App Router, static export) · React 19 · TypeScript · Tailwind CSS ·
`@baalvion/design`. That is the entire dependency list — no UI kit, no animation library, no data
layer.

## Getting Started

```bash
pnpm install
pnpm run dev        # http://localhost:3044
pnpm run build      # static export
pnpm run typecheck
```

## Project Structure

```
src/
  app/
    page.tsx  platform/  solutions/{,buyers,sellers,trade-agents}/
    about/  resources/  contact/  legal/{privacy,terms}/
    layout.tsx  not-found.tsx  loading.tsx  error.tsx  global-error.tsx
    robots.ts  sitemap.ts  fonts.ts  globals.css  icon.svg
  components/
    sections/   # hero · platform-overview · platform-pillars · platform-org-benefits ·
                # key-benefits · how-it-works · why-baalvion · customer-journey ·
                # role-solution · testimonials · stats · home-faq · about-story · about-leadership
    ui/         # cta-band · faq-accordion · page-hero · stat-grid
    site-header.tsx  site-footer.tsx  contact-form.tsx  logo-mark.tsx  reveal.tsx
  lib/
    site.ts  solutions-content.ts
```

## Status / Known issues

**This app is pre-launch and has open items that must be closed before it is published.**

- **Two apps claim `baalvion.com`.** This app declares `url: 'https://baalvion.com'` in
  `src/lib/site.ts`. `Frontend/baalvion-com-main` (`baalvion-com-web`, dev port `3043`) declares
  the same apex in `src/lib/content.ts`. Only one can own the domain, and nothing in the repo
  settles which: the site registry (`Backend/packages/sites/src/registry.ts`) lists the `baalvion`
  entry with `domains: ['baalvion.com', 'www.baalvion.com']` and attributes it to backend services
  (`about-service`, `cms-service`), not to a frontend app. **Open question — it needs a decision,
  not a default.**
- **Placeholder content is still in the pages**, each flagged in a source comment: testimonial
  quotes (`sections/testimonials.tsx`), the "by the numbers" figures (`sections/stats.tsx`),
  leadership names and milestones (`sections/about-leadership.tsx`), and the office/business
  details on `/contact`. None of it is verified; none of it should ship as-is.
- **The contact form has no handler.** `components/contact-form.tsx` is a client-side placeholder
  that sets a success state without sending anything — consistent with a static export, which has
  no server to post to. It needs a real endpoint.
- **`/legal/privacy` and `/legal/terms` are `noindex` but are still listed in `sitemap.ts`.**
- **No deployment configuration exists for this app in the repo** — no Dockerfile, no `vercel.json`,
  and no CI or compose reference (the only mention outside its own directory is the workspace entry
  in `pnpm-lock.yaml`). Whether `baalvion.com` currently serves this app was not verified.

---

<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
