# Imperialpedia Knowledge Article Standard v1

Every page that renders a single article (dated news, category-prefixed guides,
reviews, glossary entries) must meet this bar. It was extracted from the
production-hardening pass on `DatedArticlePage` in
[`src/app/[...slug]/page.tsx`](../src/app/[...slug]/page.tsx) — treat that
function as the reference implementation when building or auditing another
article template. Related: [STRUCTURED_ENTITIES.md](./STRUCTURED_ENTITIES.md)
(knowledge-graph entity pages this standard links out to).

Nothing in this standard authorizes fabricating content. Every field below is
either a structural description of content that's already visible on the page,
or omitted when the underlying data doesn't support it.

## 1. Metadata (`generateMetadata`)

- [ ] `title`, `description` — description clamped to ~160 chars at a word
      boundary (`truncateForMeta`), never sent unbounded.
- [ ] `canonical` points at the article's one canonical URL scheme for its
      content type (dated news → `/YYYY/MM/DD/slug`; guides →
      `/<categorySlug>/slug`). Every other reachable path 301s here.
- [ ] `keywords` sourced from the article's own tags, not the sitewide default,
      when tags exist.
- [ ] `openGraph.type: "article"` with `publishedTime`, `modifiedTime`,
      `authors`, `section`, `tags` populated from the article — not just the
      generic website OG fields.
- [ ] `ogImage` (and any other externally-fetched image URL) is verified with
      `isAllowedImageHost()` (`src/lib/safe-image.ts`) before use. Inline
      `data:` URIs (the `@baalvion/illustrations` fallback artwork) are valid
      for on-page `<Image>` but **must never** reach `og:image`/`twitter:image`
      — social unfurlers and crawlers fetch that as an HTTP(S) URL and get
      nothing back. Fall back to the sitewide default OG image instead.
- [ ] `authors: [{ name, url }]` — `url` only set when the byline name matches
      a real entry in `config/authors.ts` (see §4).

## 2. Structured data (JSON-LD)

- [ ] One `Article`/`NewsArticle` block, one `BreadcrumbList` block, and an
      optional `FAQPage` block (§3) — never more than one block of the same
      `@type` on a page, and never fields that contradict each other across
      blocks (same canonical URL, same author, same dates everywhere).
- [ ] **Omit optional fields with no real value instead of sending them
      empty.** `description: ""`, `image: []`, `datePublished: ""` are worse
      than not including the key — some consumers treat "present but empty"
      as filled. Use conditional spread: `...(cond ? { field: value } : {})`.
- [ ] `datePublished`/`dateModified` are validated (`Date.parse` succeeds)
      before inclusion — never pass through an unvalidated string from a live
      CMS fetch.
- [ ] `image` only included when `isAllowedImageHost()` passes (same rule as
      OG image, §1) — a data URI in NewsArticle `image` is not indexable by
      Google Images and won't produce a rich-result thumbnail.
- [ ] `publisher` is a complete `Organization` with `name`, `url`, and `logo`
      as an `ImageObject` (`url` + real `width`/`height` — check the actual
      file, don't guess). Google requires this for Article rich results.
- [ ] `author.url` only set when it resolves to a real `/authors/[slug]` page
      via an exact (trimmed) name match against `config/authors.ts` — never
      construct a slug by guessing.
- [ ] `mainEntityOfPage` set to the canonical URL.
- [ ] `BreadcrumbList` **must match the visible breadcrumb `<nav>` exactly** —
      same number of real crumbs, same names, same targets. A crumb that
      isn't rendered as a link on the page must not appear as a linked
      `ListItem` in schema (mismatch risks a manual action for misleading
      structured data). Only add a crumb level when a real destination route
      exists for it.

## 3. AI search / answer-engine structure

- [ ] `speakable.cssSelector` points at real, stable class hooks on the H1 and
      excerpt/summary paragraph (`.article-excerpt`), plus any other
      summary-shaped block that actually renders (e.g. `.key-points`).
- [ ] `FAQPage` schema is **conditional and extracted, never authored**: only
      emit it when the article's own body already contains heading text
      ending in `?` immediately followed by paragraph content (2+ pairs
      minimum — see `extractFaqFromBlocks`). If the content isn't already
      shaped like FAQ, don't add the schema.
- [ ] `about` (topics — from editorial tags) and `mentions` (real named
      entities — e.g. tracked companies detected the same way
      `ArticleMarketWidget` detects them) expose what the article covers as
      structured `Thing`/`Corporation` entities, not just a keyword string.
- [ ] `citation` is set when the article credits an external source
      (`externalSourceUrl`) — describe it as a `CreativeWork`, not just a
      plain-text link in the body.
- [ ] `timeRequired` (ISO 8601 duration, e.g. `PT5M`) set from the article's
      own computed read time when available.

## 4. Internal linking (semantic only — no random links)

- [ ] Byline links to `/authors/[slug]` **only** when the author name matches
      a real roster entry — an unmatched name stays plain text. Never guess.
- [ ] Category badge/breadcrumb links to a real topic hub
      (`/latest/[category]`, or a dedicated section page) **only** when that
      destination actually exists for the category value — maintain an
      explicit allow-map (`CATEGORY_HREF`) rather than slugifying blindly.
- [ ] Related-articles rail uses real same-category articles, not random
      picks.
- [ ] Any `related`/"Read More" link list is filtered for real hrefs —
      placeholder values (`href: "#"`) from demo/seed data must never render
      as a clickable dead end.
- [ ] Company/entity mentions detected in the body link to their real profile
      page (`/markets/quote/[ticker]`, `/companies/[slug]`) — reuse the
      existing detector, don't build a second one.

## 5. Heading hierarchy & accessibility

- [ ] Exactly one `<h1>` — the article title.
- [ ] No heading level is skipped **anywhere in DOM order**, including inside
      `<aside>`/sidebar widgets — treat axe/WAVE's flat heading-order check as
      authoritative, not the HTML5 sectioning-root outline theory. A
      "Key Points" summary box or a sidebar widget title that renders before
      any other heading must be `<h2>`, not `<h3>`.
- [ ] Breadcrumb `<nav>` has `aria-label="Breadcrumb"`.
- [ ] Every image has non-empty, non-generic `alt` text. A caption-less
      content image gets a real fallback string, never `alt=""` (that's a
      decorative-image signal, wrong for real content). Images in a gallery
      get unique alt text (append an index or real per-image caption) —
      identical alt text across multiple images is an anti-pattern for both
      screen readers and Google Images.
- [ ] External links (`target="_blank"`) always carry
      `rel="noopener noreferrer"`.

## 6. Images

- [ ] Hero image: `fill` inside an aspect-ratio-locked container (prevents
      CLS), `priority` (it's almost always the LCP element), explicit `sizes`.
- [ ] Non-hero images: no `priority`, rely on Next's default lazy loading —
      don't add a manual `loading="lazy"`, it's redundant.
- [ ] Never pass a non-allowlisted image host to `next/image` — `next.config.ts`
      only allows `imperialpedia.com` and `api.baalvion.com`; anything else
      404s the optimizer. Use `safeImageUrl()`/`isAllowedImageHost()` at every
      boundary where an image URL enters the page, not just at the CMS layer.

## 7. Performance

- [ ] If `generateMetadata` and the page component both need the same
      article lookup, wrap the lookup in React's `cache()` so it runs once
      per request, not twice — this is Next's documented pattern, don't rely
      on incidental `fetch()`-level memoization holding forever.
- [ ] Any live, `cache: 'no-store'` data fetch with a real timeout budget
      (market quotes, third-party APIs) that isn't part of the primary
      content must be wrapped in its own `<Suspense>` boundary so a slow or
      degraded upstream can't block the main article (title, byline, hero
      image, body) from streaming. Target: article shell + LCP element ships
      without waiting on secondary widgets.
- [ ] No new client component for something that can stay server-rendered.
      Interactive-only islands (share buttons, copy-link) stay isolated
      client components; everything else defaults to server.

## Anti-patterns (do not do these)

- Sending empty-string or empty-array schema fields "just in case."
- Linking a byline or category to a page that doesn't exist for that value.
- Reusing the same `alt` text across multiple images in one article.
- Fabricating FAQ questions/answers that aren't already in the body.
- Rendering `href="#"` or any other non-destination as a real link.
- Blocking the whole page response on a secondary, live, no-store fetch.
- Declaring `BreadcrumbList` schema that doesn't match the rendered breadcrumb.
