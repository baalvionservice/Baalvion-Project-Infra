'use client';

import { useMemo } from 'react';
import { useWebsiteCategoryTree, useCreateCategory } from '@/lib/queries/cms-taxonomy.queries';
import { NEWS_REGIONS, NEWS_TOPIC_SLUGS, type NewsTopic } from '@/lib/constants/news-taxonomy';
import { slugify } from '@/lib/utils/format';
import { flattenCategoryTree } from '@/lib/types/cms-taxonomy.types';

/**
 * Resolves the fixed 13-topic / 6-region taxonomy (see news-taxonomy.ts) to real
 * CMS category IDs, creating whichever ones don't exist yet on first use. Editors
 * never see a category-management UI for this — the 13+6 list is the whole
 * picker, and it's always assignable regardless of what's already in the CMS.
 *
 * Countries are one level below a region (parentId = region's category id) —
 * that parent/child shape is exactly what imperialpedia-main's
 * `deriveWorldGeo` (cms-public.ts) reads to build `/world/<region>/<country>/...`
 * URLs, so a country created here needs no other code change to go live.
 */
export function useNewsTaxonomy(websiteId: string) {
  const { data: tree, isLoading } = useWebsiteCategoryTree(websiteId);
  const { mutateAsync: createCategory } = useCreateCategory(websiteId);

  const flat = useMemo(() => flattenCategoryTree(tree ?? []), [tree]);

  const topicIdByName = useMemo(() => {
    const m = new Map<string, string>();
    flat.forEach((c) => m.set(c.name.trim().toLowerCase(), c.id));
    return m;
  }, [flat]);

  const regionIdBySlug = useMemo(() => {
    const m = new Map<string, string>();
    flat.forEach((c) => m.set(c.slug, c.id));
    return m;
  }, [flat]);

  const countriesByRegionSlug = useMemo(() => {
    const m = new Map<string, { id: string; name: string; slug: string }[]>();
    NEWS_REGIONS.forEach((r) => {
      const regionId = regionIdBySlug.get(r.slug);
      if (!regionId) return;
      const children = flat
        .filter((c) => c.parentId === regionId)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
      m.set(r.slug, children);
    });
    return m;
  }, [flat, regionIdBySlug]);

  const resolveTopic = async (topic: NewsTopic): Promise<string> => {
    const existing = topicIdByName.get(topic.toLowerCase());
    if (existing) return existing;
    const res = await createCategory({ websiteId, name: topic, slug: NEWS_TOPIC_SLUGS[topic] });
    return res.data.data.id;
  };

  const resolveRegion = async (slug: string): Promise<string> => {
    const existing = regionIdBySlug.get(slug);
    if (existing) return existing;
    const region = NEWS_REGIONS.find((r) => r.slug === slug);
    const res = await createCategory({ websiteId, name: region?.label ?? slug, slug });
    return res.data.data.id;
  };

  const getCountriesForRegion = (regionSlug: string) => countriesByRegionSlug.get(regionSlug) ?? [];

  /** Creates (or reuses) a country category nested under the given region. */
  const resolveCountry = async (regionSlug: string, countryName: string): Promise<{ id: string; slug: string }> => {
    const regionId = await resolveRegion(regionSlug);
    const countrySlug = slugify(countryName);
    const existing = flat.find((c) => c.parentId === regionId && c.slug === countrySlug);
    if (existing) return { id: existing.id, slug: existing.slug };
    const res = await createCategory({ websiteId, name: countryName, slug: countrySlug, parentId: regionId });
    return { id: res.data.data.id, slug: countrySlug };
  };

  // Simplified flat shape (id/slug/parentId/name) for URL-preview building —
  // callers that need to resolve region+country from a set of categoryIds
  // (see lib/newsroom/public-url.ts) don't need the full CategoryTree.
  const categories = useMemo(
    () => flat.map((c) => ({ id: c.id, slug: c.slug, parentId: c.parentId, name: c.name })),
    [flat],
  );

  return {
    isLoading,
    topicIdByName,
    regionIdBySlug,
    categories,
    resolveTopic,
    resolveRegion,
    getCountriesForRegion,
    resolveCountry,
  };
}
