'use client';

import { useMemo } from 'react';
import { useWebsiteCategoryTree, useCreateCategory } from '@/lib/queries/cms-taxonomy.queries';
import { NEWS_REGIONS, NEWS_TOPIC_SLUGS, type NewsTopic } from '@/lib/constants/news-taxonomy';
import type { CategoryTree } from '@/lib/types/cms-taxonomy.types';

function flatten(tree: CategoryTree[]): CategoryTree[] {
  const out: CategoryTree[] = [];
  const walk = (nodes: CategoryTree[]) => nodes.forEach((n) => { out.push(n); if (n.children?.length) walk(n.children); });
  walk(tree);
  return out;
}

/**
 * Resolves the fixed 13-topic / 6-region taxonomy (see news-taxonomy.ts) to real
 * CMS category IDs, creating whichever ones don't exist yet on first use. Editors
 * never see a category-management UI for this — the 13+6 list is the whole
 * picker, and it's always assignable regardless of what's already in the CMS.
 */
export function useNewsTaxonomy(websiteId: string) {
  const { data: tree, isLoading } = useWebsiteCategoryTree(websiteId);
  const { mutateAsync: createCategory } = useCreateCategory(websiteId);

  const flat = useMemo(() => flatten(tree ?? []), [tree]);

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

  return { isLoading, topicIdByName, regionIdBySlug, resolveTopic, resolveRegion };
}
