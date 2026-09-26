# Imperialpedia Search Standard v1

Search spans two entry points that must never diverge: the Ctrl+K command
palette (`SearchModal.tsx` → `/api/search`) and the full results page
(`/search` → `searchService.performSearch()`). Both must return the same
class of result for the same query — a user should never get a hit in one
and nothing in the other for an identical term.

Related: [HOMEPAGE_STANDARD.md](./HOMEPAGE_STANDARD.md) (declares the
`SearchAction` target this page fulfills), [STRUCTURED_ENTITIES.md](./STRUCTURED_ENTITIES.md).

**Nothing in this standard authorizes fabricating result data.** A query
with no real matches returns an empty result set and an honest "no results"
state — never a padded list of loosely-related items to avoid looking empty.

## 1. Data sources (no orphaned fixtures)

- [ ] Entity search (`src/lib/utils/search.ts`) reads from the same
      live-first, static-fallback loaders that power the index pages
      (`src/lib/data/loaders.ts` for company/country/industry/technology,
      `src/lib/data/marketsLoader.ts` for live market assets). It must never
      read from a second, independently-maintained fixture set.
- [ ] The flat, single-record legacy fixtures at `src/data/countries.json`,
      `src/data/companies.json`, `src/data/industries.json`,
      `src/data/technologies.json` are **orphaned** (superseded by
      `src/data/<type>/<type>.json`, which `loaders.ts` already uses). Do not
      reintroduce a code path that reads them — this was the root cause of
      the Ctrl+K palette only ever being able to return one seeded record per
      type before this standard's rebuild.
- [ ] `searchService.performSearch()` (`src/services/data/search-service.ts`)
      is the multi-source path — imperialpedia-service `/search` + CMS
      `?search=` for articles/news — with a mock-data fallback used only when
      every live source is unreachable or empty. The mock fallback must never
      be the default path in a working environment.

## 2. Ranking

- [ ] All ranking flows through `src/lib/utils/search.ts`'s scoring
      functions (`rankSearchResults` / `sortByRelevance`) — no search surface
      may reintroduce a bare `.includes()` filter with source-order-only
      sorting.
- [ ] Field weighting: title match > category match > tag match > snippet
      match. An exact/prefix/word-boundary match always outranks a bare
      substring match, which always outranks a fuzzy (typo-tolerant) match.
- [ ] `rankSearchResults` (drops zero-score items) is only used when the
      caller did its own, unranked full-text matching upstream (raw entity
      lists). `sortByRelevance` (never drops items, stable sort) is used when
      results were already filtered server-side by a source that may match on
      fields this scorer doesn't see (e.g. CMS article body text) — dropping
      those would hide real hits, not just reorder them.
- [ ] Typo tolerance is a fallback tier only (lowest score band), so an exact
      match never loses to a fuzzy one.

## 3. Entity coverage

- [ ] Searchable today: company, country, industry, technology (via
      `loaders.ts`), live market assets (via `marketsLoader.ts`, surfaced as
      `type: "market"`), plus article/author/glossary/topic content via
      `searchService.performSearch()`.
- [ ] **Not searchable, tracked as a known gap, not silently ignored:**
      `person` entities — no `loadPeople()`/backend endpoint exists yet.
      `src/data/people.json` (1 seed record) must not be wired into search
      as a workaround; build the real loader first.

## 4. SEO

- [ ] `/search` has a page-level `generateMetadata` (it did not, before this
      standard — the page previously inherited whatever the layout defaults
      were, with zero indexing control over an infinite `?q=` URL space).
- [ ] Robots directive is `noindex, follow` — indexing every distinct `?q=`
      value as a thin/duplicate page is the wrong outcome, but the page
      should still pass link equity to whatever it links to. Do not use
      `noindex, nofollow` here, and do not `Disallow: /search` in
      `robots.ts` (a `Disallow` would prevent crawlers from ever seeing the
      `noindex` tag on already-indexed URLs).
- [ ] `canonical` is the bare `/search` (not `/search?q=...`) so any stray
      indexing consolidates onto one URL.
- [ ] `/api/search` stays `Disallow`ed in `robots.ts` — it's a JSON API
      response, never meant to be crawled directly.

## 5. AI-friendly result shape

Every `SearchResult` (`src/types/search.ts`) exposes:

- [ ] `title`, `snippet`, `type` (entity type), `route`, `category` — enough
      for a downstream AI consumer to understand what kind of thing a result
      is without re-fetching the target page.
- [ ] `date`/`author` when the underlying content has them (articles).
- [ ] Relevance is implicit in result order (highest-scoring first) rather
      than a numeric field exposed to the client — do not add a raw
      internal score to the public API response.

## 6. Performance

- [ ] `SearchModal`'s live-as-you-type query is debounced 300ms.
- [ ] `/api/search` sets `Cache-Control: public, s-maxage=60,
      stale-while-revalidate=300`.
- [ ] No search path loads the full unfiltered dataset more than once per
      request — `searchEntities()` fetches each entity type exactly once via
      `Promise.all`, then scores in-memory.
