# baalvion.com — Corporate Identity Hub

The flagship corporate site for Baalvion: a global infrastructure intelligence
company operating across trade, markets, and ecosystem systems.

**Strictly corporate layer.** This site is an identity hub and portfolio index.
It contains no product UI, no dashboards, no authentication, and no backend
logic. The product layer (trade/mining/market/jobs/connect/dashboard
subdomains) and independent brands are referenced as links only.

## Stack

- Next.js 15 (App Router), React 19, TypeScript strict
- Tailwind CSS 3 over a token-based design system (`src/app/globals.css`)
- Zero client-side data fetching; one tiny client component (scroll reveal)
- All copy lives in `src/lib/content.ts` — single source of truth

## Architecture

```
src/
├── app/
│   ├── layout.tsx           # fonts, metadata, Organization JSON-LD
│   ├── page.tsx             # the single corporate page (hero → company → domains → network → closing)
│   ├── globals.css          # design tokens + institutional utilities
│   ├── opengraph-image.tsx  # generated OG card (next/og)
│   ├── icon.svg             # three-bar layer mark
│   ├── robots.ts / sitemap.ts
│   └── not-found.tsx
├── components/              # header, footer, wordmark, reveal
└── lib/content.ts           # ALL copy + portfolio index data
```

## Run

```bash
pnpm --filter baalvion-com-web install
pnpm --filter baalvion-com-web build
pnpm --filter baalvion-com-web start   # serves on :3040
```

Dev: `pnpm --filter baalvion-com-web dev` (Turbopack, :3040).

## Design system

- Ground `#090c11`, surface `#10141a`, hairlines at 8% white
- Text `#f6f5f3`, muted `#99a1ad`, accent `#ff9900` (Baalvion orange — labels,
  index numbers, and the primary CTA only)
- Type: Inter Tight (display) + Inter (body), self-hosted via `next/font`
- Motion: opacity/transform reveals only; `prefers-reduced-motion` honored
