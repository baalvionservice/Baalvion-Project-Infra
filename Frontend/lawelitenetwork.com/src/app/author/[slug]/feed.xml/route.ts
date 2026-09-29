import { cmsGetArticles, type CmsArticle } from '@/lib/cms';
import { mergeArticles } from '@/data/law-content';
import { authorNameToSlug, getAuthorBySlug } from '@/data/authors';
import { getMergedAuthorBySlug } from '@/lib/authors-server';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

export const revalidate = 86400;

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategoryArticle(a: { category?: { slug?: string } }): boolean {
  const rawSlug = a.category?.slug;
  return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
}

function itemXml(item: CmsArticle): string {
  const url = `${SITE}${articleUrl(item)}`;
  const pubDate = item.updatedAt ? new Date(item.updatedAt).toUTCString() : new Date().toUTCString();
  return `  <item>
    <title>${esc(item.title)}</title>
    <link>${esc(url)}</link>
    <guid isPermaLink="true">${esc(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    ${item.excerpt ? `<description>${esc(item.excerpt)}</description>` : ''}
    ${item.category?.name ? `<category>${esc(item.category.name)}</category>` : ''}
  </item>`;
}

/** Per-author RSS 2.0 feed — articles attributed to this contributor. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [author, cmsArticles] = await Promise.all([
    getMergedAuthorBySlug(slug),
    cmsGetArticles().catch(() => [] as CmsArticle[]),
  ]);

  if (!author) {
    return new Response('Not found', { status: 404 });
  }

  const articles = mergeArticles(cmsArticles)
    .filter((a) => authorNameToSlug(a.author) === slug && isKeptCategoryArticle(a))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 30) as unknown as CmsArticle[];

  const feedUrl = `${SITE}/author/${slug}/feed.xml`;
  const authorUrl = `${SITE}/author/${slug}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(author.name)} — Law Elite Network</title>
  <link>${esc(authorUrl)}</link>
  <description>Legal guides and articles by ${esc(author.name)} on Law Elite Network.</description>
  <language>en-us</language>
  <atom:link href="${esc(feedUrl)}" rel="self" type="application/rss+xml" />
${articles.map((item) => itemXml(item)).join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
