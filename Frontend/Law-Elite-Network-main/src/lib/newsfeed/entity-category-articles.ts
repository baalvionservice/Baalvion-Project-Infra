import { getTaggedArticleIndex } from '@/lib/entity-articles';
import { getMergedPeople } from '@/lib/people-server';
import type { PersonCategorySlug } from '@/types/person';

/**
 * Every real article that names at least one Person in any of the given
 * categories -- e.g. `['athletes']` for /sports -- regardless of which CMS
 * category an editor filed the article under.
 *
 * Why this exists: /sports needed Ronaldo/Messi/LeBron's legal profiles
 * even though they're filed under `celebrity-news`. The first version of
 * that cross-listing checked whether the article's subcategory *slug*
 * happened to start with "sports-" -- a naming convention an editor has to
 * remember and get right every time. This checks the actual, structural
 * fact instead: is a real athlete named in the piece. That's the same
 * auto-tagging entity-mentions.ts already runs for every Person/Case/Court
 * profile page's own "Latest News" -- this just filters that same index by
 * the tagged person's category instead of by entity type alone.
 *
 * An editor's own category/subcategory choice still decides an article's
 * PRIMARY placement (each hub's own cmsGetArticles(categorySlug) call) --
 * this only adds genuinely relevant articles a manual category choice
 * missed, never removes or overrides one.
 */
export async function getArticlesMentioningPersonCategory(categories: PersonCategorySlug[]): Promise<any[]> {
  const [index, people] = await Promise.all([getTaggedArticleIndex(), getMergedPeople()]);
  const slugsInCategory = new Set(
    people.filter((p) => categories.includes(p.category)).map((p) => p.slug),
  );
  if (slugsInCategory.size === 0) return [];

  const out: any[] = [];
  for (const { article, entities } of index) {
    const hit = entities.some((e) => e.entityType === 'person' && slugsInCategory.has(e.slug));
    if (hit) out.push(article);
  }
  return out;
}
