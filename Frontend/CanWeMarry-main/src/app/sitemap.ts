import type { MetadataRoute } from 'next';
import { resources } from '@/lib/api';
import { GUIDES } from '@/content/guides';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * The sitemap lists platform-authored pages only.
 *
 * Cases, communities, posts and profiles are deliberately absent. A sitemap is a public
 * statement that a URL exists — listing a case URL would confirm the case is real to anyone
 * who fetched this file, which is exactly the disclosure the visibility rules prevent
 * everywhere else. The resource directory is included because volunteers wrote it and it is
 * genuinely useful to find from a search engine. The guides are listed for the same reason:
 * they are written in this repository by the platform, not by a member, and their whole
 * purpose is to be found by somebody searching at two in the morning for whether they are
 * allowed to marry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/safety`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE.url}/resources`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE.url}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // `updated` is the date on the guide itself, so a lastModified here is a real claim about
  // when the text changed rather than the time this file happened to be requested.
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE.url}/guides/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Published resources only. The API withholds drafts from an unauthenticated caller, and
  // this request is unauthenticated, so a half-checked referral cannot reach the sitemap.
  const result = await resources.list({ pageSize: 200 });
  const resourcePages: MetadataRoute.Sitemap = result.ok
    ? result.data
        .filter((r) => r.isPublished)
        .map((r) => ({
          url: `${SITE.url}/resources/${r.slug}`,
          lastModified: r.publishedAt ? new Date(r.publishedAt) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        }))
    : [];

  return [...staticPages, ...guidePages, ...resourcePages];
}
