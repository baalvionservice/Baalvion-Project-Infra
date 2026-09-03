import { MetadataRoute } from 'next';
import { AppConfig } from '@/config/app.config';

/**
 * Paths that must never be crawled/indexed:
 *  - Private app areas (admin, dashboard, candidate account, auth, unauthorized)
 *  - The API surface and Next internals
 *  - The application funnel (transactional, not content)
 *  - Faceted/sort/pagination query-string states (thin/duplicate) — the clean
 *    canonical listing pages remain crawlable.
 *
 * Public, indexable content (home, the careers hub, country pages, individual
 * job postings, /about, /products, /projects, and legal pages) stays allowed.
 */
const disallow: string[] = [
  '/admin/',
  '/my-account/',
  '/api/',
  '/dashboard/',
  '/unauthorized/',
  '/_next/',
  '/apply/',
  '/login',
  '/register',
  '/careers/application/', // multi-step application flow — not content
  // Sort and view are true duplicates — the same results in a different order — so they
  // stay out of the index.
  //
  // `page=` is deliberately NOT here. Blocking it walled off every result page after the
  // first, and with twelve roles to a page that left roughly four hundred jobs with no
  // crawlable internal link anywhere on the site. Pagination is how a crawler walks a
  // listing; Google's own guidance is to let it, and to self-canonicalise each page.
  '/*?*sort=',
  '/*?*order=',
  '/*?*view=',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        // Googlebot may fetch /_next/ static assets to render pages correctly.
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallow.filter((path) => path !== '/_next/'),
      },
    ],
    sitemap: `${AppConfig.baseUrl}/sitemap.xml`,
    host: AppConfig.baseUrl,
  };
}
