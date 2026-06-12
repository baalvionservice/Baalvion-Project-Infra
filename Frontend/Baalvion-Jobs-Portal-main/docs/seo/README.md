# SEO Growth Blueprint — jobs.baalvion.com

A complete, implementation-ready SEO foundation for **Baalvion Jobs** — an online job board connecting employers and job seekers in India, focused on technology, software, remote, startup, and professional jobs.

**Audience:** the engineering and content team. Everything here is meant to be implemented as written — real content, templates, metadata, schema, and code examples.

**Primary domain used throughout:** `https://jobs.baalvion.com`

---

## How to use this blueprint

1. **Build the technical foundation first** (`phase-5-technical-seo.md` + `phase-6-schema.md`). Nothing ranks until jobs are crawlable, indexable, and Google-for-Jobs eligible.
2. **Publish the 10 core landing pages** (`phase-2-landing-pages.md`).
3. **Wire the programmatic system** (`phase-3-programmatic.md`) and roll it out in waves.
4. **Launch the blog** (`phase-4-blog-plan.md`) — pillars first.
5. **Publish the 40 additional pages** (`phase-8-*.md`) as job inventory clears the count gate.
6. **Follow the month-by-month plan** (`phase-7-roadmap.md`).

---

## Contents

| File | Phase | What's inside |
|---|---|---|
| [phase-1-audit-strategy.md](phase-1-audit-strategy.md) | 1 | Site architecture, URL structure, internal linking, silos, category/location/job-page structure, blog strategy, programmatic opportunities, EEAT, technical/schema/sitemap recommendations — each with the *why*. |
| [phase-2-landing-pages.md](phase-2-landing-pages.md) | 2 | 10 full pages (Home, About, Remote, Freshers, Software Developer, Data Science, DevOps, Mumbai, Pune, Employers) — SEO title, meta, slug, H1, H2s, FAQ, internal links, 1,000–1,500 words each. |
| [phase-3-programmatic.md](phase-3-programmatic.md) | 3 | Templates for `/jobs/[role]`, `/jobs/[role]-in-[city]`, `/remote-[role]-jobs`, `/fresher-[role]-jobs` — title/meta/H1/content/FAQ/schema templates + the indexability gate + governance rules. |
| [phase-4-blog-plan.md](phase-4-blog-plan.md) | 4 | 100 blog ideas across 8 categories with keyword, intent, difficulty, funnel stage; pillar–cluster map; 6-month publishing cadence. |
| [phase-5-technical-seo.md](phase-5-technical-seo.md) | 5 | robots.txt, sitemap index, canonicals, pagination, faceted navigation, indexing controls/job lifecycle, Core Web Vitals, crawl optimization — with Next.js 15 code examples. |
| [phase-6-schema.md](phase-6-schema.md) | 6 | JSON-LD for Organization, WebSite, BreadcrumbList, JobPosting (+ remote variant), FAQPage, Article, ItemList; per-page-type matrix. |
| [phase-7-roadmap.md](phase-7-roadmap.md) | 7 | Month-by-month execution plan (Months 1–6): tasks, priorities, outcomes, KPIs, traffic goals + a cumulative KPI dashboard. |
| [phase-8-location-pages.md](phase-8-location-pages.md) | 8a | 20 publish-ready city pages (Bengaluru, Hyderabad, Chennai, Delhi-NCR, Gurgaon, Noida, Kolkata, Ahmedabad, Jaipur, Indore, Chandigarh, Kochi, Coimbatore, Thiruvananthapuram, Nagpur, Bhubaneswar, Visakhapatnam, Mysuru, Navi Mumbai, Thane) — 800+ words each. |
| [phase-8-category-pages.md](phase-8-category-pages.md) | 8b | 20 publish-ready role pages (Backend, Frontend, Full-Stack, Java, Python, React, Node.js, Android, iOS, Data Analyst, Data Engineer, ML Engineer, Cloud, QA, Product Manager, UI/UX, Business Analyst, Digital Marketing, Cybersecurity, PHP) — 800+ words each. |

---

## The three things that make or break job-board SEO (read first)

1. **Google for Jobs eligibility** — correct `JobPosting` schema on every job (Phase 6) + the Indexing API (Phase 5 §8). This is the single highest-intent traffic source for a job board.
2. **Programmatic scale *with* a thin-content gate** — generate thousands of role/city pages, but `noindex` + drop from sitemap any aggregation page below `INDEX_THRESHOLD` live jobs (Phase 3 + Phase 5 §6). Unguarded programmatic SEO is the fastest way to get de-indexed.
3. **Freshness & expiry discipline** — index live jobs fast, mark expired jobs `noindex` + accurate `validThrough`, remove from sitemap, then 410/301 (Phase 5 §6). Stale jobs are the #1 quality killer for job boards.

---

## Key configuration (set once, used everywhere)

```ts
SITE_URL = "https://jobs.baalvion.com"
SITE_NAME = "Baalvion Jobs"
INDEX_THRESHOLD = 3   // min live jobs for an aggregation page to be indexable
```

## Controlled vocabularies to build (drive all programmatic URLs)

- **roles** (slug, title, plural, L1/L2 taxonomy) — Tier-1 launch set in `phase-1` §5.
- **cities** (slug, name, region, alias map → 301) — launch set in `phase-1` §6.
- **skills** (slug, name) — for `/skills/[skill]` bridge pages.

> All metrics and salary ranges in the content are written to be filled/verified from real data. Replace placeholder figures with values from your listings before publishing, and keep salary claims grounded (EEAT — see `phase-1` §10).
