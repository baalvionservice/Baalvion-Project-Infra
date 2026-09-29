# Baalvion Investor Relations — SEO Strategy

**Domain:** https://ir.baalvion.com
**Stack:** Next.js 15 (App Router, RSC/SSR, `next/font`, `next/image`)
**Positioning:** Baalvion — an AI-native operating system for global B2B trade, unifying logistics, trade finance and compliance.
**Audience:** VCs, angels, family offices, institutional investors, strategic / corporate partners.
**Owner:** Investor Relations + Growth
**Last reviewed:** 2026-06-11

---

## 1. Executive Summary

Baalvion IR is a Next.js 15 App Router site that is already **technically excellent** out of the box. The hard, durable parts of SEO are done: a self-updating dynamic sitemap (index + 50k-URL chunks, real `lastmod` from CMS), a properly scoped `robots.ts`, per-page canonicals, six structured-data types live in production (Organization, FinancialService, WebSite, Person, NewsArticle, BreadcrumbList, FAQPage), and a centralized `irMetadata()` envelope driving every title/description/OG/Twitter tag. Nine new institutional pages (`/why-invest`, `/investment-thesis`, `/market-opportunity`, `/use-of-proceeds`, `/company/story`, `/financials`, `/governance/framework`, `/faq`, `/resources`) shipped with hand-written SEO envelopes that already target the right intent.

The remaining work is **not technical plumbing** — it is **authority, content velocity, and measurement**:

1. **The domain is new.** Zero referring domains, no ranking history. This is the single biggest constraint and the focus of the M7–M9 authority phase.
2. **Analytics are env-gated but not yet live.** GA4 / Clarity / GSC / Bing verification IDs must be provisioned and verified before any data accrues. Without GSC, we are flying blind.
3. **Content depth is thin relative to ambition.** The institutional pages are strong, but there is no blog, no glossary, and no programmatic surface to capture the long tail of "AI trade finance", "trade compliance automation", and investor-intent queries.
4. **Operational assets must exist:** the OG image referenced in `layout.tsx` (`https://baalvion.com/og-image.jpg`) and `logo.png` must resolve, and image `alt` coverage needs an audit pass.

This document is the board-ready plan to convert a technically sound site into a **ranking, traffic-generating, investor-converting** asset over 12 months. Targets: from 0 → **500+ indexed URLs**, **25k+ monthly impressions**, **40+ referring domains**, and a measurable pipeline of IR contact/download conversions by month 12.

---

## 2. SEO Audit — Current State

Status legend: **Strong** (production-grade, no action) · **Partial** (working but incomplete) · **Gap** (missing, real risk).

### 2.1 Technical SEO

| Item | Status | Notes |
|---|---|---|
| XML Sitemap | **Strong** | Index at `/sitemap.xml` + chunked `/sitemaps/[id].xml` (50k URLs/chunk), `force-dynamic`, real `lastmod` from CMS `updatedAt`/`publishedAt`, auto-includes CMS pages + leadership detail + curated static routes. No manual updates. |
| robots.txt | **Strong** | `app/robots.ts` references sitemap, disallows `/admin/`, `/api/`, `/private/`, `/_next/`, `*.json`; Googlebot/Bingbot variants additionally block `/onboarding`, `/phase2/`, `/phase3/`. Gated investor surfaces excluded from index. |
| Canonical URLs | **Strong** | Root canonical + per-page via Next `alternates.canonical`. |
| HTTPS / HTTP→HTTPS | **Strong** | Enforced at edge (verify HSTS header present in prod). |
| Clean URL structure | **Strong** | Semantic segments (`/why-invest`, `/governance/framework`). No query-string content. |
| SSR / RSC rendering | **Strong** | `force-dynamic` root layout — fully server-rendered HTML for crawlers; no JS-gated content. |
| Core Web Vitals (defaults) | **Strong** | `next/font` (Inter, `display: swap`, `preload: true`), `next/image`, RSC. Needs field-data confirmation post-launch. |
| Crawl budget / index bloat | **Partial** | `force-dynamic` everywhere is correct for freshness but means every request re-fetches CMS; confirm no thin/duplicate pages leak into the sitemap. |
| 404 / soft-404 handling | **Partial** | Confirm `not-found.tsx` returns a real 404 status, not 200. |
| OG image asset | **Gap** | `layout.tsx` references `https://baalvion.com/og-image.jpg` (1200×630) and `logo.png` — **these assets MUST exist and return 200** or social/AI previews break. |

### 2.2 On-Page SEO

| Item | Status | Notes |
|---|---|---|
| Title / meta templates | **Strong** | `%s \| Baalvion` template + per-page hand-written titles/descriptions via `irMetadata()` reading `IR_PAGES` envelopes in `src/lib/ir-pages.ts`. |
| Keyword targeting | **Strong** | Each institutional page has a curated `keywords` array mapped to investor + AI/tech intent. |
| H1 uniqueness | **Partial** | Verify exactly one `<h1>` per page and that it contains the primary keyword (section components own prose). |
| Heading hierarchy | **Partial** | Audit H2→H3 nesting in section components; avoid skipped levels. |
| Internal linking depth | **Gap** | New pages exist but the **hub-and-spoke link graph between them is not yet wired** — pillars don't systematically link to clusters and back. |
| Image `alt` coverage | **Gap** | Needs a full audit; decorative vs informative `alt` discipline not yet verified across section components. |
| Description length discipline | **Partial** | Some descriptions exceed ~160 chars and will truncate in SERPs (e.g., several `IR_PAGES` descriptions run long). |

### 2.3 Structured Data

| Item | Status | Notes |
|---|---|---|
| Organization + FinancialService | **Strong** | Root `layout.tsx`, `@id`-anchored, with address, contactPoint (IR), `sameAs` (LinkedIn, X). |
| WebSite | **Strong** | Root layout, publisher-linked to Organization `@id`. |
| Person | **Strong** | Leadership detail pages. |
| NewsArticle | **Strong** | News pages. |
| BreadcrumbList | **Strong** | All institutional IR pages. |
| FAQPage | **Strong** | `/faq` (40 Q&A). |
| Article / BlogPosting | **Gap** | No blog yet → no `Article` schema. Required once content engine ships. |
| Event | **Gap** | `/news-and-events/investor-day`, `/events`, `/webcast` should emit `Event`. |
| VideoObject | **Gap** | Webcasts/demos should emit `VideoObject` for video rich results. |
| `WebSite` `SearchAction` | **Gap** | Add sitelinks searchbox potential if on-site search exists. |

### 2.4 Content

| Item | Status | Notes |
|---|---|---|
| Institutional pillar pages | **Strong** | 9 new pages + existing governance/news/resources. Genuinely substantive (e.g., 40-answer FAQ). |
| Topic-cluster coverage | **Gap** | No supporting cluster articles → pillars have nothing to link to and no long-tail capture. |
| Blog / thought leadership | **Gap** | None. Primary lever for AI/trade/fintech keyword capture and backlinks. |
| Glossary / definitions | **Gap** | No definition pages → missing featured-snippet and "what is X" capture. |
| Programmatic pages | **Gap** | No corridor/HS-code/comparison surface — opportunity, but needs quality guards to avoid thin-page penalties. |
| Forward-looking / risk disclaimers | **Strong** | Financials/thesis copy already qualifies forward-looking statements. |

### 2.5 Off-Page / Authority

| Item | Status | Notes |
|---|---|---|
| Referring domains | **Gap** | New domain — effectively zero. This is the top growth constraint. |
| Domain authority / trust | **Gap** | No backlink history; brand SERP not yet owned. |
| Brand citations / NAP | **Partial** | Org schema present; ensure consistent NAP across Crunchbase, LinkedIn, PitchBook, etc. |
| Digital PR / press | **Gap** | No press pickup engine yet. |

### 2.6 Analytics

| Item | Status | Notes |
|---|---|---|
| GA4 | **Partial** | Env-gated (`NEXT_PUBLIC_GA4_ID`) — needs a real Measurement ID + verification. |
| Microsoft Clarity | **Partial** | Env-gated (`NEXT_PUBLIC_CLARITY_ID`) — needs project ID. |
| Google Search Console | **Gap** | Verification meta gated (`NEXT_PUBLIC_GSC_VERIFICATION`) but property not yet created / sitemap not submitted. **Highest-priority gap.** |
| Bing Webmaster Tools | **Gap** | `NEXT_PUBLIC_BING_VERIFICATION` gated; property not yet imported. |
| Conversion / event tracking | **Gap** | No key events defined (IR contact submit, resource download, onboarding start, scroll depth). |

---

## 3. Recommended Fixes (Prioritized)

### P0 — Do in the next 0–7 days (blocks measurement or breaks previews)

- [ ] **Create & deploy the OG image** at `https://baalvion.com/og-image.jpg` (1200×630, <200KB) and confirm `logo.png` returns 200.
- [ ] **Stand up Google Search Console** (domain property), paste token into `NEXT_PUBLIC_GSC_VERIFICATION`, verify, **submit `/sitemap.xml`**.
- [ ] **Provision GA4** → `NEXT_PUBLIC_GA4_ID`; confirm pageviews flow.
- [ ] **Provision Microsoft Clarity** → `NEXT_PUBLIC_CLARITY_ID`.
- [ ] **Bing Webmaster Tools** → import from GSC; set `NEXT_PUBLIC_BING_VERIFICATION`.
- [ ] Confirm `not-found.tsx` returns HTTP **404** (not soft-404 200).

### P1 — Weeks 1–4 (compounding SEO value)

- [ ] **Wire the internal-link hub-and-spoke** among the 9 institutional pages (see §6.3 link map).
- [ ] **Trim meta descriptions** to ≤155 chars where they currently exceed (several `IR_PAGES` entries).
- [ ] **H1 + heading audit** across section components — one H1/page, no skipped levels, primary keyword in H1.
- [ ] **Image `alt` audit** — informative `alt` on content images, empty `alt=""` on decorative.
- [ ] **Add `Event` schema** to investor-day/events/webcast routes.
- [ ] **Define GA4 key events**: `ir_contact_submit`, `resource_download`, `onboarding_start`, `scroll_75`, `email_alert_signup`.

### P2 — Weeks 4–12 (scale & moat)

- [ ] **Launch the blog** (`/insights`) with `Article` schema + 12–16 seed articles (§8).
- [ ] **Glossary** (`/glossary/[term]`) for featured-snippet capture.
- [ ] **Add `VideoObject`** to webcast/demo content.
- [ ] **Programmatic corridor/HS-code pages** with quality guards (min word count, unique data, noindex thin variants).
- [ ] **Digital PR + backlink campaign** (§8.4).

---

## 4. Technical SEO

### 4.1 Sitemap — confirmed "no manual updates"

The implementation in `src/lib/sitemap.ts` is **best-in-class for this use case**:

- **Index + chunked children:** `/sitemap.xml` emits a `<sitemapindex>`; each child `/sitemaps/[id].xml` carries up to `SITEMAP_CHUNK_SIZE = 50000` URLs — at Google's hard limit, with unbounded children for future scale.
- **Self-updating:** `cache: 'no-store'` + `force-dynamic` route handlers re-collect from the paginated CMS API (`100/page`, up to 1000 pages) on every request. **New, edited, and deleted CMS content is reflected on the next crawl with zero manual intervention.** ✅ Requirement met.
- **Real `lastmod`:** `toDate()` reads `updatedAt` then `publishedAt` per row, falling back to `now` — gives crawlers accurate freshness signals.
- **Correct scope:** `STATIC_PUBLIC` curates indexable routes; gated surfaces (dashboard, capital-ops, onboarding, phase*, my-voting) and `/admin`/`/api` are deliberately excluded. CMS `page` content (via `customFields.pageSlug`) and `leadership` posts (`/governance/leadership/[slug]`) are auto-included. Deduped by URL.

**Forward note (already documented in code):** at 1M+ URLs, move generation to a streaming backend service; the index/chunk structure here already anticipates that. No action until volume justifies it.

### 4.2 robots.txt

`app/robots.ts` is correct. One review item: the `userAgent: "*"` rule *allows* `/onboarding`, `/phase2/`, `/phase3/` while Googlebot/Bingbot *disallow* them — intentional (gated, not for index), but ensure those routes also carry `robots: { index: false }` in their metadata as a belt-and-braces signal, since `Disallow` prevents crawling but not indexing of already-known URLs.

### 4.3 Canonicals & clean URLs

Per-page `alternates.canonical` via `irMetadata()` is correct. Maintain rules:
- Canonical is always the **self-referential absolute URL** (no trailing-slash drift, no query params).
- One canonical per page; never point a unique page at another's canonical.
- `metadataBase` is set in `layout.tsx` → relative canonicals resolve correctly.

### 4.4 Core Web Vitals — targets & Next.js levers

| Metric | Target | Lever (Next.js-specific) |
|---|---|---|
| **LCP** | < 2.5s | `next/image` with `priority` on hero; preload hero font weight (Inter already `preload: true`); avoid client-component hero where RSC suffices. |
| **INP** | < 200ms | Keep interactivity in small Client Components; `dynamic(() => import(...), { ssr: false })` for heavy below-fold widgets (charts, video players). |
| **CLS** | < 0.1 | Always set `width`/`height` (or `fill` + sized container) on `next/image`; reserve space for embeds; `font-display: swap` with `next/font` (already configured) avoids FOIT shift. |
| **FCP** | < 1.5s | RSC streaming; inline critical CSS via Next defaults; minimize render-blocking third-party scripts (GA4/Clarity load via `next/script` `strategy="afterInteractive"`). |
| **TTFB** | < 0.8s | `force-dynamic` adds per-request CMS fetch cost — consider `unstable_cache`/short `revalidate` on **read-only** CMS reads where realtime freshness isn't required (sitemap stays dynamic). |

**Caching headers:** static assets (`/_next/static`, OG image, logo) should carry `Cache-Control: public, max-age=31536000, immutable`. HTML under `force-dynamic` should be `no-store` (correct for freshness) — accept the TTFB tradeoff or selectively cache stable marketing pages.

**Analytics scripts:** load GA4 + Clarity via `next/script strategy="afterInteractive"` so they never block LCP/INP.

### 4.5 Crawl / index optimization

- Submit sitemap in GSC + Bing; monitor **Coverage** for "Discovered – not indexed" (signals thin/low-value pages).
- Keep click-depth ≤ 3 from homepage to any indexable page (internal linking, §6).
- Use `robots: { index: false }` on gated/duplicate/utility routes; never let filtered/paginated junk into the sitemap.

---

## 5. Keyword Strategy — Pillars, Clusters & Silos

Six pillars, each a hub page that links to cluster pages and back (hub-and-spoke). Keyword mix: head terms (volume), long-tail (intent), investor-intent (conversion), and AI/tech/startup terms (positioning).

### Pillar 1 — AI in Global Trade
**Hub:** `/investment-thesis` (+ future `/insights/ai-in-global-trade`)
| Keyword | Type | Mapped page |
|---|---|---|
| AI in global trade | head | thesis / blog |
| AI-native trade platform | head | thesis |
| AI operating system for trade | long-tail | thesis |
| machine learning trade finance | long-tail | blog |
| AI logistics automation | long-tail | blog |
| AI trade compliance | long-tail | governance/framework |
| generative AI B2B trade | long-tail | blog |
| AI document automation trade | long-tail | blog |
| AI startup global trade | investor | why-invest |
| AI infrastructure company | positioning | company/story |
| trade tech AI platform | head | thesis |
| AI agents for trade operations | long-tail | blog |

### Pillar 2 — Trade Finance
**Hub:** `/market-opportunity` (+ `/insights/trade-finance-gap`)
| Keyword | Type | Mapped page |
|---|---|---|
| trade finance | head | market-opportunity |
| trade finance gap | head | market-opportunity |
| $2.5 trillion trade finance gap | long-tail | market-opportunity |
| digital trade finance platform | long-tail | thesis |
| supply chain finance technology | long-tail | blog |
| embedded trade finance | long-tail | blog |
| trade finance automation | long-tail | blog |
| SME trade finance access | long-tail | blog |
| trade finance fintech | head | why-invest |
| working capital trade | long-tail | blog |
| invoice financing platform | long-tail | blog |
| cross-border payments trade | long-tail | blog |

### Pillar 3 — B2B Trade Infrastructure
**Hub:** `/why-invest` (+ `/insights/b2b-trade-infrastructure`)
| Keyword | Type | Mapped page |
|---|---|---|
| B2B trade infrastructure | head | why-invest |
| global trade operating system | head | thesis |
| B2B SaaS trade platform | head | why-invest |
| trade infrastructure software | long-tail | thesis |
| unified trade platform | long-tail | thesis |
| logistics trade compliance platform | long-tail | thesis |
| digital trade infrastructure | head | market-opportunity |
| trade platform network effects | long-tail | thesis |
| B2B trade SaaS startup | investor | why-invest |
| enterprise trade software | long-tail | blog |
| trade ecosystem platform | long-tail | blog |
| trade data platform | long-tail | blog |

### Pillar 4 — Investor Relations / Why Invest
**Hub:** `/why-invest` + `/faq`
| Keyword | Type | Mapped page |
|---|---|---|
| invest in Baalvion | brand/investor | why-invest |
| AI startup investment opportunity | investor | why-invest |
| trade tech venture investment | investor | thesis |
| fintech startup to invest in | investor | why-invest |
| B2B SaaS investment thesis | investor | thesis |
| pre-IPO AI company | investor | why-invest |
| institutional investment AI trade | investor | why-invest |
| family office trade tech | investor | why-invest |
| venture capital trade infrastructure | investor | thesis |
| Baalvion investor relations | brand | homepage |
| Baalvion funding round | brand/investor | use-of-proceeds |
| Baalvion valuation | brand/investor | financials |
| Baalvion use of proceeds | brand | use-of-proceeds |

### Pillar 5 — Trade Compliance & AML
**Hub:** `/governance/framework`
| Keyword | Type | Mapped page |
|---|---|---|
| trade compliance automation | head | governance/framework |
| AML KYC trade platform | head | governance/framework |
| sanctions screening software | long-tail | blog |
| trade compliance technology | long-tail | governance/framework |
| automated customs compliance | long-tail | blog |
| HS code classification AI | long-tail | blog (programmatic) |
| export compliance software | long-tail | blog |
| trade-based money laundering prevention | long-tail | blog |
| regulatory technology trade | long-tail | blog |
| denied party screening | long-tail | blog |
| dual-use goods compliance | long-tail | blog |
| customs clearance automation | long-tail | blog |

### Pillar 6 — Company / Brand
**Hub:** `/company/story` + `/governance/framework`
| Keyword | Type | Mapped page |
|---|---|---|
| Baalvion | brand | homepage |
| what is Baalvion | brand | company/story |
| Baalvion company | brand | company/story |
| Baalvion founders | brand | governance/leadership |
| Baalvion leadership team | brand | governance/leadership |
| Baalvion board of directors | brand | governance/board-of-directors |
| Baalvion mission | brand | company/story |
| Baalvion AI trade | brand+head | company/story |
| Baalvion governance | brand | governance/framework |
| Baalvion news | brand | news-and-events/news |
| Baalvion press | brand | news-and-events/press-releases |

---

## 6. On-Page SEO

### 6.1 Title & meta templates (copy-ready, char limits)

Titles ≤ **60 chars** (incl. `| Baalvion` suffix via the App Router template); descriptions ≤ **155 chars**.

| Surface | Title template (≤60) | Description template (≤155) |
|---|---|---|
| Homepage | `Baalvion \| AI-Native OS for Global B2B Trade` | `Baalvion is the AI-native operating system for global B2B trade — unifying logistics, trade finance and compliance. Investor relations hub.` |
| Why Invest | `Why Invest in Baalvion \| AI Trade Infrastructure` | `A $13T market, an AI technology moat, platform economics and network effects. Why Baalvion is a category-defining investment.` |
| Thesis | `Investment Thesis \| Baalvion AI Trade OS` | `The Baalvion thesis: the structural gap in global trade, our AI-native solution, the $13T market, and why now is the inflection point.` |
| Market | `Market Opportunity TAM/SAM/SOM \| Baalvion` | `$13T+ B2B trade flows, a $2.5T finance gap, ~80% still un-digitised. Explore Baalvion's TAM, SAM, SOM and AI market opportunity.` |
| Use of Proceeds | `Use of Proceeds \| Baalvion Growth Plan` | `How Baalvion deploys capital: product, AI infrastructure, R&D, go-to-market and global expansion — a disciplined, milestone-gated plan.` |
| Financials | `Financial Framework \| Baalvion IR` | `Baalvion's illustrative model: ARR trajectory, path to profitability, software-like margins and unit economics. Forward-looking.` |
| Governance | `Corporate Governance \| Baalvion` | `Governance built for institutional trust: board, disclosure, compliance, ethics and enterprise risk management at Baalvion.` |
| FAQ | `Investor FAQ \| 40 Answers \| Baalvion` | `Forty detailed answers for investors: business model, revenue, competition, technology, funding, risk factors and exit potential.` |
| Resources | `Investor Resources & Downloads \| Baalvion` | `Baalvion investor presentations, reports, financial statements, news releases and media kit. For qualified investors.` |
| News article | `{Headline} \| Baalvion News` | `{Dek — 1 sentence, ≤155 chars summarizing the announcement.}` |
| Press release | `{Headline} \| Baalvion Press` | `{Lede sentence of the release, ≤155 chars.}` |
| Leadership profile | `{Name}, {Title} \| Baalvion Leadership` | `{Name} is {Title} at Baalvion. {One-line bio focused on trade/AI/finance credibility.}` |
| Blog post | `{Title} \| Baalvion Insights` | `{Value-prop sentence with primary keyword, ≤155 chars.}` |

### 6.2 Heading hierarchy

- **One `<h1>` per page**, containing the primary keyword (e.g., Why-Invest H1: "Why Invest in Baalvion").
- `<h2>` for each major section; `<h3>` for sub-points. **Never skip levels** (no H2→H4).
- FAQ: each question is an `<h3>` (or `<dt>`), matching the `FAQPage` schema entries.
- Keep one keyword theme per page; don't dilute the H1 across unrelated topics.

### 6.3 Internal linking — hub-and-spoke link map

Wire these contextual links (anchor text in *italics*). Each pillar links **down** to clusters and clusters link **up** to the pillar.

```
Homepage
 ├─ "why invest in Baalvion"        → /why-invest        (PILLAR)
 ├─ "our investment thesis"         → /investment-thesis (PILLAR)
 ├─ "the $13T market opportunity"   → /market-opportunity(PILLAR)
 └─ "investor resources"            → /resources

/why-invest  (Pillar: B2B infra + investor)
 ├─ "read the full investment thesis"      → /investment-thesis
 ├─ "explore the market opportunity"       → /market-opportunity
 ├─ "how we deploy capital"                → /use-of-proceeds
 ├─ "our financial framework"              → /financials
 └─ "40 investor questions answered"       → /faq

/investment-thesis  (Pillar: AI in trade)
 ├─ "the trade finance gap"                → /market-opportunity
 ├─ "our AI-native governance & compliance"→ /governance/framework
 ├─ "the team building this"               → /company/story
 └─ "why invest now"                       → /why-invest   (back to pillar)

/market-opportunity  (Pillar: trade finance)
 ├─ "how Baalvion captures this market"    → /investment-thesis
 ├─ "use of proceeds to win it"            → /use-of-proceeds
 └─ "why this is the moment to invest"     → /why-invest

/governance/framework  (Pillar: compliance & AML)
 ├─ "meet the board of directors"          → /governance/board-of-directors
 ├─ "leadership team"                      → /governance/leadership
 └─ "our investment thesis"                → /investment-thesis

/company/story  (Pillar: brand)
 ├─ "the market we're attacking"           → /market-opportunity
 ├─ "why invest in Baalvion"               → /why-invest
 └─ "leadership & governance"              → /governance/framework

/faq → links to /why-invest, /financials, /use-of-proceeds, /governance/framework per relevant answer.
/resources → links to /financials, /news-and-events/press-releases, /why-invest.
```

**Anchor-text rules:** descriptive and keyword-bearing, never "click here"; vary anchors to the same target; keep contextual (in body prose, not just nav).

---

## 7. Structured Data

| Schema type | Where applied | Status | Action |
|---|---|---|---|
| Organization + FinancialService | Root `layout.tsx` | Live | Keep `sameAs` current as profiles grow (Crunchbase, PitchBook). |
| WebSite | Root `layout.tsx` | Live | Add `potentialAction` `SearchAction` if/when on-site search exists. |
| Person | Leadership detail | Live | Add `worksFor` → Org `@id`, `jobTitle`, `image`, `sameAs` (LinkedIn). |
| NewsArticle | News pages | Live | Ensure `datePublished`, `dateModified`, `author`, `image`. |
| BreadcrumbList | All institutional pages | Live | Keep in sync with route structure. |
| FAQPage | `/faq` | Live | Keep Q/A text identical to on-page DOM. |
| **Article / BlogPosting** | `/insights/[slug]` | **To add** | On blog launch: `headline`, `author`, `datePublished`, `image`, `articleSection`, link `publisher` → Org `@id`. |
| **Event** | investor-day, events, webcast | **To add** | `name`, `startDate`, `eventAttendanceMode`, `location`/`VirtualLocation`, `organizer` → Org. |
| **VideoObject** | webcasts, demos | **To add** | `name`, `thumbnailUrl`, `uploadDate`, `contentUrl`/`embedUrl`, `duration`. |
| **DefinedTerm / DefinedTermSet** | `/glossary/[term]` | **To add** | For glossary featured-snippet capture. |

Validate all types in Google Rich Results Test + Schema Markup Validator before shipping.

---

## 8. Content Strategy

### 8.1 Pillar pages (done) + cluster expansion (to build)

The 9 institutional pages are the pillars. Each needs **3–5 supporting cluster articles** on the blog that link up to the pillar. Priority cluster builds: AI-in-trade, trade-finance-gap, compliance-automation, B2B-infrastructure.

### 8.2 Blog strategy — `/insights` (12–16 seed articles)

| # | Title | Primary keyword | Intent |
|---|---|---|---|
| 1 | What Is an AI-Native Operating System for Global Trade? | AI-native trade platform | Informational / brand |
| 2 | The $2.5 Trillion Trade Finance Gap, Explained | trade finance gap | Informational |
| 3 | Why B2B Trade Infrastructure Is the Next Great SaaS Category | B2B trade infrastructure | Informational / investor |
| 4 | How AI Is Automating Trade Compliance and AML | AI trade compliance | Informational |
| 5 | Logistics, Trade Finance, Compliance: Why One Platform Wins | unified trade platform | Commercial / thesis |
| 6 | Network Effects in B2B Trade Platforms | trade platform network effects | Investor |
| 7 | Embedded Finance in Global Trade: The Opportunity | embedded trade finance | Informational |
| 8 | AI Agents for Trade Operations: A Primer | AI agents trade operations | Informational |
| 9 | HS Code Classification with AI: Accuracy & Compliance | HS code classification AI | Long-tail / programmatic seed |
| 10 | The State of Digital Trade Adoption in 2026 | digital trade adoption | Informational / link bait |
| 11 | Sanctions Screening: How Modern Software Works | sanctions screening software | Informational |
| 12 | What VCs Look for in Trade-Tech Startups | trade tech venture investment | Investor |
| 13 | TAM, SAM, SOM for Global B2B Trade | B2B trade market opportunity | Investor |
| 14 | From Founders Who Lived the Problem: The Baalvion Story | Baalvion story | Brand |
| 15 | Cross-Border Payments and the Future of Trade Settlement | cross-border payments trade | Informational |
| 16 | Why Now: The Inflection Point for AI in Global Commerce | AI global trade inflection | Investor / thesis |

**Cadence:** 2 articles/week in M3–M6; 1/week thereafter. Each ≥1,200 words, original data/POV, `Article` schema, internal links to the relevant pillar.

### 8.3 Investor-content strategy

- **Quarterly investor letters** → published as `Article` under `/insights` + gated PDF in `/resources` (download = tracked conversion).
- **Monthly traction updates** (anonymized metrics) → builds "Baalvion news" brand SERP and freshness signals.
- **Data-room gated content** → indexable landing page (value prop + form) with the asset itself behind auth (`robots: noindex` on the gated file routes; the landing page is indexable and is the conversion surface).

### 8.4 Authority-building plan (the new-domain fix)

| Tactic | Detail | Target |
|---|---|---|
| Digital PR | Pitch the "$2.5T trade finance gap" data piece + founder POV to fintech/trade press. | 10–15 referring domains over M7–M9 |
| Thought leadership | Founder bylines on AI-in-trade in tier-1 industry outlets. | 5+ authoritative backlinks |
| Comparison pages | "Baalvion vs point tools", "unified vs fragmented trade stack". | Mid-funnel + branded-comparison traffic |
| Glossary / definitions | `/glossary/[term]` for "what is trade-based money laundering", "what is supply chain finance", etc. | Featured snippets, long-tail |
| Programmatic corridor/HS pages | `/corridors/[from]-[to]`, `/hs-codes/[code]` with **quality guards**: min 300 unique words, real data per page, `noindex` until threshold met, canonical discipline. | Long-tail scale without thin-page risk |
| Directory / citation | Crunchbase, PitchBook, LinkedIn, AngelList consistent NAP + link. | Trust + brand SERP |

---

## 9. Analytics Setup

### 9.1 Google Search Console (highest priority)

1. Create a **Domain property** for `baalvion.com` (covers `ir.` subdomain) — preferred over URL-prefix.
2. Verify via DNS TXT (domain property) **or** the HTML-tag method using `NEXT_PUBLIC_GSC_VERIFICATION` (the env-gated `<meta name="google-site-verification">`).
3. **Submit `https://ir.baalvion.com/sitemap.xml`** under Sitemaps.
4. Monitor weekly: Coverage, Performance (impressions/clicks/position), Enhancements (rich results), Core Web Vitals (field data).

### 9.2 GA4

1. Create a GA4 property → copy the **Measurement ID** (`G-XXXXXXXXXX`) into `NEXT_PUBLIC_GA4_ID`.
2. Loaded as an env-gated `next/script` (`strategy="afterInteractive"`).
3. **Key events to mark as conversions** for an IR site:
   - `ir_contact_submit` — IR contact form submission
   - `resource_download` — investor presentation / report PDF download
   - `onboarding_start` — investor onboarding initiated
   - `email_alert_signup` — `/resources/email-alerts`
   - `scroll_75` — engaged read on pillar pages (proxy for content quality)
4. Link GA4 ↔ GSC for the Search Console report inside GA4.

### 9.3 Bing Webmaster Tools

1. Sign in, **Import from GSC** (carries over verification + sitemap).
2. Alternatively verify via `NEXT_PUBLIC_BING_VERIFICATION` meta tag.
3. Submit sitemap; monitor Bing/Edge + ChatGPT-search referrals.

### 9.4 Microsoft Clarity

1. Create a Clarity project → copy the ID into `NEXT_PUBLIC_CLARITY_ID`.
2. Use heatmaps + session replay to find: pillar-page drop-off, dead clicks on CTAs, rage clicks on forms.
3. Cross-reference Clarity engagement with GA4 conversions to prioritize CRO.

**Env var summary (all read as gated `next/script` / `<meta>`):**

| Variable | Purpose | Read at |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | GA4 Measurement ID | analytics script (afterInteractive) |
| `NEXT_PUBLIC_CLARITY_ID` | Clarity project | analytics script |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google site verification | `<meta>` in `<head>` |
| `NEXT_PUBLIC_BING_VERIFICATION` | Bing site verification | `<meta>` in `<head>` |

---

## 10. Metadata Templates (ready-to-use)

Use with the existing `irMetadata()` helper / `IR_PAGES` envelope pattern. (Titles already get `| Baalvion` via the App Router `template`; counts below are the displayed full title.)

```txt
HOMEPAGE
  title:       Baalvion | AI-Native OS for Global B2B Trade
  description: Baalvion is the AI-native operating system for global B2B trade — unifying logistics, trade finance and compliance. Investor relations hub.

WHY INVEST
  title:       Why Invest in Baalvion | AI Trade Infrastructure
  description: A $13T market, an AI technology moat, platform economics and network effects. See why Baalvion is a category-defining investment.

INVESTMENT THESIS
  title:       Investment Thesis | Baalvion AI Trade OS
  description: The Baalvion thesis: the structural gap in global trade, our AI-native solution, the $13T market, and why now is the inflection point.

MARKET OPPORTUNITY
  title:       Market Opportunity TAM/SAM/SOM | Baalvion
  description: $13T+ B2B trade flows, a $2.5T finance gap, ~80% un-digitised. Explore Baalvion's TAM, SAM, SOM and AI market opportunity.

USE OF PROCEEDS
  title:       Use of Proceeds | Baalvion Growth Plan
  description: How Baalvion deploys capital: product, AI infrastructure, R&D, go-to-market and global expansion — a disciplined, milestone-gated plan.

FINANCIALS
  title:       Financial Framework | Baalvion Investor Relations
  description: Baalvion's illustrative model: ARR trajectory, path to profitability, software-like margins and unit economics. Forward-looking.

GOVERNANCE
  title:       Corporate Governance | Baalvion
  description: Governance built for institutional trust: board, disclosure, compliance, ethics and enterprise risk management at Baalvion.

FAQ
  title:       Investor FAQ — 40 Answers | Baalvion
  description: Forty detailed answers for investors: business model, revenue, competition, technology, funding, risk factors and exit potential.

RESOURCES
  title:       Investor Resources & Downloads | Baalvion
  description: Baalvion investor presentations, reports, financial statements, news releases and media kit. For qualified investors.

NEWS ARTICLE
  title:       {Headline} | Baalvion News
  description: {One-sentence dek summarizing the announcement, ≤155 chars.}

PRESS RELEASE
  title:       {Headline} | Baalvion Press
  description: {Lede sentence of the release, ≤155 chars.}

LEADERSHIP PROFILE
  title:       {Name}, {Title} | Baalvion Leadership
  description: {Name} is {Title} at Baalvion. {One-line bio with trade/AI/finance credibility.}

BLOG POST
  title:       {Title} | Baalvion Insights
  description: {Value-prop sentence with the primary keyword, ≤155 chars.}
```

---

## 11. 12-Month SEO Roadmap

### Phase 1 — Foundation (M1–M2)
**Deliverables:** OG image + logo live; GSC domain property + sitemap submitted; GA4 + Clarity + Bing live with key events; internal-link hub-and-spoke wired; meta-description trim; H1/heading + `alt` audits; `Event` schema on events routes; `not-found` 404 verified.
**KPIs:** 100% P0 fixes shipped · all 9 pillars indexed · GSC reporting impressions · 0 critical CWV failures.

### Phase 2 — Content Engine (M3–M6)
**Deliverables:** `/insights` blog live with `Article` schema; 16 seed articles published (2/week); glossary v1 (8–10 terms); first quarterly investor letter; cluster→pillar internal links.
**KPIs:** 150+ indexed URLs · 10k+ monthly impressions · 30+ ranking keywords · avg position < 40 · first page-1 long-tail rankings.

### Phase 3 — Authority (M7–M9)
**Deliverables:** digital-PR data piece + 2 founder bylines; comparison pages; directory citations (Crunchbase/PitchBook/LinkedIn); programmatic corridor/HS pages (with quality guards) behind `noindex`-until-threshold.
**KPIs:** 25+ referring domains · 18k+ monthly impressions · 5+ page-1 keywords · domain trust trending up · first organic IR conversions.

### Phase 4 — Scale & Optimize (M10–M12)
**Deliverables:** scale blog to 1/week sustained; release vetted programmatic pages to index; CRO from Clarity insights; refresh/expand top pillars; second investor letter; INP/CLS optimization pass.
**KPIs:** 500+ indexed URLs · 25k+ monthly impressions · 1.5k+ clicks/mo · 40+ referring domains · avg position < 25 · measurable IR contact/download conversion rate.

---

## 12. Quick Wins (0–30 days) vs Long-Term Growth (6–12 months)

### Quick Wins (0–30 days)
- [ ] Ship OG image + confirm logo (fix social/AI previews).
- [ ] GSC domain property + submit sitemap.
- [ ] GA4 + Clarity + Bing live; define 5 key events.
- [ ] Wire internal hub-and-spoke links among the 9 pillars.
- [ ] Trim over-length meta descriptions to ≤155 chars.
- [ ] H1 / heading + image-`alt` audit fixes.
- [ ] Add `Event` schema to events/webcast/investor-day.
- [ ] Verify `not-found.tsx` returns HTTP 404.
- [ ] Add consistent NAP citations (Crunchbase, LinkedIn, PitchBook).

### Long-Term Growth (6–12 months)
- [ ] Sustained blog (16 seed → weekly) with `Article` schema.
- [ ] Glossary + featured-snippet capture.
- [ ] Digital PR + founder bylines → 40+ referring domains.
- [ ] Comparison pages for mid-funnel + branded-comparison capture.
- [ ] Programmatic corridor/HS-code pages with quality guards.
- [ ] Quarterly investor letters + gated data-room conversion funnel.
- [ ] CWV/INP optimization and CRO from Clarity data.
- [ ] `VideoObject` on webcasts/demos.

---

## 13. KPI Dashboard

| Metric | Source | Baseline (M0) | M3 | M6 | M9 | M12 target |
|---|---|---|---|---|---|---|
| Indexed URLs | GSC Coverage | ~12 | 80 | 150 | 300 | **500+** |
| Impressions / mo | GSC Performance | 0 | 4k | 10k | 18k | **25k+** |
| Clicks / mo | GSC Performance | 0 | 200 | 600 | 1,000 | **1,500+** |
| Avg position | GSC Performance | — | 45 | 38 | 30 | **< 25** |
| Ranking keywords | GSC / rank tracker | 0 | 30 | 80 | 150 | **250+** |
| Referring domains | GSC Links / Ahrefs | 0 | 5 | 15 | 25 | **40+** |
| Page-1 keywords | rank tracker | 0 | 0–2 | 5 | 12 | **25+** |
| Core Web Vitals (pass) | GSC / CrUX | TBD | 100% | 100% | 100% | **100% good** |
| IR conversions / mo | GA4 key events | 0 | track | grow | grow | **measurable rate** |
| Branded SERP ownership | GSC / manual | partial | strong | own | own | **own page 1** |

**Review cadence:** weekly GSC glance (coverage/errors), monthly KPI dashboard review, quarterly strategy reset against the roadmap.

---

*Prepared for the Baalvion Investor Relations growth program. Documentation deliverable only — no code changes. Reflects the production state of `src/lib/sitemap.ts`, `src/app/robots.ts`, `src/app/layout.tsx`, and `src/lib/ir-pages.ts` as of 2026-06-11.*
