import { getArticlesForEntity } from '@/lib/entity-articles';
import type { EntityReference, EntityType } from '@/types/entity-tagging';

const DEFAULT_LIMIT = 8;

/**
 * "Related content" for one entity, in relevance order:
 *   1. Articles directly connected to this entity (auto-detected mention,
 *      or a manually pinned slug) -- the strongest signal, always first.
 *   2. Articles connected to an explicitly related entity (a case's lawyer,
 *      a movie's co-star, a person's related person) -- fills remaining
 *      slots only, never displaces a direct match.
 * Deduped by article slug throughout (a direct match always wins if the
 * same article also turns up via a related entity), and capped at `limit`
 * so a heavily connected entity doesn't produce an unbounded list. This is
 * the "sensible relevance rule" the whole system rests on: relatedness
 * comes from what real articles actually connect, not a guess, and
 * duplicates/irrelevant filler are structurally impossible because
 * everything is keyed by real article slugs from the same tagged index.
 */
export async function getRelatedArticles(
  entityType: EntityType,
  slug: string,
  options: { relatedEntities?: EntityReference[]; manualSlugs?: string[]; limit?: number } = {},
): Promise<any[]> {
  const { relatedEntities = [], manualSlugs = [], limit = DEFAULT_LIMIT } = options;

  const direct = await getArticlesForEntity(entityType, slug, manualSlugs);
  const seen = new Set(direct.map((a) => a.slug));
  const combined = [...direct];

  for (const ref of relatedEntities) {
    if (combined.length >= limit) break;
    const extra = await getArticlesForEntity(ref.entityType, ref.slug);
    for (const article of extra) {
      if (combined.length >= limit) break;
      if (seen.has(article.slug)) continue;
      seen.add(article.slug);
      combined.push(article);
    }
  }

  return combined.slice(0, limit);
}
