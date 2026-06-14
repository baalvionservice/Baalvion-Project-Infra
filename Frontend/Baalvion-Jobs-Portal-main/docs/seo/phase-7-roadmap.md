# Phase 7 — 6-Month SEO Roadmap

Assumes `jobs.baalvion.com` is a **new/young domain** (low authority at start). Traffic goals are organic sessions/month and assume the technical foundation ships in Month 1. Numbers are realistic targets for a focused job board in the Indian tech niche — adjust to your starting authority and job inventory. KPIs are cumulative unless noted.

> **Owner key:** ENG = engineering · SEO = SEO/content lead · WRITER = content writer · BIZDEV = employer/job supply

---

## Month 1 — Technical Foundation & Indexing

**Theme:** Make the site crawlable, indexable, and Google-for-Jobs eligible. Nothing ranks if this is broken.

**Tasks**
- [ENG] Ship SSR/ISR for all indexable templates; `robots.ts`, sitemap index + typed children (Phase 5).
- [ENG] `JobPosting` schema on every job + lifecycle (noindex/410/301) + `validThrough` (Phases 5–6).
- [ENG] Canonical tags, count gate (`INDEX_THRESHOLD`), faceted-nav whitelist.
- [ENG] Google Indexing API on job create/update/delete; IndexNow ping.
- [ENG] Org + WebSite + Breadcrumb schema site-wide; CWV pass on 4 template types.
- [SEO] Verify Google Search Console + Bing Webmaster; submit all sitemaps. Set up GA4 + Looker Studio dashboard.
- [SEO] Publish Phase 2 pages: Home, About, Employers/Post-a-Job (the 3 non-listing pages) + ensure the 7 listing hubs render from real data.
- [BIZDEV] Seed job inventory — onboard initial employers / import enough live jobs so Tier-1 role and city hubs clear the count gate.

**Priorities:** indexing infrastructure > job supply > content.

**Expected outcomes:** Site fully crawlable; first jobs appear in Google for Jobs within days; core pages indexed.

**KPIs:** Pages submitted vs indexed (target ≥70% of submitted indexed by month-end); 0 critical Search Console errors; ≥1 job confirmed live in Google for Jobs; CWV "Good" on tested templates.

**Traffic goal:** 200–800 organic sessions/month (mostly brand + early long-tail + Google for Jobs clicks).

---

## Month 2 — Core Landing Pages & Tier-1 Programmatic

**Theme:** Publish the money pages and the first programmatic wave.

**Tasks**
- [SEO/WRITER] Publish remaining Phase 2 pages (Remote, Freshers, Software Developer, Data Science, DevOps, Mumbai, Pune) with full content + schema.
- [ENG/SEO] Launch **Template A** (role hubs) for all ~20 Tier-1 roles and city hubs for ~20 Tier-1 cities (Phase 3).
- [ENG/SEO] Launch **Template B** (role×city) for Tier-1 roles × Tier-1 cities, gated — release in 2 sub-waves, monitor indexation.
- [SEO] Internal-linking lattice live (home → hubs, hub → spokes, "popular searches" modules).
- [WRITER] Publish first blog batch: pillars #1 (Resume), #13 (SWE Interview), #38 (SWE Salary), #51 (How to Become a Developer), #63 (Remote Work), #75 (First Job) + clusters #5, #14.
- [BIZDEV] Grow job inventory to clear the gate on more role×city combos.

**Priorities:** core landing pages > Tier-1 programmatic > blog pillars.

**Expected outcomes:** Hundreds of indexable pages live; long-tail impressions climbing in Search Console; first page-2/3 rankings for low-difficulty long-tail.

**KPIs:** ~300–600 pages indexed; impressions +300% MoM; ≥30 keywords ranking top-50; avg. position trending up; 8 blog posts live.

**Traffic goal:** 1,500–4,000 organic sessions/month.

---

## Month 3 — Programmatic Scale + Remote/Fresher Silos

**Theme:** Expand the long tail and add the Remote and Fresher silos.

**Tasks**
- [ENG/SEO] Launch **Template C** (remote-role) and **Template D** (fresher-role) for Tier-1 roles (Phase 3).
- [ENG/SEO] Expand Template B to Tier-2 cities (Phase 8's 20 additional cities) and more roles as inventory allows.
- [SEO] Publish Phase 8 additional pages (20 location + 20 category) as inventory clears the gate.
- [WRITER] Blog batch (10): #2, #3, #15, #16, #39, #40, #52, #64, #88 + 1 pillar (#87 Job Description).
- [SEO] First link-building push: digital PR / salary-report data study (linkable asset), HARO-style outreach, partnerships, directory/profile citations (NAP consistency).
- [SEO] Title/meta optimization pass on pages with impressions but low CTR.

**Priorities:** programmatic breadth > blog clusters > first links.

**Expected outcomes:** Thousands of indexable pages; long-tail clicks become meaningful; brand searches begin.

**KPIs:** 1,500–4,000 pages indexed; ≥150 keywords top-50, ≥20 top-10 (long-tail); referring domains ≥10; impressions +150% MoM.

**Traffic goal:** 5,000–12,000 organic sessions/month.

---

## Month 4 — Authority, Salary Silo & Content Depth

**Theme:** Build authority signals and launch the high-volume Salary silo.

**Tasks**
- [ENG/SEO] Launch **Salary silo** (`/salary/[role]`, optional `-in-[city]`) with `Occupation`/salary data + methodology (huge search volume, strong internal-link source).
- [ENG/SEO] Launch **Skills silo** (`/skills/[skill]`) as SEO bridge pages.
- [WRITER] Blog batch (10): #6, #19, #20, #42, #46, #54, #66, #77, #89, #90.
- [SEO] Sustained link building: guest posts on career/tech sites, data-driven PR, college/placement-cell partnerships (relevant + authoritative for a jobs site).
- [SEO] EEAT pass: author bio pages, editorial guidelines page, anti-fraud/scam-jobs policy page; complete Organization `sameAs`.
- [SEO] Prune/improve "Crawled – not indexed" pages (tighten count gate, add unique data).

**Priorities:** salary silo > links/EEAT > skills silo.

**Expected outcomes:** Salary pages start ranking (high volume); domain authority visibly rising; some head-term movement.

**KPIs:** ≥300 keywords top-50, ≥60 top-10; referring domains ≥25; salary pages indexed & gaining impressions; brand searches +; bounce/engagement healthy.

**Traffic goal:** 12,000–25,000 organic sessions/month.

---

## Month 5 — Optimization, CRO & Coverage Expansion

**Theme:** Convert traffic and consolidate rankings; expand vocabulary.

**Tasks**
- [SEO] Conversion optimization: improve apply-rate and employer sign-ups (these behavioral signals feed quality). A/B test CTAs, listing layout, salary display.
- [ENG/SEO] Expand role and city vocabularies (Tier-3 cities, more specialized roles/languages) — same gated programmatic system.
- [SEO] Content refresh cycle: update top pillars and salary pages with fresh data (`dateModified`); re-promote.
- [WRITER] Blog batch (11): #7, #9, #21, #45, #48, #50, #55, #67, #79, #82, #91.
- [SEO] Build topic clusters around any keyword showing strong impressions; add internal links to climbing pages.
- [SEO] Link building continues (target DR/quality over quantity).

**Priorities:** CRO + ranking consolidation > coverage expansion > content refresh.

**Expected outcomes:** Rankings consolidate into page 1 for many long-tail and mid-tail terms; Google for Jobs driving steady high-intent clicks; conversions improving.

**KPIs:** ≥500 keywords top-50, ≥120 top-10; referring domains ≥40; apply-rate/employer-signups up MoM; returning-user share rising.

**Traffic goal:** 25,000–45,000 organic sessions/month.

---

## Month 6 — Scale, Moats & Review

**Theme:** Compound the system, harden quality, and plan the next two quarters.

**Tasks**
- [ENG/SEO] Full programmatic scale across all roles × all qualifying cities (gated); ensure expiry/quality automation handles the volume.
- [SEO] Launch a recurring **linkable data asset** (e.g. quarterly "India Tech Salary & Hiring Report") for ongoing PR and backlinks — a durable moat.
- [WRITER] Blog batch (11): #8, #10, #22, #43, #47, #56, #57, #70, #86, #92, #98 — completing core pillars' clusters.
- [SEO] Full technical + content audit: fix index bloat, kill thin pages, repair internal links, refresh stale content, verify CWV at scale.
- [SEO] Competitor gap analysis (vs Naukri/Instahyre/Cutshort for your niche) → next-quarter keyword roadmap.
- [SEO] Quarterly review: what ranked, what didn't, where to double down.

**Priorities:** scale + quality control > authority asset > audit/planning.

**Expected outcomes:** A self-reinforcing system — fresh jobs index fast, hubs rank, blog feeds authority to money pages. Clear momentum and a Q3–Q4 plan.

**KPIs:** ≥800 keywords top-50, ≥200 top-10; referring domains ≥60; index coverage healthy (>80% submitted indexed, minimal thin-page waste); Google for Jobs share of high-intent traffic growing; month-6 organic ≥ 6–10× month-2.

**Traffic goal:** 45,000–80,000 organic sessions/month.

---

## Cumulative KPI dashboard (track weekly in Looker Studio / GSC)

| Metric | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|
| Indexed pages | ~50–150 | 300–600 | 1.5k–4k | 4k–8k | 6k–12k | 8k–15k |
| Keywords top-50 | — | 30 | 150 | 300 | 500 | 800 |
| Keywords top-10 | — | 5 | 20 | 60 | 120 | 200 |
| Referring domains | 0–2 | 5 | 10 | 25 | 40 | 60 |
| Organic sessions/mo | 0.2k–0.8k | 1.5k–4k | 5k–12k | 12k–25k | 25k–45k | 45k–80k |
| Jobs in Google for Jobs | 1+ | 100s | 1000s | 1000s | scaled | scaled |

**Leading indicators to watch (don't wait for traffic):** impressions (GSC) lead clicks by ~2–4 weeks; indexation rate; Google-for-Jobs enhancement report (valid items, errors); avg. position trend. If impressions rise but clicks don't → fix titles/meta. If pages are "Discovered/Crawled – not indexed" → thin content; tighten the gate and add unique data.

**Risks & mitigations:** thin programmatic pages (→ count gate + unique data); expired-job index bloat (→ lifecycle automation); slow job supply (→ BIZDEV is on the critical path — hubs can't rank without jobs); CWV regressions at scale (→ ISR + monitoring); over-reliance on programmatic (→ blog + links build the authority that lifts everything).
