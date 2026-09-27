// Google News sitemap (https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap).
// Google News only wants articles published in the last 2 days, tagged with the
// <news:news> extension — separate from the general sitemap.xml (src/app/sitemap.ts),
// which covers every route with plain lastModified/changeFrequency entries.
//
// Sourced the same way sitemap.ts's news entries are (listCmsContent, contentType:
// 'news'); listCmsContent throws on transport/5xx, so a failed CMS fetch degrades to
// an empty (but valid) sitemap instead of a 500.

import { listCmsContent } from '@/services/data/cms-public';
import { articleUrl } from '@/lib/data/article-url';
import { env } from '@/config/env';

const SITE = env.siteUrl || 'https://imperialpedia.com';
const PUBLICATION_NAME = 'Imperialpedia';
const RECENCY_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // Google News: only the last 2 days

// Revalidate frequently — News sitemaps are expected to reflect near-real-time publishing.
export const revalidate = 300;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const cutoff = Date.now() - RECENCY_WINDOW_MS;

  let recent: { slug: string; title: string; publishedAt: string }[] = [];
  try {
    // Walks pages rather than trusting one limit=1000 request — cms-service caps
    // each response at 100 regardless of what's asked for (see the totalPages note
    // on getArticleCategoryMap in cms-public.ts), the same under-collection bug
    // fixed in articles-service.ts's getArticles. Results sort publishedAt DESC, so
    // once a page's oldest item is already outside the 2-day window there's nothing
    // older left worth fetching another page for.
    const items: Awaited<ReturnType<typeof listCmsContent>>['items'] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const res = await listCmsContent({ contentType: 'news', page, limit: 1000 });
      items.push(...res.items);
      totalPages = Math.max(1, Math.ceil(res.total / Math.max(res.items.length, 1)));
      const oldestOnPage = res.items[res.items.length - 1];
      const oldestPublished = oldestOnPage?.publishedAt ? Date.parse(oldestOnPage.publishedAt) : NaN;
      if (res.items.length === 0 || (Number.isFinite(oldestPublished) && oldestPublished < cutoff)) break;
      page += 1;
    } while (page <= totalPages);

    recent = items
      .filter((a) => {
        const published = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
        return Number.isFinite(published) && published >= cutoff;
      })
      .map((a) => ({ slug: a.slug, title: a.title, publishedAt: a.publishedAt as string }));
  } catch {
    // CMS unreachable — fall through to an empty (but valid) sitemap.
  }

  const urls = recent
    .map((a) => {
      // Bare /<slug> 301s to the dated canonical (see article-url.ts) — submit the
      // canonical path directly instead of a URL that just redirects there.
      const loc = `${SITE}${articleUrl(a.publishedAt, a.slug)}`;
      const publicationDate = new Date(a.publishedAt).toISOString();
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
