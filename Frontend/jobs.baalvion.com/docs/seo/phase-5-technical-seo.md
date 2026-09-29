# Phase 5 — Technical SEO (Implementation)

Stack assumption: **Next.js 15 App Router** (confirmed in repo — `src/app`, `next 15.5.18`). Examples are App-Router idiomatic. Domain: `https://jobs.baalvion.com`.

> Set once, globally:
> ```ts
> // src/lib/seo/config.ts
> export const SITE_URL = "https://jobs.baalvion.com";
> export const SITE_NAME = "Baalvion Jobs";
> export const INDEX_THRESHOLD = 3; // min live jobs for an aggregation page to be indexable
> ```

---

## 1. robots.txt

Serve via `src/app/robots.ts` (Next generates `/robots.txt`):

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",          // candidate/employer private areas
          "/admin/",
          "/login", "/register",
          "/*?*sort=",            // facet/sort param states
          "/*?*page=",            // paginated param states (we paginate via path or canonicalize)
          "/*?*type=",
          "/apply/",              // application flow, not content
          "/search",              // internal search results (thin/duplicate)
        ],
      },
      // Let Googlebot/Bingbot through fully (rules above already do); add AI crawler policy if desired.
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

**WHY:** Block private, transactional, and parameterized URLs from crawling so crawl budget concentrates on indexable content. Never block CSS/JS (Google needs them to render). Point to the sitemap index.

---

## 2. sitemap.xml (index + typed children)

Next supports `generateSitemaps()` to shard. Use a **sitemap index** at `/sitemap.xml` referencing typed children. Each child ≤ 50,000 URLs.

```ts
// src/app/sitemap.ts  -> emits the index when using generateSitemaps, or a single file otherwise
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/config";
import { getIndexableRoles, getIndexableCities, getIndexableRoleCities,
         getLiveJobs, getRemoteRoles, getFresherRoles, getSkills,
         getSalaryRoles, getCompanies, getBlogPosts } from "@/lib/seo/data";

// Shard the heavy "jobs" type; static types are single files.
export async function generateSitemaps() {
  const jobShards = await getJobShardCount(); // ceil(liveJobs / 45000)
  return [
    { id: "static" }, { id: "roles" }, { id: "cities" }, { id: "role-city" },
    { id: "remote" }, { id: "fresher" }, { id: "skills" }, { id: "salary" },
    { id: "companies" }, { id: "blog" },
    ...Array.from({ length: jobShards }, (_, i) => ({ id: `jobs-${i + 1}` })),
  ];
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const u = (path: string, lastModified: Date, priority = 0.6, changeFrequency: any = "daily") =>
    ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority });

  switch (true) {
    case id === "static":
      return [
        u("/", new Date(), 1.0, "daily"),
        u("/jobs", new Date(), 0.9, "daily"),
        u("/remote", new Date(), 0.9, "daily"),
        u("/fresher", new Date(), 0.9, "daily"),
        u("/employers", new Date(), 0.7, "weekly"),
        u("/employers/post-a-job", new Date(), 0.7, "weekly"),
        u("/about", new Date(), 0.5, "monthly"),
        u("/contact", new Date(), 0.4, "monthly"),
        u("/faqs", new Date(), 0.4, "monthly"),
      ];
    case id === "roles":
      return (await getIndexableRoles()).map(r => u(`/jobs/${r.slug}`, r.updatedAt, 0.8));
    case id === "cities":
      return (await getIndexableCities()).map(c => u(`/jobs/in/${c.slug}`, c.updatedAt, 0.8));
    case id === "role-city":
      // ONLY pages above INDEX_THRESHOLD are returned by getIndexableRoleCities()
      return (await getIndexableRoleCities()).map(rc =>
        u(`/jobs/${rc.roleSlug}-in-${rc.citySlug}`, rc.updatedAt, 0.7));
    case id === "remote":
      return (await getRemoteRoles()).map(r => u(`/remote-${r.slug}-jobs`, r.updatedAt, 0.7));
    case id === "fresher":
      return (await getFresherRoles()).map(r => u(`/fresher-${r.slug}-jobs`, r.updatedAt, 0.7));
    case id === "skills":
      return (await getSkills()).map(s => u(`/skills/${s.slug}`, s.updatedAt, 0.5, "weekly"));
    case id === "salary":
      return (await getSalaryRoles()).map(r => u(`/salary/${r.slug}`, r.updatedAt, 0.6, "weekly"));
    case id === "companies":
      return (await getCompanies()).map(c => u(`/companies/${c.slug}`, c.updatedAt, 0.5, "weekly"));
    case id === "blog":
      return (await getBlogPosts()).map(p => u(`/blog/${p.slug}`, p.updatedAt, 0.6, "weekly"));
    case id.startsWith("jobs-"): {
      const shard = Number(id.split("-")[1]);
      const jobs = await getLiveJobs({ shard, size: 45000 }); // only LIVE, indexable jobs
      return jobs.map(j => u(`/jobs/${j.roleSlug}/${j.id}-${j.slug}`, j.updatedAt, 0.6, "daily"));
    }
    default: return [];
  }
}
```

**WHY:** Typed, sharded sitemaps with honest `lastmod` let Google discover new jobs fast and drop expired ones, and let you debug indexation per page-type in Search Console. **Critical rule: a URL appears in a sitemap only if it is 200, canonical, and `index`.** Expired jobs and below-threshold pages must NOT appear.

> **Real-time job sitemap:** in addition, regenerate the `jobs-*` sitemap (or ping the Indexing API — §8) on every job create/expire so discovery is near-instant.

---

## 3. Canonical URLs

Self-referencing canonical on every indexable page; faceted/paginated/param states canonicalize to the clean base. Set via the Metadata API:

```ts
// Example: role×city page  src/app/jobs/[roleCity]/page.tsx
import type { Metadata } from "next";
import { SITE_URL, INDEX_THRESHOLD } from "@/lib/seo/config";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { role, city, count } = await resolveRoleCity(params.roleCity);
  const path = `/jobs/${role.slug}-in-${city.slug}`;
  const indexable = count >= INDEX_THRESHOLD;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${role.title} Jobs in ${city.name} — ${band(count)} Openings | Baalvion`,
    description: `${band(count)} ${role.title} jobs in ${city.name}. Salary ${avgSalary}. Updated ${today}. Apply free on Baalvion.`,
    alternates: { canonical: path },          // self-canonical
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },       // thin page: noindex,follow
    openGraph: { url: `${SITE_URL}${path}`, title: "...", type: "website" },
  };
}
```

**Param-state canonicalization** (e.g. `/jobs/software-developer?page=2&sort=date`): the canonical must point to the clean base `/jobs/software-developer` only if you treat pagination as non-indexable; if you DO want page 2 indexed, self-canonical page 2 (see §4). Sort/filter param URLs always canonicalize to the base.

**Rules:**
- Absolute canonical URLs, lowercase, no trailing slash.
- Pick ONE host (`https://jobs.baalvion.com`) — 301 `http→https`, `www→non-www` (or your chosen variant).
- Alias slugs (`bangalore`) 301 to canonical (`bengaluru`); never emit both.

---

## 4. Pagination

Hub/listing pages will paginate. Use **path-based pagination with self-referencing canonicals** (modern best practice — `rel=next/prev` is deprecated as an indexing signal):

```
/jobs/software-developer            → page 1 (canonical: itself)
/jobs/software-developer/page/2     → page 2 (canonical: itself, index,follow)
/jobs/software-developer/page/3     → page 3 (canonical: itself)
```

- Each page self-canonicalizes (do **not** canonical page 2 → page 1; that de-indexes deeper jobs' discovery path).
- Page 1 title clean; page 2+ append " — Page N" to title to avoid duplicate titles.
- Keep crawl paths: each listing page links to individual jobs so they're discoverable.
- **Do NOT** use infinite scroll as the only access path — provide crawlable paginated links (or a "View all"/load-more with real `<a href>` fallbacks).
- Avoid `?page=` param pagination for indexable listings (we disallow `?page=` in robots); prefer the `/page/N` path.

**WHY:** Self-canonical paginated paths keep deep listings crawlable and discoverable while preventing duplicate-title issues. Canonicalizing all pages to page 1 (a common mistake) hides most of your jobs from Google.

---

## 5. Faceted Navigation (the make-or-break for job boards)

Facets = filters (role, city, experience, work mode, salary, skills, company). The danger: facet combinations explode into millions of near-duplicate URLs that waste crawl budget and create thin content.

**Policy — a whitelist of indexable facet combinations rendered as CLEAN PATH URLs; everything else is param-based and non-indexable.**

| Facet combination | Treatment | URL form | Index? |
|---|---|---|---|
| role | Clean path | `/jobs/[role]` | ✅ (gated) |
| city | Clean path | `/jobs/in/[city]` | ✅ (gated) |
| role + city | Clean path | `/jobs/[role]-in-[city]` | ✅ (gated) |
| role + remote | Clean path | `/remote-[role]-jobs` | ✅ (gated) |
| role + fresher | Clean path | `/fresher-[role]-jobs` | ✅ (gated) |
| role + city + experience | Param | `?exp=mid` | ❌ noindex,follow + canonical→base |
| any + sort | Param | `?sort=date` | ❌ noindex (robots-disallowed) |
| salary range / skill filters / multi-select | Param | `?salary=...&skill=...` | ❌ noindex,follow + canonical→base |
| company filter | Use company page instead | `/companies/[slug]` | ✅ |

Implementation:
- Indexable facets are **routes** (path segments from controlled vocab). They get full metadata, self-canonical, and the count gate.
- Non-indexable facets are **query params** on those routes. When any non-whitelisted param is present: emit `<meta name="robots" content="noindex,follow">` and `<link rel="canonical" href="{clean base}">`, and they're robots-disallowed from crawling.
- `nofollow` is NOT needed on internal facet links if they're param-based + noindex; `follow` lets equity flow back to the base. Keep facet UI usable for humans.

**WHY:** This is exactly how large job boards avoid getting buried under crawl waste. Whitelisted clean URLs capture the valuable demand patterns; everything else stays out of the index but still works for users.

---

## 6. Indexing Controls (job lifecycle = the quality engine)

| Job state | `robots` meta | In sitemap | `JobPosting.validThrough` | HTTP / page behavior |
|---|---|---|---|---|
| **Live** | index,follow | ✅ | future ISO date | 200, full content |
| **Expiring (≤48h)** | index,follow | ✅ | near ISO date | 200 |
| **Expired** | noindex,follow | ❌ removed | past ISO date (keep accurate) | 200 page shows "This job has expired" + 6 similar live jobs |
| **Expired > grace (e.g. 30d)** | — | ❌ | — | **410 Gone** |
| **Filled/removed by employer** | — | ❌ | — | **301** to role×city hub (or 410 if no good target) |

Aggregation pages (role/city/role×city/remote/fresher): `noindex,follow` + out-of-sitemap whenever live count `< INDEX_THRESHOLD`; flip back to `index` automatically when it recovers.

**WHY:** Google explicitly downranks job boards that keep expired/stale jobs indexed and that show empty results. Correct `validThrough` + fast removal from the index and sitemap is the single biggest quality lever. 410 (vs 404) tells Google to drop the URL faster; 301 preserves any equity to a relevant live page.

---

## 7. Core Web Vitals

Targets: **LCP < 2.5s, INP < 200ms, CLS < 0.1** (mobile-first — most Indian job traffic is mobile).

| Lever | Action (Next 15) |
|---|---|
| **Server render content** | Use Server Components for all indexable content; never client-fetch the primary job/listing data. Hydrate only interactive bits (filters, apply button). |
| **LCP** | Server-render above-the-fold (H1, key facts). Preload the hero/primary font. Avoid client data-fetch waterfalls for first paint. |
| **Images** | `next/image` with explicit `width`/`height`, `sizes`, AVIF/WebP. Company logos lazy-loaded (`loading="lazy"`) except the LCP image. |
| **CLS** | Reserve space for logos, ads, and dynamic blocks (count, salary). Set dimensions on all media. No layout-shifting injected banners. |
| **INP** | Keep client JS minimal; debounce search/filter inputs; avoid heavy hydration. Defer non-critical scripts (`next/script strategy="lazyOnload"`). |
| **Fonts** | `next/font` (self-hosted, `display: swap`), max 2 families, preload the critical weight only. |
| **Caching/ISR** | Static-generate hubs with ISR; job pages ISR with short revalidate (§ below). Serve from edge/CDN. |
| **Bundle** | Dynamic-import heavy widgets (maps, charts, rich editors). Code-split by route. |

**ISR revalidation guidance:**
```ts
// Job detail (fresh-sensitive)
export const revalidate = 600;       // 10 min; + on-demand revalidate on update/expire
// Role/city hubs
export const revalidate = 3600;      // hourly
// Salary/skill/evergreen
export const revalidate = 86400;     // daily
// On job create/update/expire -> revalidatePath() / revalidateTag() for instant freshness
```

**WHY:** CWV is a ranking factor and, more importantly, drives the conversion (apply rate) that signals quality. SSR/ISR is also what makes job content reliably indexable — client-only rendering is the most common reason job pages fail to index.

---

## 8. Crawl Optimization

- **Google Indexing API for `JobPosting`** (officially supported for JobPosting + BroadcastEvent). On every job **create/update**, call `URL_UPDATED`; on **expire/remove**, call `URL_DELETED`. This is the fastest route into Google for Jobs — far faster than waiting for sitemap crawl.
  ```
  POST https://indexing.googleapis.com/v3/urlNotifications:publish
  { "url": "https://jobs.baalvion.com/jobs/devops-engineer/51002-aws-devops-engineer-acme",
    "type": "URL_UPDATED" }
  ```
- **IndexNow (Bing/Yandex)** for non-Google engines — ping on publish/update/delete.
- **Crawl budget discipline:** robots-disallow params, 410 dead jobs fast, keep sitemaps clean, avoid infinite facet spaces, keep redirect chains to length 1.
- **Internal linking** (Phase 1 §3) is the primary discovery mechanism for the long tail — keep the hub→spoke→leaf lattice intact and server-rendered.
- **Log/Search Console monitoring:** track "Discovered – not indexed" and "Crawled – not indexed" (thin-content signals → tighten the count gate / add unique data), and watch crawl stats for waste on param URLs.
- **404 hygiene:** custom 404 with helpful links (related roles/cities) so dead inbound links still route users into the funnel.
- **Avoid soft-404s:** an aggregation page with zero jobs must return either a real "no results + alternatives" page with `noindex` (preferred) — never a 200 page that looks empty (Google flags those as soft-404).

**WHY:** Job boards have huge, fast-churning URL sets. The Indexing API + clean sitemaps + tight crawl controls are what let a new domain get jobs into Google for Jobs within hours instead of weeks, and what keep Google trusting the domain's overall quality.

---

## 9. Pre-launch technical checklist

- [ ] `https` enforced; single canonical host; `http→https` and `www`/non-www 301s in place.
- [ ] `robots.ts` live, blocking private/param URLs, pointing to sitemap.
- [ ] Sitemap index + typed children live; only indexable URLs included.
- [ ] Self-canonical on all indexable pages; param/facet states canonicalize correctly.
- [ ] `JobPosting` schema validates (Rich Results Test) on every job; `validThrough` accurate.
- [ ] Count gate (`INDEX_THRESHOLD`) wired to robots meta + sitemap inclusion.
- [ ] Job lifecycle → noindex/410/301 transitions implemented and tested.
- [ ] CWV green on mobile for Home, a role hub, a role×city, and a job page (PageSpeed Insights / CrUX).
- [ ] Indexing API integrated on job create/update/delete.
- [ ] Search Console + Bing Webmaster verified; all child sitemaps submitted.
- [ ] No soft-404s; custom 404 with internal links.
- [ ] `<html lang="en-IN">`, mobile viewport, structured data error-free.
