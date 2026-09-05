/**
 * @file robots.txt/route.ts
 * @description Crawl policy for the directory's own subdomain.
 *
 * The directory needs its own robots.txt, not the trade app's. The app's policy at
 * src/app/robots.ts disallows the authenticated surface and points at the app's sitemap —
 * served on ships.baalvion.com that would advertise a sitemap on a different host, which
 * crawlers ignore, and the directory's 96,000 URLs would go undiscovered.
 *
 * Filtered search permutations are disallowed by pattern as well as by their pages'
 * robots meta: a crawler that never renders the page still respects this.
 */
import { SITE_URL, canonical } from '@/lib/shipping-directory/site';

export const revalidate = 86400;

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Pagination and free-text search. Every item behind them is already listed',
    '# individually in the sitemap, so blocking these costs no discovery and saves crawl',
    '# budget across ~99,700 real URLs.',
    'Disallow: /*?*offset=',
    'Disallow: /*?*q=',
    '',
    '# NOTE: ?sort= and ?scope= are deliberately NOT blocked. They are internally linked',
    '# from the Refine rail, and a URL blocked here can still be indexed with no content',
    '# because the crawler never reads its noindex. They carry robots=noindex,follow',
    '# instead, which lets the crawler see the directive and drop them cleanly.',
    '',
    '# Never part of this property.',
    'Disallow: /api/',
    'Disallow: /trade-bff/',
    '',
    `Sitemap: ${canonical('sitemap.xml')}`,
    `Host: ${SITE_URL.replace(/^https?:\/\//, '')}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
