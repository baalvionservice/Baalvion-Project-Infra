import { getTaggedArticleIndex } from '@/lib/entity-articles';
import { articleUrl } from '@/lib/article-url';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

const lastSegment = (p: string) => {
  try {
    const path = p.startsWith('http') ? new URL(p).pathname : p;
    return path.split('/').filter(Boolean).pop() || '';
  } catch {
    return '';
  }
};

/**
 * Called from the publish webhook. Finds the just-published articles among the
 * paths/urls the CMS sent, works out which entities each names, and asks
 * law-service to notify the members who follow them. law-service dedupes per
 * (member, article), so a repeated webhook cannot double-notify. Returns a
 * status string for the webhook response; never throws.
 */
export async function notifyFollowersOfPublish(hints: string[]): Promise<'skipped' | 'sent' | 'error'> {
  const key = process.env.LAW_INTERNAL_KEY;
  if (!key || !BASE_URL) return 'skipped';
  const slugs = new Set(hints.map(lastSegment).filter(Boolean));
  if (slugs.size === 0) return 'skipped';

  try {
    const index = await getTaggedArticleIndex();
    const hits = index.filter(({ article, entities }) => slugs.has(article?.slug) && entities.length > 0);
    await Promise.all(
      hits.map(({ article, entities }) =>
        fetch(`${BASE_URL}/member/notify-followers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-service-key': key },
          body: JSON.stringify({ articleSlug: article.slug, title: article.title, url: articleUrl(article), entities }),
          signal: AbortSignal.timeout(4000),
        }),
      ),
    );
    return hits.length > 0 ? 'sent' : 'skipped';
  } catch {
    return 'error';
  }
}
