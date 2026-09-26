# Imperialpedia Company Knowledge Page Standard v1

Every page that renders a single company entity (`/companies/[slug]`) or the
company index (`/companies`) must meet this bar. It was extracted from the
production-hardening pass on
[`src/app/companies/[slug]/page.tsx`](../src/app/companies/[slug]/page.tsx) and
[`src/app/companies/page.tsx`](../src/app/companies/page.tsx) — treat those as
the reference implementation when building or auditing another entity
template (countries/industries/technologies currently share the same
`EntityHeader`/`EntityOverview`/`RelatedEntities` primitives but have **not**
been upgraded to this standard yet — see "Rolling this out further" below).
Related: [STRUCTURED_ENTITIES.md](./STRUCTURED_ENTITIES.md) (the backend/data
layer this page reads from), [ARTICLE_STANDARD.md](./ARTICLE_STANDARD.md)
(the equivalent standard for single-article pages).

**Nothing in this standard authorizes fabricating content.** Every field
below is either a structural description of content that's already visible
on the page, or omitted entirely when the underlying data doesn't support
it. A company page with three populated fields and nine omitted sections is
correct; a company page with twelve sections padded with placeholder text is
not.

## 0. Data model (`CompanyEntity`, `src/types/entity.ts`)

- [ ] Every new company field is **optional**. A field with no verified
      value must be omittable, not forced to `null`/`"N/A"`/an empty array
      that a component then has to special-case.
- [ ] Stable, low-staleness-risk facts (founders, `stockExchange`,
      `sameAs` Wikipedia/official links, `legalName`) are safe to populate in
      the bundled fallback JSON (`src/data/companies/companies.json`).
- [ ] High-staleness-risk facts (**current** CEO/executives — `ceo`,
      `executives`) are intentionally left unset in the static fallback.
      Leadership changes on a timescale static JSON in a git repo cannot
      track safely; populate these from the live entity service
      (imperialpedia-service), which can actually be kept current, never by
      hand-typing a name into the fallback file. A component that reads
      `ceo`/`executives` must treat absence as "not yet sourced," not "this
      company has no CEO."
- [ ] `isPublic` is **derived** (ticker presence), not editorially set —
      it drives `Organization` vs `Corporation` JSON-LD `@type` and the
      Key Facts "Stock" vs "Ownership: Privately held" row.

## 1. Metadata (`generateEntityMetadata`, `src/lib/utils/seo.ts`)

- [ ] `title`/`description` are built from the entity's **own** verified
      fields (industry, founded year, headquarters, ticker) so every company
      gets a genuinely unique description — never one templated sentence
      with the name swapped in.
- [ ] `canonical` points at `/companies/[slug]` (or `/companies?page=N` for
      the paginated index — self-canonicalizing per page, never all pages
      claiming page 1's URL).
- [ ] `keywords` includes the entity's own tags plus the humanized industry,
      not just the sitewide default keyword list.
- [ ] `ogImage` only overrides the sitewide default when the entity has a
      verified `logo` URL — never a guessed or placeholder image.

## 2. Structured data (JSON-LD)

- [ ] One `Organization`/`Corporation` block (`structuredData.company()`),
      one `BreadcrumbList` block, one `WebPage` block, and an optional
      `FAQPage` block — never more than one block of the same `@type`.
- [ ] `@type: "Corporation"` only when `isPublic` is true; `"Organization"`
      otherwise. Corporation is the schema.org subtype that adds
      `tickerSymbol` — don't emit `tickerSymbol` on a plain `Organization`.
- [ ] **Omit optional properties with no real value instead of sending them
      empty.** `founder`, `logo`, `parentOrganization`, `numberOfEmployees`,
      `tickerSymbol` are only added when the entity actually has the
      corresponding field — conditional `if (company.x) schema.y = …`, not
      `founder: company.founders ?? []`.
- [ ] `founder` is emitted as an array of `Person` (name only — no invented
      bios/titles/photos).
- [ ] The company index page's `ItemList` only lists the entities actually
      rendered on that page (respecting pagination `position`), not the
      full dataset.
- [ ] `FAQPage` is only emitted when `company.faq` has real, editorially
      authored entries — never auto-generated or templated questions.

## 3. AI answer-engine structure

The detail page body is organized into clearly labeled, independently
extractable sections so an AI Overview / Perplexity / Copilot answer can
quote one block without needing the whole page:

- [ ] **Overview** — the entity description.
- [ ] **Key Facts** — a table of verified attributes (legal name, founded,
      headquarters, industry, employees, stock/ownership, parent org,
      website). Built as an array of conditionally-pushed rows — a field
      with no value simply isn't a row, never `"—"` or `"Unknown"`.
- [ ] **History** — a single factual sentence template
      (`"{name} was founded in {year} by {founders} and is headquartered in
      {headquarters}."`) assembled **only** from fields already verified in
      Key Facts. This is templating already-shown facts for extractability,
      not new content generation.
- [ ] **Leadership** — founders (stable fact) + CEO/executives (only when
      sourced — see §0). Section renders nothing when none of the three are
      present.
- [ ] **Products & Services** — only when `company.products` is populated.
- [ ] **Financial Information** — `LiveQuoteCard` (real price/market cap
      from the live asset feed) for public companies; "Privately held" in
      Key Facts for private ones. Never a fabricated share price or market
      cap estimate.
- [ ] **Recent News** — real published articles that mention the company by
      name (whole-word match against title/tags), not curated/hand-picked
      or fabricated headlines.
- [ ] **Related Companies/Industries/Technologies/Countries** — the real
      cross-reference graph (`getRelatedEntities`), grouped and correctly
      pluralized per type.
- [ ] **FAQ** — only when `company.faq` has real content (see §2).

## 4. Internal linking (semantic only — no dead links)

- [ ] Company → Industry: the Key Facts "Industry" value links to
      `/industries/[slug]` **only when that industry entity is confirmed to
      exist** (`getIndustryBySlug` resolves). Several company records
      reference industry slugs with no dedicated entity page yet — those
      render as plain text, never a link that 404s.
- [ ] Company → Markets: `LiveQuoteCard` links to `/markets/quote/[ticker]`
      only when a live quote actually resolved — it already returns `null`
      when it can't confirm a price.
- [ ] Company → Related Companies/Technologies/Countries: the real
      `competitors`/`technologies`/`country` cross-reference fields, not a
      "companies you might like" random pick.
- [ ] Company → Recent News → Authors: each news item's byline links to
      `/authors/[authorSlug]` only when the article actually has one.
- [ ] Company → Verified Profiles: `sameAs` entries (Wikipedia, official
      site) are rendered as real outbound links in the sidebar, not left as
      schema-only metadata invisible to human readers.
- [ ] `BreadcrumbList` schema **must match the visible breadcrumb `<nav>`
      exactly** — same crumbs, same targets, same order.

## 5. Heading hierarchy & accessibility

- [ ] Exactly one `<h1>` — the company name (`EntityHeader`).
- [ ] Section headings (`Section` component → `<h2>`) for Overview, Key
      Facts, Leadership, Products & Services, Recent News, Knowledge Graph
      Connections, FAQ — no skipped levels.
- [ ] Breadcrumb `<nav>` has `aria-label="Breadcrumb"`.
- [ ] External links (`target="_blank"`) always carry
      `rel="noopener noreferrer"`.
- [ ] No anchor is nested inside another anchor (e.g. a news card's own
      link and its byline link are siblings, not parent/child).

## 6. Performance

- [ ] `generateMetadata` and the page component each call
      `getCompanyBySlug` independently — both hit the same `fetch()` inside
      `loaders.ts`, which is now time-bounded (`AbortSignal.timeout`) and
      revalidate-cached (`next: { revalidate: 300 }`) instead of
      `cache: 'no-store'`, so a hung live entity service can't block the
      page indefinitely and repeated requests don't all pay a full
      round-trip.
- [ ] Secondary, non-critical sections with their own data fetch — Recent
      News (`CompanyNews`), the related-entities graph (`CompanyRelated`),
      and the live quote (`LiveQuoteCard`) — are self-fetching Server
      Components wrapped in their own `<Suspense>` boundary, so a slow
      upstream can't block Overview/Key Facts/History from streaming.
      Target: the page shell ships without waiting on secondary widgets.
- [ ] No client component for something that can stay server-rendered.
      `RelatedEntities`, `EntityTags`, and `EntityListItem` were converted
      back to Server Components — they were marked `'use client'` with no
      actual hooks/state/browser APIs inside, which shipped unnecessary JS
      and delayed hydration for zero benefit.
- [ ] `export const revalidate = 300` on both the list and detail pages so
      Next's Full Route Cache actually applies instead of every request
      re-running the full data-fetch + render pipeline.

## Anti-patterns (do not do these)

- Showing a fabricated "AI Research Assistant" insight, fake analytics
  metrics, or randomly-generated chart data as if it were real company
  intelligence (this page previously rendered `EntityAnalytics` — hardcoded
  numbers like "Revenue Velocity +15%" attached to arbitrary companies with
  a fake loading spinner — and `AIInsight`, whose backing API returns a
  hardcoded placeholder string labeled "synthesized AI analysis." Both were
  removed from this page; they're still used by the other entity types and
  need the same audit before those pages can claim this standard).
- Linking a Key Facts value or badge to an entity page that doesn't exist
  for that slug.
- Hand-typing a "current CEO" into static fallback JSON — it will go stale
  silently with no mechanism to catch it.
- Sending empty-string/empty-array JSON-LD properties "just in case."
- Fabricating FAQ questions/answers that aren't real editorial content.
- Blocking the whole page response on a secondary, live, no-store fetch.
- Naively pluralizing an entity type label (`${type}s`) instead of using
  the route-segment map — produces "Related companys"/"industrys".

## Rolling this out further

`RelatedEntities`, `EntityTags`, and `EntityListItem` (client-directive
removal + pluralization fix) are shared across `/countries`, `/industries`,
and `/technologies` too, so those pages already benefit from this pass. The
company-specific pieces — `EntityAnalytics`/`AIInsight` removal, the
Leadership/Recent News/History sections, dead-link-safe industry linking,
and the `Organization`/`Corporation` schema — are **not yet** applied to the
other three entity types. Repeat this same audit (§0–§6) against each of
their `page.tsx` files before claiming they meet this bar; do not assume
sharing a few components means they're already compliant.
