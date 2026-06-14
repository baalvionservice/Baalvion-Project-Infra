# Baalvion Mining Inc. — Web Platform

Public-facing website and B2B trade portal for **Baalvion Mining Inc.**, a global mining and commodity supply network operated by Baalvion Industries Private Limited.

**Production domain:** https://mining.baalvion.com

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI)
- **AI:** Google Genkit (Gemini) — optional, degrades gracefully without a key
- **Auth:** `@baalvion/auth-sdk` → central auth-gateway BFF
- **CMS:** Central `cms-service` (`:3018`) via `@/lib/cms`
- **Package manager:** pnpm (monorepo workspace)

## Development

```bash
pnpm install          # from monorepo root
pnpm run dev          # starts on :3028 (turbopack)
pnpm run typecheck    # tsc --noEmit
pnpm run lint         # eslint
pnpm run build        # typecheck + next build
```

Optional AI flows (requires `GEMINI_API_KEY`):

```bash
pnpm run genkit:dev
```

## Environment

Create `.env.local` at the app root:

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3099
NEXT_PUBLIC_CMS_API_URL=http://localhost:3018
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # optional
GEMINI_API_KEY=                               # optional — AI flows fall back gracefully
```

## Key Directories

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router pages and route layouts |
| `src/components/layout/` | Navbar, Footer, CookieConsent |
| `src/components/pseo/` | Programmatic SEO trade corridor pages |
| `src/lib/cms.ts` | Central CMS integration (live + fallback) |
| `src/lib/sitemap-data.ts` | Sitemap registry — products, suppliers, blog, guides |
| `src/ai/flows/` | Genkit AI flows (compliance, market insights, product descriptions) |
| `src/services/` | Business logic for inventory, leads, orders |

## Notes

- AI flows degrade to schema-valid fallbacks when `GEMINI_API_KEY` is absent — no build or runtime crash.
- The CMS integration (`src/lib/cms.ts`) reads from the central `cms-service`. Do not mock or replace this.
- Auth is centralized via `@baalvion/auth-sdk` — do not add a second JWT issuer.

Built with [Claude Code](https://claude.ai/claude-code).
