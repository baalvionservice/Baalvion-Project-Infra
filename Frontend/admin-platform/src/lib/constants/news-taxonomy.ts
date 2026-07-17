/**
 * The fixed editorial taxonomy for Imperialpedia news — exactly these 13 topics
 * and 6 regions, no more, no less. This is a deliberate constraint (not every
 * CMS category), matching the site's actual nav (imperialpedia-main's
 * navCategories/REGIONS) so a story tagged here lands in the right rail on
 * /world, /news and /market-news. Do not let editors free-type new topics —
 * add to this list (and the matching frontend taxonomy) instead.
 */
export const NEWS_TOPICS = [
  'Markets', 'Business', 'Investing', 'Tech', 'Politics', 'World',
  'Finance', 'Health & Science', 'Media', 'Real Estate', 'Energy',
  'Climate', 'Personal Finance',
] as const;

export type NewsTopic = (typeof NEWS_TOPICS)[number];

// Slugs matter for regions — imperialpedia-main's worldFeed.ts queries CMS
// content by `categorySlug: <regionId>`, so these must match RegionId exactly.
export const NEWS_REGIONS: { label: string; slug: string }[] = [
  { label: 'World', slug: 'world' },
  { label: 'U.S.', slug: 'us' },
  { label: 'Europe', slug: 'europe' },
  { label: 'Asia-Pacific', slug: 'asia' },
  { label: 'China', slug: 'china' },
  { label: 'Emerging Markets', slug: 'emerging' },
];

const slugify = (s: string) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const NEWS_TOPIC_SLUGS: Record<NewsTopic, string> = Object.fromEntries(
  NEWS_TOPICS.map((t) => [t, slugify(t)]),
) as Record<NewsTopic, string>;
