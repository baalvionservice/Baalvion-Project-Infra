import type { MetadataRoute } from 'next';
import { getStorefrontCategories, getStorefrontProducts } from '@/lib/api/commerce';

// No NEXT_PUBLIC_APP_URL is set for the market-underworld-community Worker (see
// wrangler.jsonc — only NEXT_PRIVATE_MINIMAL_MODE is defined), so default straight to the
// real custom domain rather than the localhost fallback community.ts/giftcards.ts use for
// same-origin proxying. That keeps this file correct in prod with zero extra deploy config.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://community.marketunderworld.com';

// community-service's public endpoint, called directly (same target community-proxy's route
// forwards to) instead of going through /api/community-proxy — that proxy is same-origin by
// design for cookie translation, which would make this route self-fetch its own Worker.
const COMMUNITY_API_BASE =
  process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? 'https://api.baalvion.com/api/v1/community';

interface PublicCommunity {
  slug: string;
  isForum: boolean;
}

async function getForumSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${COMMUNITY_API_BASE}/public/communities`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { success: boolean; data: PublicCommunity[] };
    return (body.data ?? []).filter((c) => c.isForum).map((c) => c.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [forumSlugs, categories, products] = await Promise.all([
    getForumSlugs(),
    getStorefrontCategories(),
    // Backend caps page size at 200 (parsePagination) — plenty for the current catalog size.
    getStorefrontProducts(undefined, { limit: 200 }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1.0, changeFrequency: 'daily' },
    { url: `${SITE_URL}/forum`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE_URL}/shop`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE_URL}/access`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/marketplace`, priority: 0.6, changeFrequency: 'daily' },
    { url: `${SITE_URL}/education`, priority: 0.6, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/gift-cards`, priority: 0.6, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/leaderboard`, priority: 0.5, changeFrequency: 'daily' },
    { url: `${SITE_URL}/live-sessions`, priority: 0.5, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/match`, priority: 0.4, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/premium`, priority: 0.4, changeFrequency: 'monthly' },
  ];

  const forumRoutes: MetadataRoute.Sitemap = forumSlugs.map((slug) => ({
    url: `${SITE_URL}/forum/${slug}`,
    priority: 0.7,
    changeFrequency: 'daily',
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/shop/${category.id}`,
    priority: 0.6,
    changeFrequency: 'daily',
  }));

  // getStorefrontProducts already only returns published/public listings (see
  // commerce-service's PUBLIC_WHERE filter) — no client-side status filtering needed.
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/shop/${product.categoryId}/${product.slug}`,
    priority: 0.5,
    changeFrequency: 'weekly',
  }));

  return [...staticRoutes, ...forumRoutes, ...categoryRoutes, ...productRoutes];
}
