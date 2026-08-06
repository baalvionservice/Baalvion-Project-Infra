import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, type LawArticle } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';

export const dynamic = 'force-dynamic';

/**
 * Site search. Previously SearchBar/the /search page queried law-service's
 * `articles` table directly (`articlesPublicApi.list({ search })`) — that
 * table is empty on prod, so every search returned zero results regardless
 * of query. The site's actual content lives in the bundled library and in
 * cms-service, exactly like every other page (category, subcategory, A-Z)
 * already merges. This route does the same merge for search instead of
 * hitting the one empty source.
 */
async function getSearchableArticles(): Promise<LawArticle[]> {
  const bundled = getAllArticles();
  const cms = await cmsGetArticles().catch(() => []);
  const bySlug = new Map<string, LawArticle>();
  bundled.forEach((a) => bySlug.set(a.slug, a));
  cms.forEach((c) => {
    bySlug.set(c.slug, {
      id: c.id,
      title: c.title,
      slug: c.slug,
      alphabet: c.alphabet,
      categoryId: c.category?.slug ?? '',
      subcategoryId: '',
      category: { id: c.category?.slug ?? '', name: c.category?.name ?? '', slug: c.category?.slug ?? '' },
      subcategory: { id: '', name: '', slug: '' },
      summary: c.excerpt ?? '',
      content: c.content,
      author: c.author ?? 'Law Elite Editorial',
      updatedAt: c.updatedAt ?? '',
      readingTime: Number(c.readingTime) || 0,
      views: c.views ?? 0,
      featured: !!c.featured,
      imageSeed: c.slug,
      featuredImage: c.featuredImage,
    });
  });
  return Array.from(bySlug.values());
}

function score(article: LawArticle, q: string): number {
  const title = article.title.toLowerCase();
  const summary = (article.summary || '').toLowerCase();
  let s = 0;
  if (title === q) s += 100;
  else if (title.startsWith(q)) s += 80;
  else if (title.includes(q)) s += 60;
  if (summary.includes(q)) s += 10;
  s += (article.views || 0) / 1000;
  return s;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const limit = Number(req.nextUrl.searchParams.get('limit')) || 100;
  if (!q) return NextResponse.json({ data: { items: [] } });

  const articles = await getSearchableArticles();
  const items = articles
    .map((a) => ({ ...a, score: score(a, q) }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ data: { items } });
}
