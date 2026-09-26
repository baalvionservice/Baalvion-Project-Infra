# Imperialpedia Market Entity Page Standard v1

Every page that renders a single tradable instrument (stock, index, crypto,
commodity, forex pair, or bond yield) must meet this bar. It was extracted
from the production-hardening pass on `QuotePage` in
[`src/app/markets/quote/[symbol]/page.tsx`](../src/app/markets/quote/%5Bsymbol%5D/page.tsx)
— treat that function as the reference implementation when building or
auditing another market template. Related:
[ARTICLE_STANDARD.md](./ARTICLE_STANDARD.md) (this standard reuses its
canonical-URL, breadcrumb-parity, and no-fabrication rules) and
[STRUCTURED_ENTITIES.md](./STRUCTURED_ENTITIES.md) (the company/industry
knowledge-graph entities this page enriches itself with).

Nothing in this standard authorizes fabricating content. Every field below is
either a structural description of content that's already visible on the
page, or omitted when the underlying data doesn't support it.

## 0. Data sources (know which system owns what)

- **Live price/chart/fundamentals/indicators**: imperialpedia-service
  `/assets/:symbol/detail` (`src/lib/data/marketsLoader.ts` →
  `getAssetDetail`). No static fallback — a stale bundled price would
  misrepresent itself as current, so an outage surfaces as "No live quote
  available" or `notFound()`, never a fabricated number.
- **Rich company facts** (description, founders, HQ, sameAs, FAQ, logo):
  the knowledge-graph `CompanyEntity` (`src/lib/data/loaders.ts` →
  `getCompanyByTicker`), matched by ticker. Only ~10% of tracked symbols
  currently have a matched entity — every section fed by it must render
  nothing (not a placeholder) when there's no match.
- **Tracked symbol list**: `ALL_TRACKED_SYMBOLS` in `marketsLoader.ts` (from
  `MARKET_GROUPS`) is the one source of truth for "which quote pages exist."
  The sitemap, `generateStaticParams`, and any future markets index page must
  all read from this constant, not maintain a second copy.

## 1. Route & rendering strategy

- [ ] `export const revalidate = 30` (segment-level ISR) — matches the
      `next: { revalidate: 30 }` window already set on the underlying fetch.
      **Never combine this with `export const dynamic = "force-dynamic"`** —
      force-dynamic forces every fetch in the route to `cache: 'no-store'`,
      silently overriding the fetch-level revalidate and making every
      request pay a full backend round-trip for nothing.
- [ ] `generateStaticParams` returns `ALL_TRACKED_SYMBOLS` so the pages this
      site actually links to are pre-rendered; `dynamicParams = true` so an
      untracked symbol still resolves on demand instead of 404ing outright.
- [ ] The `(symbol, range)` detail lookup is wrapped in React's `cache()` and
      called identically from `generateMetadata` and the page component —
      one backend round-trip per request, not two.
- [ ] `?range=` is validated against the known enum server-side before use;
      an invalid value falls back to a default rather than passing through
      to the backend or crashing.

## 2. Metadata (`generateMetadata`)

- [ ] `title`/`description` are asset-type-aware (a stock says "Stock
      Price"; a forex pair or commodity doesn't), never one generic template
      for every instrument type.
- [ ] `description` prefers the asset's own live `ai_summary` (real,
      backend-generated) and only falls back to a templated sentence built
      from real fields (name/symbol/exchange) when no summary exists —
      truncated to ~157 chars at a boundary, never sent unbounded.
- [ ] `canonical` is always the bare `/markets/quote/[symbol]` — **never**
      includes `?range=`. All range variants of the same instrument
      canonicalize to one URL so ranges don't fragment into duplicate,
      competing pages in the index.
- [ ] `keywords` built from the asset's own real fields (name, symbol,
      exchange, type label, matched company's industry) — never the sitewide
      default list.
- [ ] `ogImage` only overrides the default when a matched company has a
      `logo` **and** it passes `isAllowedImageHost()` — never a fabricated or
      unverified image URL reaches `og:image`.
- [ ] A missing/unknown symbol returns `noIndex: true` metadata (not just a
      404 body) — an indexed 404 wastes crawl budget and can rank as thin
      content.

## 3. Structured data (JSON-LD)

One `<script>` block per schema type; omit optional fields with no real
value instead of sending them empty (see ARTICLE_STANDARD.md §2 — the same
rule applies here). This page emits, at most:

- [ ] **`Corporation`** (public stock — schema.org has no dedicated
      "Stock"/"Equity" type, so the company itself is the entity) or
      **`FinancialProduct`** (every non-stock instrument: crypto, forex,
      commodity, index, bond yield) with `@id` = `{canonicalUrl}#entity`.
      - `tickerSymbol` on stocks only.
      - `additionalProperty` (`PropertyValue`) carries `assetType` and
        `exchange` — schema.org has no first-class property for either, and
        `additionalProperty` is the documented escape hatch, not a made-up
        field name.
      - When a `CompanyEntity` is matched: `legalName`, `foundingDate`
        (from `founded_year`), `address` (from `headquarters`, plain text —
        no fabricated `PostalAddress` structure from an unstructured
        string), `numberOfEmployees`, `sameAs` (entity's verified `sameAs`
        **plus** its real `website` — never the other way into `url`),
        `logo` (only if `isAllowedImageHost()` passes), `founder` (Person[]
        from `founders`), `employee` (CEO + `executives`, each a real named
        role), `parentOrganization`.
      - `url` is **our own page** (matches the existing
        `structuredData.entity()` convention used by `/companies/[slug]`)
        — the company's real homepage lives under `sameAs`, not `url`.
- [ ] **`BreadcrumbList`** (`@id` = `{canonicalUrl}#breadcrumb`) — must
      match the visible breadcrumb `<nav>` exactly, built from the *same*
      array. A crumb is only included when it maps to a real route
      (`ASSET_TYPE_HUB` in the reference implementation) — there is no
      generic "/markets" crumb because that route does not exist in this
      app. Forex and index instruments currently have no safe parent hub and
      get a 2-level breadcrumb (Home / Name) rather than a fabricated one.
- [ ] **`WebPage`** (`@id` = canonical URL) with `mainEntity: { "@id":
      "{canonicalUrl}#entity" }` and `breadcrumb: { "@id":
      "{canonicalUrl}#breadcrumb" }` — cross-references the other two blocks
      by `@id` (Google explicitly supports resolving `@id` references across
      separate JSON-LD script tags on the same page) rather than duplicating
      their content. Carries `speakable` pointing at the H1 + the on-page
      key-facts block.
- [ ] **`Dataset`** — only when `detail.historical` has 2+ valid, parseable
      dates. Describes the historical OHLCV series (`variableMeasured`,
      `temporalCoverage` from the real first/last dates) — no
      `distribution`/`DataDownload` block, since there's no real
      downloadable file to point at.
- [ ] **`FAQPage`** — only when the matched `CompanyEntity.faq` array is
      non-empty. Never generate placeholder Q&A for an instrument with no
      real FAQ content (unmatched tickers, non-corporate instruments).

## 4. Financial entity structure

Every quote page renders (only the sections with real data — never an empty
shell):

1. **Breadcrumb** — Home → optional real asset-type hub → instrument.
2. **Overview / key facts** (`data-key-facts` — also the `speakable`
   target) — ticker, type, exchange, and, when a company is matched:
   industry (linked to `/industries/[slug]`), founding year, headquarters,
   plus the real description/`ai_summary`.
3. **Market snapshot** — live price, change, market status.
4. **Historical data** — range-selector + chart, `<QuoteChart>` lazy-loaded
   via `next/dynamic` (keeps the recharts bundle out of the initial JS for a
   below-the-fold widget) and captioned with a screen-reader-only summary of
   the real displayed price/change (never fabricated commentary).
5. **Key statistics / technical indicators** — only the fields the backend
   actually returned for this asset type (bonds/forex have no indicators;
   render "Not available for this asset type," not empty rows).
6. **Company information** — only rendered when a matched `CompanyEntity`
   has at least one real field to show (legal name, HQ, founders, CEO,
   products, website) — links out to the full `/companies/[slug]` profile.
7. **Related companies & peers** — merges `detail.relatedCompanies` (other
   tracked tickers from the live feed) with the matched company's resolved
   `competitors`/`industry`/`country` via the existing
   `getRelatedEntities()` helper — no second relationship-resolution
   mechanism.
8. **Related news** — links via the shared `articleUrl(publishedAt, slug)`
   helper (the canonical `/YYYY/MM/DD/slug` scheme), never a bare `/news/
   [slug]` path (that route doesn't exist in this app and 404s).
9. **FAQ** — only when real, editorially-authored pairs exist.

## 5. Internal linking (semantic only — no random links)

- [ ] The back-link above the header points at a real destination: the
      matching `ASSET_TYPE_HUB` entry when the asset type has one (stocks →
      `/stocks`, crypto → `/crypto`, commodities → `/commodities`, bonds →
      `/bonds`), otherwise `/market-news` (the site's real live-markets
      overview) — **never** a bare `/markets` link, since that route does
      not exist anywhere in this app (verify before reusing this pattern
      elsewhere: no `src/app/markets/page.tsx` exists).
- [ ] Industry link (`/industries/[slug]`) only rendered when the matched
      company's own `industry` field supplies the slug — never guessed from
      a display string.
- [ ] Related-news links use `articleUrl()`, not a hand-rolled path.
- [ ] Company profile link (`/companies/[slug]`) only rendered when a match
      exists.

## 6. Accessibility

- [ ] Exactly one `<h1>` (the instrument name); every section header below
      it is `<h2>` — **no skipping straight from `<h1>` to `<h3>`** (the
      previous implementation did this for every card on the page).
- [ ] Breadcrumb `<nav aria-label="Breadcrumb">`.
- [ ] The range selector is a `role="group" aria-label="Chart time range"`
      with `aria-current="true"` on the active range — it's a set of links,
      not unlabeled buttons.
- [ ] The chart has a `sr-only` text summary of the real displayed
      price/change for screen-reader users (Recharts' SVG has no inherent
      text alternative).
- [ ] External links (company website) always carry
      `rel="noopener noreferrer"` with `target="_blank"`.

## 7. Images

- [ ] A matched company's `logo` only renders when `isAllowedImageHost()`
      passes — this app's `next.config` only allows `imperialpedia.com` and
      `api.baalvion.com`; anything else 400s the image optimizer.
- [ ] Never render a placeholder logo when none exists — absence is
      silence, not a generic icon.

## 8. Performance

- [ ] `QuoteChart` (recharts) is loaded via `next/dynamic` — a client
      component in a Server Component file code-splits automatically without
      needing `ssr: false` (which isn't valid from a Server Component
      anyway).
- [ ] Because the backend bundles price/chart/indicators/fundamentals into
      one `/assets/:symbol/detail` response, true streaming (a fast shell +
      a separately-suspended chart) isn't achievable from the frontend alone
      today — `revalidate = 30` + `generateStaticParams` are the real,
      available levers. **Known follow-up**: splitting that endpoint so the
      page shell (name/price) can stream ahead of chart/indicators is
      backend work, tracked as technical debt, not solved by this standard.

## 9. Crawlability

- [ ] Every symbol in `ALL_TRACKED_SYMBOLS` is submitted in the sitemap
      (`sitemap-service.ts`) as `/markets/quote/[symbol]` — a page with no
      sitemap entry and no reliable inbound link path is invisible to
      crawlers regardless of how good its on-page SEO is.
- [ ] `robots.ts` has no blanket disallow that would catch `/markets/` — confirm this stays true if the disallow list is ever restructured.

## Anti-patterns (do not do these)

- Combining `force-dynamic` with a fetch-level `revalidate` — the former
  silently wins and the latter becomes dead code.
- Linking to `/markets` (or any other route) without first confirming a
  `page.tsx` exists for it.
- Putting a company's real homepage in schema `url` instead of `sameAs`.
- Fabricating `PostalAddress` structure, `distribution`/`DataDownload`, or
  FAQ content from data that doesn't actually exist.
- Skipping a heading level for visual/spacing reasons.
- Sending `?range=` variants to the index as separate canonical pages.
