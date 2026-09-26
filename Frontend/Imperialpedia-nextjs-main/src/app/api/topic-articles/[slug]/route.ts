import { NextResponse } from 'next/server';
import { getCategoryArticles } from '@/services/data/cms-public';

/** Server-side proxy for a client component (FollowedTopicsRail) that needs a
 *  category's articles — cms-service's CORS allow-list doesn't include this
 *  app's origin, same reason as the other article-engagement routes. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articles = await getCategoryArticles(slug, 3);
  return NextResponse.json(
    articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      categorySlug: slug,
      contentType: a.contentType,
      publishedAt: a.publishedAt,
    })),
  );
}
