# Stocks Pillar — Build Status

Status snapshot for the `/stocks` rebuild (imperialpedia.com/stocks), based on the 17-section
spec modeled after `/investing`. Written 2026-07-15.

## Completed

- **`/stocks` route rebuilt on the CMS-first pattern.** Replaced the legacy hardcoded page
  (`data.stocks.ts` — empty `featured`/`latest` arrays, fake NVDA/TSLA prices, 2 placeholder
  guides) with `StocksHub`, modeled on the real `InvestingHub` component: live CMS → baked
  static snapshot → bundled demo fallback, same as every other topic page. Deleted the dead
  `data.stocks.ts`, `stocks-tab.ts`, `ExploreStocksSection.tsx`, `StocksArticleCard.tsx`,
  `data.faq.ts`.
- **72 long-form articles** (~550–900 words each) seeded as CMS content specs across:
  - Stock Basics (11)
  - How the Stock Market Works (10)
  - Beginner Investing (9)
  - Types of Stocks (12)
  - Market Metrics (11)
  - Investing Strategies (9)
  - Stock Analysis (10)
  - Seeded via `scripts/seed-stocks.cjs` (idempotent create/update/publish against the CMS) and
    baked into the static fallback via `scripts/generate-static-content.cjs`.
- **Company profiles**: extended `/companies` with Apple, Microsoft, Amazon, Tesla, Alphabet,
  Meta, Berkshire Hathaway (NVIDIA already existed).
- **8 market indexes** at `/stocks/indexes` (S&P 500, Nasdaq, Dow Jones, Russell 2000, FTSE 100,
  Nikkei 225, Sensex, Nifty 50).
- **11 stock lists** at `/stocks/lists` (Top, Trending, Dividend, AI, Technology, Banking,
  Energy, Healthcare, EV, Semiconductor, High Growth), data-driven off company tags.
- **54 new glossary terms** added to `terms.ts` (Bull/Bear Market, IPO, Margin Call, 10-K, Short
  Selling, VIX, etc.).
- **4 new calculators**: CAGR, Dividend, Position Size, Profit/Loss (existing Compound Interest
  and Investment calculators already covered part of section 16).
- **FAQ bank** at `/stocks/faq` — aggregates every stocks article's FAQ data, deduped (100+
  entries once seeded live).
- **Homepage** (`StocksHub`) ties every section together: expanded hero (What Are Stocks / Why
  Invest / How They Work / Benefits & Risks), section explorer, "Learn Stock Investing" path,
  popular companies/indexes/lists, tools, glossary link, aggregated FAQ, related topics.
- Verified: `tsc --noEmit` clean, `eslint` clean, `node scripts/seed-stocks.cjs --dry` validates
  all 72 specs (word count, slug, SEO title length).

## Not Done / Deferred

- **Glossary at scale.** Spec envisions 300–500 terms; only 54 stock-specific terms were added
  in this pass. The pipeline (`terms.ts` → `scripts/extract-terms.ts` → backend entity seed) is
  the same one used for the rest of the glossary and can be re-run with additional batches.
- **Company profiles at scale.** Spec envisions thousands of company pages; only 8 flagship
  companies were seeded. The existing `/companies/[slug]` entity system supports adding more via
  the same `companies.json` schema (or its live `imperialpedia-service` entity backend) at any
  time — no new code needed, just more data.
- **Live CMS seed not run.** `seed-stocks.cjs --dry` validated cleanly, but the actual `POST` to
  cms-service has not been executed against any environment (local or prod) — content is
  currently served from the static fallback snapshot only. Needs `AUTH_URL` / `CMS_URL` /
  `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` for the target environment before running for real.
- **`extract-terms.ts` not run.** The 54 new glossary terms exist in the frontend's static
  `terms.ts` but haven't been exported to `imperialpedia-service`'s entity seed file, so they
  won't show up via the live glossary API until that export + backend seed step runs.
- **Calculators are client-only math**, not wired to the shared `calculatorsService` /
  `useCalculatorStore` used by the original Compound Interest / Investment tools — a deliberate
  scope call to avoid touching shared state management for four "later"-priority tools.
- **No dedicated E2E/visual regression tests** were added for the new pages.
- **"Related Topics" footer** was added only to the `/stocks` hub page, not retrofitted onto
  every individual article — doing that sitewide would touch the shared `ArticlePage` template
  used by every pillar (investing, personal-finance, economy), which is out of scope for a
  stocks-only change.
