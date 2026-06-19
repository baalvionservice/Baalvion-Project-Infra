import { MetadataRoute } from 'next';
import {
  cmsGetPages,
  cmsGetProjects,
  cmsGetArticles,
  cmsGetUpdates,
  cmsGetServices,
  cmsGetIndustries,
  cmsGetCaseStudies,
  cmsGetAboutPages,
} from '@/lib/cms';
import { GUIDE_SLUGS } from '@/lib/guides';
import { INSIGHT_SLUGS } from '@/lib/insights';
import { RESEARCH_SLUGS } from '@/lib/research';

const BASE_URL = 'https://about.baalvion.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, projects, articles, updates, services, industries, caseStudies, aboutPages] =
    await Promise.all([
      cmsGetPages(),
      cmsGetProjects(),
      cmsGetArticles(),
      cmsGetUpdates(),
      cmsGetServices(),
      cmsGetIndustries(),
      cmsGetCaseStudies(),
      cmsGetAboutPages(),
    ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${BASE_URL}/${page.slug === 'home' ? '' : page.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: page.slug === 'home' ? 1 : 0.8,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.id}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/news/${article.category}/${article.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const updateRoutes: MetadataRoute.Sitemap = updates.map((update) => ({
    url: `${BASE_URL}/updates`,
    lastModified: new Date(update.updatedAt),
    changeFrequency: 'daily',
    priority: 0.5,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const industryRoutes: MetadataRoute.Sitemap = industries.map((s) => ({
    url: `${BASE_URL}/industries/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies.map((s) => ({
    url: `${BASE_URL}/case-studies/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const aboutRoutes: MetadataRoute.Sitemap = aboutPages.map((s) => ({
    url: `${BASE_URL}/about/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Hub / index routes that exist as explicit pages in the app router.
  const hubRoutes: MetadataRoute.Sitemap = [
    ['', 1],
    ['about', 0.8],
    ['structure', 0.8],
    ['philosophy', 0.8],
    ['services', 0.9],
    ['industries', 0.8],
    ['case-studies', 0.8],
    ['company', 0.6],
    ['contact', 0.6],
    ['careers', 0.6],
    ['leadership', 0.6],
    ['platform', 0.6],
    ['ecosystem', 0.6],
    ['projects', 0.7],
    ['news', 0.7],
    ['guides', 0.8],
    ['insights', 0.8],
    ['research', 0.8],
    ['trust', 0.5],
    ['investors', 0.5],
  ].map(([path, priority]) => ({
    url: `${BASE_URL}${path ? `/${path}` : ''}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: priority as number,
  }));

  // File-based trade guides (/guides/[slug]) — enumerated from a static slug
  // list so the sitemap needs no filesystem read at request time.
  const guideRoutes: MetadataRoute.Sitemap = GUIDE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // File-based research/insights articles — enumerated from static slug lists
  // so the sitemap needs no filesystem read at request time.
  const insightRoutes: MetadataRoute.Sitemap = INSIGHT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/insights/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const researchRoutes: MetadataRoute.Sitemap = RESEARCH_SLUGS.map((slug) => ({
    url: `${BASE_URL}/research/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Deduplicate by URL (hub routes may overlap with CMS page routes).
  const all = [
    ...hubRoutes,
    ...staticRoutes,
    ...projectRoutes,
    ...articleRoutes,
    ...updateRoutes,
    ...serviceRoutes,
    ...industryRoutes,
    ...caseStudyRoutes,
    ...aboutRoutes,
    ...guideRoutes,
    ...insightRoutes,
    ...researchRoutes,
  ];
  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
