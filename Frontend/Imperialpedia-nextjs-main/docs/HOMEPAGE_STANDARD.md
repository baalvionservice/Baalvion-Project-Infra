# Imperialpedia Homepage Standard v1

The homepage (`/`, [`src/app/page.tsx`](../src/app/page.tsx)) is the site's
discovery engine, not a static landing page. It must always do two jobs at
once: give a first-time visitor (human or AI answer engine) an immediate,
extractable answer to "what is this site," and give a returning visitor a
live, linkable map into the knowledge graph and editorial content that
actually exists right now.

Related: [STRUCTURED_ENTITIES.md](./STRUCTURED_ENTITIES.md) (entity data
layer), [SEARCH_STANDARD.md](./SEARCH_STANDARD.md) (the `SearchAction` target
this page declares), [COMPANY_STANDARD.md](./COMPANY_STANDARD.md) (entity
page standard the homepage links into).

**Nothing in this standard authorizes fabricating content.** Every homepage
section reads from a real data source (`src/lib/data/loaders.ts`,
`src/lib/data/marketsLoader.ts`, `src/modules/content-engine/services/content-service.ts`,
`src/lib/data/topic-index.ts`). A section with nothing to show renders
`null` and disappears — it never falls back to placeholder cards.

## 1. Metadata (`generateMetadata`, [`src/app/page.tsx`](../src/app/page.tsx))

- [ ] The homepage has its **own** `generateMetadata`, built via
      `buildMetadata()` — never inherits the root layout's generic
      title/description silently. This was the actual bug found in the
      pre-rebuild audit: every other route in the app calls `buildMetadata()`
      except the homepage.
- [ ] `canonical` is `/`.
- [ ] Title and description describe the platform itself (knowledge graph +
      live market data + reviewed articles), not a single section of it.

## 2. Structured data (JSON-LD)

- [ ] Exactly one `WebSite` + `SearchAction` block
      (`structuredData.website()`), rendered on the homepage only — not
      duplicated on every page.
- [ ] The root layout's `Organization` block and the homepage's `WebSite`
      block both come from the single shared factory in
      [`src/lib/seo/structuredData.ts`](../src/lib/seo/structuredData.ts).
      Do not hand-roll a second inline `<script type="application/ld+json">`
      anywhere else in the app for either of these — that's exactly how the
      pre-rebuild homepage ended up with a hardcoded, drifted copy of the
      site URL.
- [ ] `FAQPage` schema (`structuredData.faqPage()`) mirrors real, visible
      copy on the page (see `homeFaqItems` in
      [`src/components/home/HomeIntro.tsx`](../src/components/home/HomeIntro.tsx))
      — never schema-only content invisible to a human visitor.

## 3. AI-search-optimized intro

- [ ] The first content block above the fold states, in a single
      self-contained paragraph, what Imperialpedia is, what it contains, and
      what a visitor can do here — written so an AI answer engine (ChatGPT
      Search, Perplexity, Google AI Overviews, Bing Copilot) can extract it
      without needing surrounding navigation context.
- [ ] The matching FAQ items answer the same "what is / what does it
      contain / what can I explore / is data live" questions in both the
      visible copy and the `FAQPage` schema, so structured data and rendered
      text never disagree.

## 4. Discovery sections (Information Architecture)

Each section below is its own Server Component under
[`src/components/home/`](../src/components/home/), wrapped individually in
`<Suspense>` from `src/app/page.tsx`:

- [ ] **Latest Articles** (`LatestArticles.tsx`) — real CMS-backed articles
      via `content-service.ts`, linked through `newsArticleHref()` so every
      card resolves to its real canonical URL (never a bare `/slug`).
- [ ] **Market Highlights** (`MarketHighlights.tsx`) — live top gainers/
      losers via `marketsLoader.ts`'s `computeMovers()`, not a second,
      divergent ranking implementation.
- [ ] **Explore the Knowledge Graph** (`KnowledgeCategories.tsx`) —
      companies/countries/industries/technologies index links with live
      counts from the same loaders the index pages themselves use, so counts
      can never drift from what `/companies` etc. actually list.
- [ ] **Featured Companies** (`FeaturedCompanies.tsx`) and **Recently
      Updated** (`RecentlyUpdated.tsx`) — real entity data via
      `EntityListItem`, sorted/filtered from live loader output only.
- [ ] **Trending Topics** (`TrendingTopics.tsx`) — reuses
      `getGlobalTopicIndexData()`'s real, content-derived popularity ranking;
      never a second hand-picked term list that could disagree with
      `/topics`.
- [ ] Every section links to a real destination route. A section with zero
      internal links is not acceptable on this page — the homepage's job is
      internal linking into the knowledge graph and editorial content.

## 5. Performance

- [ ] Each discovery section is an independent `async` Server Component in
      its own `<Suspense>` boundary. A slow or unavailable data source
      (market feed, CMS, live entity service) degrades that one section to
      its skeleton fallback (`HomeSectionSkeleton.tsx`) — it must never block
      the static intro/editorial content above it from painting.
- [ ] No homepage-specific `"use client"` component may perform its own data
      fetch in a `useEffect` on mount. All data fetching is server-side
      (RSC `await`), matching the rest of the app's live-first,
      static-fallback pattern.
- [ ] Images use `next/image` with explicit `sizes`; only the true
      above-the-fold hero image (`LeadStory`) gets `priority`.

## 6. Known gaps (tracked, not fabricated around)

- [ ] "Featured People" is intentionally **absent**. No `person` entity
      loader/backend exists yet (`EntityType` includes `"person"` but there
      is no `loadPeople()` in `lib/data/loaders.ts` and no `/people` index
      route). Do not add a people section backed by fixture data — build the
      loader first, then the section.
- [ ] "Market" entity type in search/homepage refers to live asset quotes
      (`marketsLoader.ts`), not a knowledge-graph `market` entity — there is
      no `market`-type row in the entities table.

## Rolling this out further

If a future editorial redesign changes the lead-story/topic-row layer
(`src/components/landing/investopedia/`), the discovery rails below it in
this standard are independent and do not need to change in lockstep — they
read from loaders, not from the editorial content module.
