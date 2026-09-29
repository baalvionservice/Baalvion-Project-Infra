import type { Topic } from '@/data/topics';
import { getTaggedArticleIndex } from '@/lib/entity-articles';

/** Slugs of topics at least one published article is tagged with. */
export async function getTopicSlugsWithArticles(): Promise<Set<string>> {
  const index = await getTaggedArticleIndex();
  const slugs = new Set<string>();
  index.forEach(({ entities }) => entities.forEach((e) => e.entityType === 'topic' && slugs.add(e.slug)));
  return slugs;
}

/**
 * A topic page earns a place in search only when it has something to say: an
 * editor-written description, or at least one article. An empty tag page is
 * thin content, so it stays noindex until then (and an explicit admin
 * setting of "not indexable" always wins).
 */
export function isTopicIndexable(topic: Topic, withArticles: Set<string>): boolean {
  if (topic.indexable === false) return false;
  return !!topic.description || withArticles.has(topic.slug);
}
