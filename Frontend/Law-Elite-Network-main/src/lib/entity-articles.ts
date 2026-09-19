import { unstable_cache } from 'next/cache';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { getArticleEntities } from '@/lib/entity-mentions';
import { buildEntityRegistry } from '@/lib/entity-registry';
import { CONTENT_CACHE_TAG } from '@/lib/cache-tags';
import type { EntityType, EntityReference } from '@/types/entity-tagging';

/**
 * The reverse side of entity-mentions.ts: builds "article -> entities it
 * connects to" once for the whole (bundled + CMS) article pool, so every
 * entity page's "Latest News" section is a filter over this, not N separate
 * scans. Tagged with CONTENT_CACHE_TAG -- the same tag /api/revalidate's
 * publish webhook busts -- so a newly published article's connections go
 * live the moment it publishes, not just on the 15-minute fallback window.
 * This is the actual mechanism behind "when an article is published, it
 * should automatically become available on the relevant entity pages": no
 * step here requires an editor to pick entities, it's computed from what the
 * article already says.
 */
async function buildTaggedArticleIndex() {
  const cmsArticles = await cmsGetArticles().catch(() => []);
  const articles = mergeArticles(cmsArticles);
  const registry = buildEntityRegistry();
  return articles.map((article) => ({
    article,
    entities: getArticleEntities(article, registry),
  }));
}

const getCachedTaggedIndex = unstable_cache(
  buildTaggedArticleIndex,
  ['len-entity-tagged-articles'],
  { revalidate: 900, tags: [CONTENT_CACHE_TAG] },
);

/**
 * Every article connected to one entity — auto-detected matches unioned with
 * any manually pinned slugs (a precision override for the rare case where
 * detection under- or over-matches; never a requirement, per the "do not
 * require editors to manually duplicate the article" instruction).
 */
export async function getArticlesForEntity(
  entityType: EntityType,
  slug: string,
  manualSlugs: string[] = [],
): Promise<any[]> {
  const index = await getCachedTaggedIndex();
  const bySlug = new Map<string, any>();

  index.forEach(({ article, entities }) => {
    if (entities.some((e) => e.entityType === entityType && e.slug === slug)) {
      bySlug.set(article.slug, article);
    }
  });

  if (manualSlugs.length > 0) {
    const manual = await Promise.all(manualSlugs.map((s) => fetchArticleForRender(s).catch(() => null)));
    manual.forEach((a) => a && bySlug.set(a.slug, a));
  }

  return Array.from(bySlug.values());
}

/** An article's own connection list, for rendering "Connections" on the article page itself. */
export async function getEntitiesForArticle(article: { title?: string; excerpt?: string; summary?: string; content?: string }) {
  return getArticleEntities(article);
}

/**
 * The core relevance rule for automatic related-content: two entities are
 * related if a real published article connects them both. Counts how often
 * each other entity co-appears with (`entityType`, `slug`) across the whole
 * tagged article pool and ranks by that count — content-driven relevance,
 * not an arbitrary/curated guess, and it strengthens on its own as more
 * real articles publish. Self-excluded. Returns [] honestly today (no
 * article yet connects two tracked entities at once); the mechanism is
 * real and needs no further wiring once that changes.
 */
export async function getCoOccurringEntities(
  entityType: EntityType,
  slug: string,
  options: { includeTypes?: EntityType[]; limit?: number } = {},
): Promise<EntityReference[]> {
  const { includeTypes, limit = 6 } = options;
  const index = await getCachedTaggedIndex();
  const counts = new Map<string, { ref: EntityReference; count: number }>();

  index.forEach(({ entities }) => {
    const isConnected = entities.some((e) => e.entityType === entityType && e.slug === slug);
    if (!isConnected) return;
    entities.forEach((e) => {
      if (e.entityType === entityType && e.slug === slug) return; // exclude self
      if (includeTypes && !includeTypes.includes(e.entityType)) return;
      const key = `${e.entityType}:${e.slug}`;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { ref: e, count: 1 });
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((c) => c.ref);
}
