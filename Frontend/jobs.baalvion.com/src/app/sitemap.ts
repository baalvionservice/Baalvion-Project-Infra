import { MetadataRoute } from 'next';
import { AppConfig } from '@/config/app.config';
import { talentService } from '@/services/talent.service';
import { jobPath } from '@/lib/job-url';

// Evaluated once when the module is first loaded — i.e. at build/boot, not per request.
const BUILD_TIME = Date.now();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = AppConfig.baseUrl;

  // Core static routes with proper priorities and change frequencies
  const staticRoutes: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '', changeFrequency: 'daily', priority: 1.0 }, // Homepage
    // `/careers` is intentionally absent: it renders the same landing page as `/` and
    // canonicalises there, so submitting it would ask Google to index a URL we've
    // already told it not to.
    { path: '/careers/open-positions', changeFrequency: 'daily', priority: 0.9 },
    { path: '/careers/full-time', changeFrequency: 'daily', priority: 0.8 },
    { path: '/careers/part-time', changeFrequency: 'daily', priority: 0.8 },
    { path: '/careers/hiring-process', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/careers/hiring-strategy', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/careers/internship-program', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/careers/life-at-baalvion', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/placement', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/onboarding', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/onboarding/college', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/onboarding/student', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about/diversity', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/about/team', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/products', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/projects', changeFrequency: 'daily', priority: 0.8 },
    { path: '/studio', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/data-protection', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/faqs', changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Static pages change when the site is deployed, not when a crawler asks. Stamping
  // them with `new Date()` told Google every page had just changed on every fetch —
  // a freshness claim that is never true, and one crawlers learn to discount.
  const buildDate = new Date(
    process.env.VERCEL_GIT_COMMIT_SHA && process.env.BUILD_TIMESTAMP
      ? Number(process.env.BUILD_TIMESTAMP)
      : BUILD_TIME,
  );

  const staticUrls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: buildDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamically fetch published jobs and active countries
  let countryUrls: MetadataRoute.Sitemap = [];
  let placeUrls: MetadataRoute.Sitemap = [];
  let jobUrls: MetadataRoute.Sitemap = [];

  try {
    // Two different lists on purpose:
    //  • hubCountries — the only countries with an editorial page worth submitting.
    //  • allCountries — needed to resolve EVERY job's URL, because roles are posted
    //    anywhere. Resolving job URLs against the hub list alone would silently drop
    //    every job outside those nine from the sitemap.
    const [hubCountries, allCountries] = await Promise.all([
      talentService.getCountries({ isActive: true, hub: true }),
      talentService.getCountries({ isActive: true }),
    ]);

    // Hub countries carry editorial copy, but any country with live roles is a real,
    // indexable page and belongs here too. Submitting only the hubs left Dubai,
    // Singapore, Rotterdam and Lagos out of the sitemap while their jobs were in it.
    // The countries with no roles are deliberately excluded — they render noindex.
    const hubSlugs = new Set(hubCountries.map((c) => c.slug));
    countryUrls = hubCountries.map((country) => ({
      url: `${baseUrl}/careers/countries/${country.slug}`,
      lastModified: buildDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // jobs-service caps `limit` at 100 (returns 500 above that), so page
    // through all published jobs rather than requesting one huge page.
    const PAGE_SIZE = 100;
    const MAX_PAGES = 200; // safety stop (20k jobs) — well above current scale
    const allJobsData: any[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await talentService.getJobs({
        status: 'published',
        page,
        limit: PAGE_SIZE,
      });
      const items = res.data ?? [];
      allJobsData.push(...items);
      const totalPages = res.totalPages ?? 1;
      if (items.length < PAGE_SIZE || page >= totalPages) break;
    }

    const now = Date.now();

    // Only include jobs that are genuinely indexable RIGHT NOW. Expired,
    // not-yet-published, and internal-only roles must never appear in the
    // sitemap (Google penalises stale/non-canonical JobPosting URLs).
    //
    // The published gate is already applied server-side by the
    // `status: 'published'` query above; here we drop anything that is no
    // longer (or not yet) live, or is internal-only.
    const isIndexable = (job: any): boolean => {
      if (job.visibility && job.visibility !== 'public') return false;
      if (job.publishEndDate && new Date(job.publishEndDate).getTime() < now) {
        return false; // expired
      }
      if (job.publishStartDate && new Date(job.publishStartDate).getTime() > now) {
        return false; // scheduled for the future
      }
      return true;
    };

    const liveJobs = allJobsData.filter(isIndexable);

    // Countries with live roles that are not editorial hubs.
    const extraCountrySlugs = new Set<string>();
    for (const job of liveJobs) {
      const country = allCountries.find((c) => c.id === job.countryId);
      if (country && !hubSlugs.has(country.slug)) extraCountrySlugs.add(country.slug);
    }
    countryUrls.push(
      ...[...extraCountrySlugs].map((slug) => ({
        url: `${baseUrl}/careers/countries/${slug}`,
        lastModified: buildDate,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );

    // The town and city landing pages. These were missing from the sitemap entirely,
    // which is the worst omission on it: "jobs in Barbil" or "jobs in Damanjodi" is
    // exactly the search these pages are written to answer, and every one of them was
    // left to be discovered by internal links alone. Only places with live roles are
    // submitted — an empty one renders noindex and would be a wasted crawl.
    const placeSlugs = new Set<string>();
    for (const job of liveJobs) {
      const slug = job.placeSlug ?? job.metroSlug;
      if (slug) placeSlugs.add(slug);
    }
    placeUrls = [...placeSlugs].map((slug) => ({
      url: `${baseUrl}/careers/jobs/${slug}`,
      lastModified: buildDate,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    jobUrls = liveJobs
      .map((job: any) => {
        const country = allCountries.find((c) => c.id === job.countryId);
        if (!country) return null;
        // The role's own last edit — the one lastmod on this sitemap that is a real
        // signal. Falls back to the publish date rather than to "now".
        const changed = job.updatedAt ?? job.publishStartDate ?? job.createdAt;
        return {
          url: `${baseUrl}${jobPath(job as any, allCountries as any)}`,
          lastModified: changed ? new Date(changed) : buildDate,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    // If dynamic data fails, at least return the static sitemap
    console.error('Error generating dynamic sitemap entries:', error);
  }

  return [...staticUrls, ...countryUrls, ...placeUrls, ...jobUrls];
}
