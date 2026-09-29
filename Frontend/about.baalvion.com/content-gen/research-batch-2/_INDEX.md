# Baalvion Research — Batch 2 (Trade Fundamentals / Education Cluster)

**Publication:** about.baalvion.com — `/guides` (Research, Insights & Guides hub)
**Editorial role:** Chief Content Officer / Research Director / SEO & Trade Education Lead
**Batch theme:** Establish Baalvion as a trusted educational reference on the *fundamentals* of global
trade — the building blocks every exporter must understand (classification, the actors, documentation,
and compliance). Where Batch 1 diagnosed the *problem* and defined the *category*, Batch 2 teaches the
*mechanics*, then quietly links the reader back up to the category hub.
**Status:** Drafts complete — ready for editorial QA → CMS seeding.

---

## 1. Why this batch is assigned to about.baalvion.com/guides

All five pieces are **educational / reference** content — the mandate of the `/guides` section
(instructional, evergreen, authority-building). They define core trade concepts accurately and
practically, then link *outward* to the commercial product (`baalvion.com`) and *up* to the Batch 1
category hub ("What Is a Trade Operating System?"). This concentrates topical authority on
about.baalvion.com and builds a clean internal link graph.

The batch is a **fundamentals cluster**:

```
HS Codes ──► Freight Forwarder ──► Customs Broker ──► Export Docs ──► Export Compliance
 (classify)   (who moves it)        (who clears it)     (the paperwork)   (is it legal?)
```

Each guide cross-links to its siblings and back to Batch 1's problem/cost/delay articles and the
Trade Operating System hub.

---

## 2. Article manifest

| # | Title | Section | URL (canonical) | Primary keyword | Intent |
|---|-------|---------|-----------------|-----------------|--------|
| 1 | HS Codes Explained: The Foundation of Global Trade Classification | `/guides` | `https://about.baalvion.com/guides/hs-codes-explained` | HS codes | Informational |
| 2 | What Does a Freight Forwarder Actually Do? | `/guides` | `https://about.baalvion.com/guides/freight-forwarder-explained` | freight forwarder | Informational |
| 3 | What Is a Customs Broker and Why Do Exporters Need One? | `/guides` | `https://about.baalvion.com/guides/customs-broker-explained` | customs broker | Informational |
| 4 | The Complete Export Documentation Checklist | `/guides` | `https://about.baalvion.com/guides/export-documentation-checklist` | export documentation checklist | Informational / transactional |
| 5 | Export Compliance Guide: Everything Exporters Need to Know | `/guides` | `https://about.baalvion.com/guides/export-compliance-guide` | export compliance | Informational |

Each file carries full YAML front-matter (seo_title, meta_description, target/secondary keywords,
search_intent, audience_segment) plus body sections: Executive Summary, full article, Industry Context,
Process Flow, Tables/Frameworks, Practical Checklist, Common Mistakes, Best Practices, FAQ, Internal
Linking Recommendations, CTA Recommendations, and Schema Markup Recommendations.

---

## 3. Internal-link graph

**Within about.baalvion.com:**
- The 5 Batch 2 guides cross-link as a fundamentals cluster.
- Each links to Batch 1: `/insights/global-trade-emails-pdfs-spreadsheets`,
  `/insights/hidden-cost-export-documentation`, `/insights/export-delays-before-cargo-moves`,
  `/guides/factory-to-port-export-process`, and the hub `/research/what-is-a-trade-operating-system`.

**To baalvion.com (commercial):**
- `https://baalvion.com/platform`, `/compliance`, `/documentation`, `/ai` (cited per topical relevance).

> **Action before publish:** confirm the `baalvion.com/{platform,compliance,documentation,ai}` routes
> exist or are on the roadmap; if a target slug differs, update the anchor in the relevant guide.

---

## 4. Schema markup

| # | Recommended JSON-LD types |
|---|---------------------------|
| 1 | TechArticle + FAQPage + BreadcrumbList + (optional) DefinedTermSet |
| 2 | TechArticle + FAQPage + BreadcrumbList + (optional) HowTo |
| 3 | TechArticle + FAQPage + BreadcrumbList + (optional) DefinedTerm |
| 4 | TechArticle + FAQPage + BreadcrumbList + HowTo/ItemList |
| 5 | TechArticle + FAQPage + BreadcrumbList + HowTo + (optional) DefinedTerm |

---

## 5. Editorial standards applied

- **Voice:** institutional, research-grade reference material — no startup hype, no product pitch.
- **Category positioning:** the "Industry Context" section of each guide shows how documentation,
  classification, logistics, and compliance are managed through *fragmented* systems, letting the reader
  recognize the need for a unified Trade Operating System without being sold to.
- **Domain accuracy:** correct use of WCO/HS structure and GRI, Incoterms, House/Master B/L, NVOCC,
  UCP 600, customs valuation, ICEGATE/Shipping Bill, CBLR 2018, EAR/ECCN, ITAR, OFAC, SCOMET, DGFT,
  Wassenaar. Regulatory specifics are flagged as orientation, not legal advice.

---

## 6. Next steps to publish (REQUIRED — content is not yet live)

These drafts are stored in the repo only. The live site renders from the **CMS** (`@/lib/cms`), and the
app currently has **no `/guides/[slug]` route**. To make `about.baalvion.com/guides/...` resolve:

1. **Build the `/guides` route** — add `src/app/guides/[slug]/page.tsx` (+ index) mirroring
   `about/[slug]` and `case-studies/[slug]`, with `generateStaticParams` from CMS `kind: "guide"`.
   (Batch 1 #4 also targets `/guides/...` and faces the same gap.)
2. **Transform to CMS JSON** — map these markdown files to the `blocks[]` schema used by
   `content-gen/articles/*.json` (paragraph / heading / list + `seo`, `faqs`, `internalLinks`).
3. **Seed into the running CMS** — POST the documents to the CMS API (the about-baalvion CMS service)
   with `category: "trade"`, `kind: "guide"`.
4. **Rebuild + deploy** the Next app (Vercel / App Hosting) so ISR picks up the new pages.
5. **Sitemap** — register the five new `/guides/...` URLs.

> Steps 3–4 require the running CMS and a deploy on Baalvion infrastructure.

---

*Prepared as Batch 2 of the Baalvion trade-knowledge publication program.*
