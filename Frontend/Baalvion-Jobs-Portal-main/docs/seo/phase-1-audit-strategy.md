# Phase 1 — SEO Audit & Strategy

**Domain:** `jobs.baalvion.com`
**Business:** Online job board connecting employers and job seekers in India — focus on technology, software, remote, startup, and professional jobs.
**Objective:** Maximum organic Google traffic + complete, fast, correct indexing of high-value pages.

---

## 0. What a modern job portal needs to win SEO in 2026

Job boards are a special SEO category because they compete with **Indeed, Naukri, LinkedIn, Foundit (Monster), Instahyre, Cutshort, Wellfound (AngelList), and Google for Jobs** itself. Three forces define the game:

1. **Google for Jobs (the enriched search experience).** Google ingests `JobPosting` structured data and renders an in-SERP job widget. If your jobs are not in Google for Jobs, you lose the highest-intent click. This is **non-negotiable infrastructure**, not a nice-to-have. (See `phase-6-schema.md`.)
2. **Programmatic scale with quality control.** The traffic on job boards comes from the long tail: `python developer jobs in pune`, `remote react jobs`, `fresher data analyst jobs`. You need thousands of templated pages — but Google aggressively de-indexes thin, near-duplicate, or empty (zero-result) job pages. The strategy must generate scale **and** defend against thin-content penalties. (See `phase-3-programmatic.md`.)
3. **Freshness + expiry discipline.** Job listings decay. Expired jobs left indexed are the #1 quality killer for job boards (Google explicitly penalizes stale `JobPosting` data). You need a lifecycle: index fast → keep fresh → mark expired → remove from sitemap → 410/redirect. (See `phase-5-technical-seo.md`.)

Everything below serves those three forces.

---

## 1. Complete Site Architecture

A flat, silo-driven architecture. **Target: every indexable page reachable within 3 clicks from the homepage**, and every money page within 2.

```
jobs.baalvion.com/
│
├── /                                  ← Home (brand + top hubs + search)
│
├── /jobs                              ← Master jobs hub (all jobs, faceted search)
│   ├── /jobs/[role]                   ← Role hub:  /jobs/software-developer
│   ├── /jobs/[role]-in-[city]         ← Role×City: /jobs/software-developer-in-pune
│   ├── /jobs/in/[city]                ← City hub:  /jobs/in/mumbai
│   └── /jobs/[role]/[job-id]-[slug]   ← Individual job posting
│
├── /remote                            ← Remote hub
│   └── /remote-[role]-jobs            ← /remote-react-developer-jobs
│
├── /fresher                           ← Freshers hub
│   └── /fresher-[role]-jobs           ← /fresher-data-analyst-jobs
│
├── /companies                         ← Company directory hub
│   └── /companies/[company-slug]      ← /companies/baalvion (company profile + open roles)
│
├── /skills                            ← Skill hub (SEO bridge pages)
│   └── /skills/[skill]                ← /skills/python  (jobs + learning + salary)
│
├── /salary                            ← Salary hub
│   └── /salary/[role]                 ← /salary/software-developer (+ optional -in-[city])
│
├── /employers                         ← Employer landing (post-a-job conversion)
│   ├── /employers/post-a-job
│   └── /employers/pricing
│
├── /blog                              ← Content marketing hub
│   ├── /blog/[category]               ← /blog/interview, /blog/resume ...
│   └── /blog/[post-slug]
│
├── /about
├── /contact
├── /faqs
└── /legal: /privacy /terms /data-protection
```

**WHY this shape:**
- **Silos** (`/jobs`, `/remote`, `/fresher`, `/skills`, `/salary`, `/blog`) concentrate topical authority. Google rewards sites that demonstrate depth on a topic; siloing internal links keeps PageRank and topical relevance inside the right cluster.
- **Hub-and-spoke**: each hub (e.g. `/jobs/software-developer`) links down to spokes (`/jobs/software-developer-in-pune`) and across to siblings (Data Science, DevOps). Spokes link back up. This distributes link equity to the long tail.
- **Short, stable money URLs** (`/remote`, `/employers`) earn links and rank for head terms; programmatic URLs harvest the tail.

---

## 2. URL Structure

### Rules (enforce in code, not by convention)
- **Lowercase, kebab-case, ASCII only.** `react-developer`, never `React_Developer`.
- **No trailing slash** (pick one and 301 the other — recommend no trailing slash).
- **No URL parameters for indexable content.** Parameters (`?page=`, `?sort=`, `?type=`) are for faceted/paginated states that are *canonicalized away or noindexed* (see Phase 5). Indexable facets get clean path URLs.
- **Stable job IDs in job URLs** so the slug can change without breaking the canonical: `/jobs/software-developer/48213-senior-react-developer-baalvion`.
- **City and role come from a controlled vocabulary** (a `roles` table and `cities` table), so URLs are deterministic and dedupe-able (`bengaluru` not `bangalore`/`bengaluru` both — pick one canonical, 301 the alias).

### Canonical URL patterns

| Page type | Pattern | Example |
|---|---|---|
| Home | `/` | `jobs.baalvion.com/` |
| All jobs | `/jobs` | `/jobs` |
| Role hub | `/jobs/[role]` | `/jobs/software-developer` |
| Role × City | `/jobs/[role]-in-[city]` | `/jobs/data-scientist-in-mumbai` |
| City hub | `/jobs/in/[city]` | `/jobs/in/pune` |
| Job posting | `/jobs/[role]/[id]-[slug]` | `/jobs/devops-engineer/51002-aws-devops-engineer-acme` |
| Remote hub | `/remote` | `/remote` |
| Remote role | `/remote-[role]-jobs` | `/remote-python-developer-jobs` |
| Fresher hub | `/fresher` | `/fresher` |
| Fresher role | `/fresher-[role]-jobs` | `/fresher-software-developer-jobs` |
| Skill | `/skills/[skill]` | `/skills/kubernetes` |
| Salary | `/salary/[role]` | `/salary/data-scientist` |
| Company | `/companies/[slug]` | `/companies/baalvion` |
| Employers | `/employers/post-a-job` | `/employers/post-a-job` |
| Blog post | `/blog/[slug]` | `/blog/how-to-write-a-resume-for-freshers` |

**WHY:** Keyword-rich, human-readable URLs are a ranking and CTR signal, are anchor-text when shared, and make the site map self-documenting. Controlled vocabularies prevent the #1 programmatic-SEO failure: thousands of duplicate URLs for the same concept.

---

## 3. Internal Linking Strategy

Internal links are how a job board distributes authority to its long tail. Algorithmic, not manual.

### Link graph rules
1. **Home → top 8 role hubs + top 8 city hubs + Remote + Freshers + Employers.** (Curated, high-value.)
2. **Every Role hub → its top 15 city variants** ("Software Developer jobs in Mumbai, Pune, Bengaluru…") **+ 6 sibling roles** ("Related roles: Backend, Frontend, Full-Stack…").
3. **Every City hub → its top 15 role variants + 6 nearby cities.**
4. **Every Role×City page → parent role hub, parent city hub, 5 sibling cities (same role), 5 sibling roles (same city), 3 related skills, salary page.** This creates a dense lattice so any leaf is ≤2 clicks from a hub.
5. **Every job posting → role hub, role×city page, company profile, 3 "similar jobs", relevant skill pages.**
6. **Blog posts → 2–4 contextually relevant money pages** with descriptive anchors (e.g. an interview article links to `/jobs/software-developer`).
7. **Footer:** small, curated set of top hubs only. **Do NOT** dump hundreds of links in the footer — it dilutes signal and looks spammy.
8. **"Popular searches" module** at the bottom of hub pages — 12–20 internal links to high-demand variants. This is the workhorse for crawling the tail.

### Anchor text
Use the **exact target keyword** as anchor where natural ("data scientist jobs in Mumbai"), vary phrasing across sources to avoid over-optimization (mix "Data Science roles in Mumbai", "Mumbai data science openings").

**WHY:** Job boards live or die on internal linking because individual job/leaf pages have ~zero external links. The lattice substitutes internal PageRank for missing backlinks, and contextual anchors tell Google exactly what each page ranks for.

---

## 4. Content Silo Structure

Six silos, each a self-contained topical authority cluster:

| Silo | Root | Spokes | Commercial intent |
|---|---|---|---|
| **Jobs (role/city)** | `/jobs` | role hubs, city hubs, role×city, job postings | Highest |
| **Remote** | `/remote` | `/remote-[role]-jobs` | High |
| **Freshers** | `/fresher` | `/fresher-[role]-jobs` | High |
| **Skills** | `/skills` | `/skills/[skill]` | Medium (bridge) |
| **Salary** | `/salary` | `/salary/[role]` | Medium-high (huge volume) |
| **Blog/Advice** | `/blog` | 8 categories (Resume, Interview, Career, Salary, Tech Careers, Remote, Freshers, Hiring) | Top-of-funnel |

**Silo discipline:** links flow *within* a silo first; cross-silo links are deliberate bridges (salary→jobs, skills→jobs, blog→jobs). Don't randomly cross-link everything.

**WHY:** Concentrated internal linking + consistent topic coverage inside a silo is the single strongest on-site signal of topical authority. It also makes the architecture legible to crawlers.

---

## 5. Category (Role) Structure

Categories = job roles/functions. Build a **controlled `roles` taxonomy** with 3 levels:

```
Function (L1)        Role family (L2)            Specific role (L3, = URL)
─────────────────────────────────────────────────────────────────────────
Technology           Software Engineering        software-developer
                                                 backend-developer
                                                 frontend-developer
                                                 full-stack-developer
                                                 mobile-developer
                                                 android-developer
                                                 ios-developer
                     Data & AI                   data-scientist
                                                 data-analyst
                                                 data-engineer
                                                 machine-learning-engineer
                     Infrastructure              devops-engineer
                                                 cloud-engineer
                                                 site-reliability-engineer
                     Security                    security-engineer
                     QA                          qa-engineer / sdet
                     Product/Design              product-manager
                                                 ui-ux-designer
Business             Sales/Marketing             digital-marketing
                                                 sales-executive
                     Finance                     accountant / financial-analyst
                     HR                           hr-recruiter
```

Each L3 role becomes a hub at `/jobs/[role]`. L1/L2 become **browse/index pages** that link to children (good for crawl + UX, lightly optimized).

**Initial launch set (Tier-1 roles to build first — highest India tech demand):**
`software-developer, backend-developer, frontend-developer, full-stack-developer, data-scientist, data-analyst, data-engineer, machine-learning-engineer, devops-engineer, cloud-engineer, java-developer, python-developer, react-developer, nodejs-developer, android-developer, qa-engineer, product-manager, ui-ux-designer, digital-marketing, business-analyst.`

**WHY:** A controlled taxonomy lets you generate role × city × intent combinatorics safely, prevents duplicate roles, and gives Google clear category entities to rank.

---

## 6. Location Page Structure

Two patterns, both important:

1. **City hub:** `/jobs/in/[city]` — "Jobs in Mumbai" — broad, high volume, brand-defining.
2. **Role × City:** `/jobs/[role]-in-[city]` — "Software Developer Jobs in Mumbai" — the long-tail money pages.

### City vocabulary (Tier-1 launch — India metros + tech hubs):
`mumbai, delhi (delhi-ncr), bengaluru, hyderabad, pune, chennai, gurgaon (gurugram), noida, kolkata, ahmedabad, jaipur, indore, chandigarh, kochi, coimbatore, thiruvananthapuram, nagpur, bhubaneswar, visakhapatnam, mysuru.`

**Canonicalization:** maintain an alias map (`bangalore→bengaluru`, `gurugram→gurgaon` or vice versa, `trivandrum→thiruvananthapuram`). Aliases **301** to the canonical city URL. Pick one and never index both.

**Thin-content guard (CRITICAL):** only generate/index a Role×City page when it has **≥ N live jobs** (recommend N=3, configurable). Below threshold → `noindex` + show "related cities/roles" so the page still serves users but doesn't pollute the index. (Detailed logic in Phase 5.)

**WHY:** "[role] jobs in [city]" is the #1 search pattern for Indian job seekers. City hubs win head terms; role×city wins the tail. The job-count gate is what separates indexable programmatic SEO from a thin-content de-indexing event.

---

## 7. Job (Posting) Page Structure

The atomic unit. Must be: unique, fast, structured, fresh.

### Required on-page elements (in DOM order)
1. **Breadcrumb** (Home › Jobs › DevOps Engineer › [Job title]) — with `BreadcrumbList` schema.
2. **H1** = job title + company + location: *"AWS DevOps Engineer at Acme — Pune (Hybrid)"*.
3. **Key facts block** (above fold): salary range, experience, location, work mode (remote/hybrid/onsite), employment type, posted date, application deadline.
4. **Job description** (the unique body — must be the employer's real content; never auto-spun).
5. **Responsibilities / Requirements / Skills** (parsed into lists where possible).
6. **About the company** (short, links to `/companies/[slug]`).
7. **Apply CTA** (server-rendered link/button — must be crawlable; the apply action itself can be JS).
8. **Similar jobs** (3–6 internal links).
9. **`JobPosting` JSON-LD** (see Phase 6) — the single most important element for Google for Jobs.
10. **FAQ block** ("Is this job remote?", "What's the salary?", "What experience is required?") with `FAQPage` schema where it adds genuine info.

### Lifecycle (states drive SEO behavior)
| State | Indexable? | Sitemap? | Schema `validThrough` | HTTP |
|---|---|---|---|---|
| Live | ✅ index | ✅ yes | future date | 200 |
| Expiring soon | ✅ index | ✅ yes | near date | 200 |
| Expired | ❌ noindex | ❌ remove | past date (keep, accurate) | 200 (show "expired + similar jobs") then 410 after grace |
| Filled/Removed | ❌ | ❌ | — | 301 to role×city hub OR 410 |

**WHY:** Unique employer content + correct `JobPosting` schema = Google for Jobs eligibility. Aggressive expiry handling protects the whole domain's crawl budget and quality score. Server-rendered apply links and "similar jobs" keep leaves crawlable and inter-linked.

---

## 8. Blog Strategy

The blog is the **top-of-funnel + EEAT engine**. It is not where job-seeker money lives, but it:
- Captures informational queries ("how to answer 'tell me about yourself'") that competitors monetize.
- Builds topical authority and earns the backlinks that lift the commercial pages.
- Demonstrates Experience/Expertise (EEAT) via real, authored, career content.

**Structure:** `/blog`, 8 categories (`/blog/category/[slug]`), posts at `/blog/[slug]` (flat slug, category as taxonomy/breadcrumb — avoids deep nesting and URL churn if a post is re-categorized).

**Cadence:** 8–12 posts/month, front-loaded into pillars + clusters:
- **Pillars** (3,000+ words, comprehensive): "The Complete Guide to Software Engineer Interviews in India", "Resume Guide for Freshers", "Remote Work in India: Complete Guide".
- **Clusters** (1,200–1,800 words) link up to their pillar and across to relevant job hubs.

**Every post must:** link to ≥2 commercial pages, have an authored byline + author bio page (EEAT), have `Article` schema, target one primary keyword + a cluster of secondaries.

Full 100-idea plan in `phase-4-blog-plan.md`.

**WHY:** Commercial job pages rarely earn links; blog content does, and internal links pass that authority to the money pages. The blog is also the cleanest place to satisfy Google's EEAT expectations for a YMYL-adjacent (careers/income) site.

---

## 9. Programmatic SEO Opportunities

The scale play. Combinatorics from controlled vocabularies (`roles × cities × intents`):

| Template | Approx. addressable pages | Example | Priority |
|---|---|---|---|
| `/jobs/[role]` | ~80 roles | `/jobs/python-developer` | P0 |
| `/jobs/in/[city]` | ~50 cities | `/jobs/in/hyderabad` | P0 |
| `/jobs/[role]-in-[city]` | ~80 × ~50 = up to 4,000 (gated by job count) | `/jobs/react-developer-in-bengaluru` | P0 |
| `/remote-[role]-jobs` | ~80 | `/remote-data-analyst-jobs` | P1 |
| `/fresher-[role]-jobs` | ~80 | `/fresher-java-developer-jobs` | P1 |
| `/skills/[skill]` | ~120 skills | `/skills/kubernetes` | P2 |
| `/salary/[role]` (+`-in-[city]`) | ~80 (+ city) | `/salary/devops-engineer` | P1 (very high volume) |
| `/companies/[slug]` | = #employers | `/companies/baalvion` | P2 |

**Realistic indexable inventory at maturity: 8,000–15,000 pages** (most being job-count-gated role×city + live job postings).

**Guardrails (or this becomes a liability):**
- **Job-count gate** on every aggregation page (noindex below threshold).
- **Unique content blocks** per page (dynamic stats, real job snippets, city/role-specific copy — never a single boilerplate paragraph with the city name swapped).
- **Phased rollout** — don't publish 4,000 pages on day 1; release in waves so Google can assess quality and you can monitor indexation/Search Console.

Templates in `phase-3-programmatic.md`.

**WHY:** This is where 80–90% of a job board's organic traffic comes from. But unguarded programmatic SEO is also the fastest way to get a site classified as thin/spam. The gate + uniqueness rules are the whole ballgame.

---

## 10. EEAT Recommendations

Careers/income content sits near YMYL, so trust signals matter.

- **Real company entity:** consistent NAP (name/address/phone), an About page with team, an Organization schema with `sameAs` to LinkedIn/Twitter/Crunchbase, and a verifiable physical India presence.
- **Authored content:** every blog post and every salary/advice page has a real author with an `/blog/author/[name]` bio page, credentials, and `author` in `Article` schema.
- **Data provenance:** salary pages cite methodology ("based on X listings on Baalvion + sources"). Don't fabricate precise numbers without basis.
- **Employer trust:** verified-employer badges, company profiles, report-this-job mechanism, clear application flow. Google watches for scam/ghost jobs on boards.
- **Freshness signals:** "Updated [date]", live job counts, removal of expired jobs.
- **Transparent policies:** privacy, terms, data-protection (you already have these routes), contact with real channels.
- **Trust pages:** `/about`, `/contact`, editorial guidelines, an anti-fraud/scam-jobs policy page.

**WHY:** Google's quality systems and human raters score job boards on whether listings are real, current, and the operator is trustworthy. Weak EEAT caps how high commercial pages can rank no matter how good the on-page SEO is.

---

## 11. Technical SEO Recommendations (summary — full detail in Phase 5)

- **SSR/SSG for all indexable pages** (this is a Next.js 15 app — use server components / static generation + ISR for hubs and job pages; never client-only render indexable content).
- **ISR revalidation**: job postings short TTL (e.g. 5–15 min for fresh ones), hubs medium (hourly), evergreen pages long. Re-generate on job create/expire via on-demand revalidation.
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1. Server-render the above-fold, lazy-load below-fold, set explicit image dimensions.
- **Canonical tags** on every page; self-referencing on indexable, pointing to clean URL from faceted/paginated states.
- **`robots.txt` + XML sitemap index** with per-type sitemaps and `lastmod`.
- **Faceted navigation control**: only whitelisted facets are indexable (clean URLs); the rest are `noindex,follow` or `rel=canonical` to the base.
- **404/410/301 discipline** for expired jobs.
- **hreflang** not needed initially (single market, en-IN) but set `<html lang="en-IN">` and consider `en` self-reference.
- **Mobile-first** (Indian job-seeker traffic is overwhelmingly mobile).
- **Indexing API** for `JobPosting` (Google's Indexing API officially supports JobPosting + BroadcastEvent) — push create/update/delete in near-real-time. This is the fastest path to Google for Jobs.

---

## 12. Schema Recommendations (summary — full JSON-LD in Phase 6)

| Schema | Where | Purpose |
|---|---|---|
| `Organization` | Home (site-wide) | Brand entity, knowledge panel, `sameAs` |
| `WebSite` + `SearchAction` | Home | Sitelinks search box |
| `BreadcrumbList` | Every page with breadcrumbs | Breadcrumb rich result + structure |
| `JobPosting` | Every job page | **Google for Jobs eligibility** |
| `ItemList` | Role/city hubs | Signals a curated list of jobs |
| `FAQPage` | Hubs, job pages, blog (where real Q&A) | FAQ rich result |
| `Article` / `BlogPosting` | Blog posts | Article rich result, EEAT author |
| `Occupation` / salary `MonetaryAmountDistribution` | Salary pages | Salary rich data |

**WHY:** Structured data is the API between your content and Google's enriched results. For a job board, `JobPosting` is existential; the rest compound CTR and entity understanding.

---

## 13. Sitemap Recommendations (summary — full detail in Phase 5)

A **sitemap index** referencing typed child sitemaps, each ≤ 50,000 URLs / ≤ 50MB, with accurate `lastmod`:

```
/sitemap.xml                    ← index
  ├── /sitemaps/static.xml      ← home, about, employers, legal, hub roots
  ├── /sitemaps/roles.xml       ← /jobs/[role]
  ├── /sitemaps/cities.xml      ← /jobs/in/[city]
  ├── /sitemaps/role-city.xml   ← /jobs/[role]-in-[city]  (only indexable ones)
  ├── /sitemaps/remote.xml
  ├── /sitemaps/fresher.xml
  ├── /sitemaps/skills.xml
  ├── /sitemaps/salary.xml
  ├── /sitemaps/companies.xml
  ├── /sitemaps/jobs-1.xml      ← live job postings (sharded, 50k each)
  ├── /sitemaps/jobs-2.xml
  └── /sitemaps/blog.xml
```

**Rules:**
- **Only include indexable, 200-status, canonical URLs.** Never list noindexed/expired/paginated URLs.
- **`jobs-*.xml` regenerates continuously** — expired jobs drop out immediately. `lastmod` reflects the job's last update.
- Reference the index in `robots.txt` and submit each child in Search Console.
- Keep a **separate dynamic job sitemap** updated on every job lifecycle event (this is what drives fast indexing alongside the Indexing API).

**WHY:** For a site with thousands of churning URLs, sitemaps are how Google discovers new jobs fast and learns which expired URLs to drop. Typed + sharded sitemaps also make indexation debugging possible in Search Console (you can see exactly which page-type has coverage problems).

---

## Strategic priority order (what to build first)

1. **Technical foundation** — SSR, canonical, robots, sitemap index, `JobPosting` schema on every job, expiry lifecycle, Indexing API. *(Without this, nothing else indexes well.)*
2. **Tier-1 role hubs + city hubs + Employers + Home** — the 10 pages in Phase 2.
3. **Role×City programmatic** (gated) for Tier-1 roles × Tier-1 cities.
4. **Remote + Fresher** templates.
5. **Salary + Skills** silos.
6. **Blog** engine + first 24 posts (pillars first).
7. Scale programmatic in waves; expand cities/roles; build links.

See `phase-7-roadmap.md` for the month-by-month plan.
