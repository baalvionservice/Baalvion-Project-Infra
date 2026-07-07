// Google News sitemap (https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap).
// Google News only wants articles published in the last 2 days, tagged with the
// <news:news> extension — separate from the general sitemap.xml, which covers
// every route with plain lastModified/changeFrequency entries.
//
// Sourced the same way the /news page is (cmsGetNews, contentType: 'news'):
// cmsGetNews already goes through cms.ts's timeout-guarded fetchJSON, so a slow
// CMS degrades to an empty (but valid) sitemap instead of hanging this route.

import { cmsGetNews } from '@/lib/cms';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const PUBLICATION_NAME = 'Law Elite Network';
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
  const news = await cmsGetNews(1000);
  const cutoff = Date.now() - RECENCY_WINDOW_MS;

  const recent = news.filter((a) => {
    const published = a.updatedAt ? Date.parse(a.updatedAt) : NaN;
    return Number.isFinite(published) && published >= cutoff;
  });

  const urls = recent
    .map((a) => {
      const loc = `${SITE}/article/${a.slug}`;
      const publicationDate = new Date(a.updatedAt as string).toISOString();
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
