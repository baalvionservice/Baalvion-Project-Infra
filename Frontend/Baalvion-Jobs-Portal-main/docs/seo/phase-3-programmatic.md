# Phase 3 — Programmatic SEO (Scalable Templates)

These templates generate thousands of pages from controlled vocabularies (`roles`, `cities`, `skills`) while defending against thin content. **Every template uses tokens** filled from your database at render time. Tokens are written `{{token}}`.

## Token reference

| Token | Source | Example |
|---|---|---|
| `{{role}}` | `roles.title` | Software Developer |
| `{{role_slug}}` | `roles.slug` | software-developer |
| `{{role_plural}}` | `roles.title_plural` | Software Developers |
| `{{city}}` | `cities.name` | Pune |
| `{{city_slug}}` | `cities.slug` | pune |
| `{{count}}` | live job count (computed) | 142 |
| `{{count_band}}` | bucketed count for stable copy | "100+" |
| `{{avg_salary}}` | computed/median from listings or salary table | ₹8–14 LPA |
| `{{top_skills}}` | top N skills from matching jobs | React, Node.js, SQL |
| `{{top_companies}}` | top N hiring companies | (3–5 names) |
| `{{updated_date}}` | now() at render/ISR | 11 June 2026 |
| `{{exp_levels}}` | available experience bands | Fresher, Mid, Senior |

## The non-negotiable indexability gate (apply to ALL aggregation templates)

```
IF live_job_count >= INDEX_THRESHOLD (default 3):
    render full page, <meta robots="index,follow">, include in sitemap
ELSE:
    render page for users (so the URL still works),
    <meta robots="noindex,follow">,
    EXCLUDE from sitemap,
    show "No live {{role}} jobs in {{city}} right now — try these" + related links
```

`count_band` keeps copy from churning on every job add/remove (use bands: 1–9 → "several", 10–49 → "dozens of", 50+ → "100+"). This avoids `lastmod`/content thrash that wastes crawl budget.

**Uniqueness rule:** every template must inject ≥3 dynamic, page-specific data blocks (count, salary, top skills/companies, real job snippets). Never ship a page whose only difference from its siblings is the city/role name swapped in one sentence — that is the definition of doorway/thin content Google removes.

---

## TEMPLATE A — `/jobs/{{role_slug}}` (Role Hub)

**SEO Title:**
`{{role}} Jobs in India ({{count_band}} Openings) | Baalvion`

**Meta Description:**
`Find {{count_band}} {{role}} jobs in India. Latest openings across Bengaluru, Pune, Hyderabad, Mumbai & remote. Salary {{avg_salary}}. Updated {{updated_date}}. Apply free on Baalvion.`

**H1:**
`{{role}} Jobs in India`

**H2 outline:**
1. Latest {{role}} Openings
2. {{role}} Jobs by City
3. {{role}} Jobs by Experience Level
4. Skills Required for {{role}} Jobs
5. {{role}} Salary in India
6. Remote & Fresher {{role}} Jobs
7. Related Roles
8. Frequently Asked Questions

**Content template (render ~600–900 words from these blocks):**
```
[INTRO – dynamic]
Browse {{count}} live {{role}} jobs across India on Baalvion, updated {{updated_date}}.
{{role_plural}} are in strong demand at startups, product companies, and global teams,
with salaries typically ranging {{avg_salary}}. Filter by city, experience, and work mode
to find roles that fit.

[BY CITY – dynamic list, links to role×city]
{{role}} jobs are concentrated in {{top_cities}}. Explore openings in:
- {{role}} jobs in Bengaluru → /jobs/{{role_slug}}-in-bengaluru
- {{role}} jobs in Pune → /jobs/{{role_slug}}-in-pune
- … (top 12 cities by live count for this role)

[BY EXPERIENCE]
Whether you're a fresher or a senior professional, there are {{role}} roles for you.
Freshers: /fresher-{{role_slug}}-jobs · Remote: /remote-{{role_slug}}-jobs

[SKILLS – dynamic]
Employers hiring {{role_plural}} most often ask for: {{top_skills}}.
(link each skill to /skills/{{skill_slug}} where one exists)

[SALARY]
{{role}} salaries in India typically range {{avg_salary}}, varying by experience,
skills, and city. See the full breakdown: /salary/{{role_slug}}

[RELATED ROLES – from taxonomy siblings]
Related roles: {{sibling_roles}} (6 links)

[CLOSING CTA]
```

**FAQ template:**
- `How many {{role}} jobs are available in India?` → "Baalvion currently lists {{count_band}} {{role}} openings across India, updated {{updated_date}}."
- `What is the average salary for a {{role}} in India?` → "{{avg_salary}}, depending on experience, skills, and city. See our {{role}} salary guide."
- `What skills are needed for {{role}} jobs?` → "Commonly {{top_skills}}, plus strong fundamentals."
- `Are there remote {{role}} jobs?` → "Yes — see remote {{role}} jobs."
- `Can freshers apply for {{role}} jobs?` → "Yes — see fresher {{role}} jobs."

**Schema:** `BreadcrumbList` + `ItemList` (of the top job postings) + `FAQPage`. (See Phase 6.)

---

## TEMPLATE B — `/jobs/{{role_slug}}-in-{{city_slug}}` (Role × City)

> The highest-volume programmatic template. **Strictly gated** by job count.

**SEO Title:**
`{{role}} Jobs in {{city}} — {{count_band}} Openings | Baalvion`

**Meta Description:**
`{{count_band}} {{role}} jobs in {{city}}. Latest {{role}} openings hiring now — salary {{avg_salary}}, fresher to senior, remote & on-site. Updated {{updated_date}}. Apply free.`

**H1:**
`{{role}} Jobs in {{city}}`

**H2 outline:**
1. Latest {{role}} Jobs in {{city}}
2. Top Companies Hiring {{role_plural}} in {{city}}
3. {{role}} Salary in {{city}}
4. Skills in Demand for {{role}} Jobs in {{city}}
5. {{role}} Jobs in {{city}} by Experience Level
6. Remote {{role}} Jobs (Work From {{city}})
7. {{role}} Jobs in Other Cities
8. Frequently Asked Questions

**Content template (~500–800 words; MUST include ≥3 dynamic blocks):**
```
[INTRO – dynamic, count + salary + city context]
Looking for {{role}} jobs in {{city}}? Baalvion lists {{count}} live {{role}} openings
in {{city}}, updated {{updated_date}}. {{city}} is {{city_one_liner}}, and demand for
{{role_plural}} here is {{count_band_descriptor}}. Salaries typically range {{avg_salary}}.

[TOP COMPANIES – dynamic]
Companies currently hiring {{role_plural}} in {{city}} include {{top_companies}}.

[SALARY – dynamic/city-adjusted]
A {{role}} in {{city}} typically earns {{avg_salary}}. Compensation depends on
experience and skills — see /salary/{{role_slug}} for detail.

[SKILLS – dynamic]
The most requested skills in {{city}} {{role}} listings are {{top_skills}}.

[EXPERIENCE]
From fresher to senior, filter {{role}} roles in {{city}} by experience level.
Freshers: /fresher-{{role_slug}}-jobs

[NEARBY/OTHER CITIES – links to sibling role×city]
Prefer another city? {{role}} jobs in {{nearby_cities}} (5 links) ·
Back to all {{role}} jobs → /jobs/{{role_slug}} ·
All jobs in {{city}} → /jobs/in/{{city_slug}}

[CLOSING CTA]
```

**Internal links (mandatory):** parent role hub, parent city hub, 5 sibling cities (same role), 5 sibling roles (same city), salary page, fresher/remote variant.

**FAQ template:**
- `How many {{role}} jobs are there in {{city}}?` → "{{count_band}}, updated {{updated_date}}."
- `What is the salary of a {{role}} in {{city}}?` → "{{avg_salary}}…"
- `Which companies hire {{role_plural}} in {{city}}?` → "{{top_companies}} and others."
- `Are there remote {{role}} jobs in {{city}}?` → "Yes — many {{city}} employers offer remote/hybrid."
- `Can freshers get {{role}} jobs in {{city}}?` → "Yes — see fresher {{role}} jobs."

**Schema:** `BreadcrumbList` + `ItemList` + `FAQPage`. Each listed job carries its own `JobPosting` on its detail page.

---

## TEMPLATE C — `/remote-{{role_slug}}-jobs` (Remote Role)

**SEO Title:**
`Remote {{role}} Jobs in India — Work From Home | Baalvion`

**Meta Description:**
`Find remote {{role}} jobs in India. {{count_band}} work-from-home {{role}} openings — fully remote & hybrid, salary {{avg_salary}}. Updated {{updated_date}}. Apply free on Baalvion.`

**H1:**
`Remote {{role}} Jobs in India`

**H2 outline:**
1. Latest Remote {{role}} Jobs
2. Fully Remote vs Hybrid {{role}} Roles
3. Who Hires Remote {{role_plural}}
4. Skills for Remote {{role}} Jobs
5. Remote {{role}} Salary
6. How to Land a Remote {{role}} Job
7. Related: On-site & Fresher {{role}} Jobs
8. Frequently Asked Questions

**Content template (~500–800 words):**
```
[INTRO – dynamic]
Work as a {{role}} from anywhere in India. Baalvion lists {{count}} remote {{role}}
openings, updated {{updated_date}} — fully remote and hybrid roles from Indian startups,
global capability centers, and international remote-first companies. Salary {{avg_salary}}.

[FULLY REMOTE VS HYBRID]
Clear explanation + "filter by work mode" + link to /remote hub.

[WHO HIRES – dynamic companies]
Remote {{role_plural}} are hired by {{top_companies}} and many distributed teams.

[SKILLS – dynamic]
Remote {{role}} roles value {{top_skills}} plus strong written communication and
self-direction.

[SALARY]
Remote {{role}} salaries range {{avg_salary}}; global remote roles often pay more.
See /salary/{{role_slug}}.

[HOW TO LAND ONE] – 3 concrete tips.

[RELATED]
On-site {{role}} jobs → /jobs/{{role_slug}} · Fresher → /fresher-{{role_slug}}-jobs ·
All remote jobs → /remote
```

**FAQ template:**
- `Are remote {{role}} jobs genuinely remote?` · `Do remote {{role}} jobs pay less?` · `Can freshers get remote {{role}} jobs?` · `What skills do remote {{role}} roles need?` · `Where can I find remote {{role}} jobs in India?`

**Schema:** `BreadcrumbList` + `ItemList` + `FAQPage`. (Job postings set `jobLocationType: TELECOMMUTE` + `applicantLocationRequirements` — see Phase 6.)

---

## TEMPLATE D — `/fresher-{{role_slug}}-jobs` (Fresher Role)

**SEO Title:**
`Fresher {{role}} Jobs in India — Entry-Level Roles | Baalvion`

**Meta Description:**
`Fresher {{role}} jobs in India for 0–2 years experience. {{count_band}} entry-level & trainee {{role}} openings, salary {{avg_salary}}. Updated {{updated_date}}. Apply free on Baalvion.`

**H1:**
`Fresher {{role}} Jobs in India`

**H2 outline:**
1. Latest Fresher {{role}} Jobs
2. What Fresher {{role}} Jobs Require
3. Skills That Get Freshers Hired as {{role_plural}}
4. Fresher {{role}} Salary in India
5. How to Apply With No Experience
6. Internships & Trainee {{role}} Roles
7. Related: Remote & City {{role}} Jobs
8. Frequently Asked Questions

**Content template (~500–800 words):**
```
[INTRO – dynamic]
Start your career as a {{role}}. Baalvion lists {{count}} fresher {{role}} openings for
candidates with 0–2 years of experience, updated {{updated_date}} — junior roles,
trainee programs, and internships. Starting salary {{avg_salary}}.

[WHAT THEY REQUIRE] – realistic expectations for entry level.

[SKILLS – dynamic]
Freshers are hired as {{role_plural}} for {{top_skills}} plus demonstrable projects.

[SALARY] – entry-level band; link /salary/{{role_slug}}.

[HOW TO APPLY WITH NO EXPERIENCE] – projects-first guidance, link to /blog resume + interview guides.

[INTERNSHIPS VS FULL-TIME] – short framing.

[RELATED]
All {{role}} jobs → /jobs/{{role_slug}} · Remote → /remote-{{role_slug}}-jobs ·
Resume guide → /blog/resume-for-freshers
```

**FAQ template:**
- `Can I get a {{role}} job as a fresher?` · `What is the starting salary for a fresher {{role}}?` · `What skills do freshers need for {{role}} jobs?` · `Do fresher {{role}} jobs require experience?` · `Are there internships for {{role_plural}}?`

**Schema:** `BreadcrumbList` + `ItemList` + `FAQPage`.

---

## Programmatic governance (build this into the generator)

1. **Controlled vocab only.** Generate pages strictly from the `roles`, `cities`, and `skills` tables. No free-text URL generation.
2. **Alias → 301.** Maintain alias maps (`bangalore→bengaluru`). Aliases 301 to canonical; never render both.
3. **Index gate everywhere.** Apply the count threshold to Templates A–D. Below threshold = noindex + out of sitemap.
4. **Phased rollout.** Wave 1: Template A (roles) + city hubs. Wave 2: Template B for Tier-1 roles × Tier-1 cities. Wave 3: Templates C/D. Wave 4: expand vocab. Monitor Search Console indexation between waves.
5. **Stable copy bands.** Use `count_band`/`count_band_descriptor`, not raw counts, in prose to prevent churn.
6. **Dedicated dynamic data per page.** Enforce ≥3 dynamic blocks at render; if data is empty, fall back to noindex rather than shipping boilerplate.
7. **`lastmod` reflects real change.** Only bump when the page's indexable content materially changes (band change, new top companies), not on every job add.
8. **Internal-link budget.** Cap on-page programmatic links (~40) to keep pages focused and crawl-efficient.
9. **Monitoring.** Weekly: indexed vs submitted per sitemap, pages with impressions but 0 clicks (title/meta fix candidates), pages that dropped below threshold (should already be noindexed).
