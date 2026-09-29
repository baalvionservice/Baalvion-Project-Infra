import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * What crawlers may read.
 *
 * The allow-list is short on purpose. Only pages the PLATFORM wrote are indexable — what it
 * is, how it works, its safety rules and the resource directory. Nothing a member wrote is
 * ever indexed, including a case its author made public: "public" here means visible to
 * people who come to the site, not surfaced in a search for someone's name by the family
 * the case is about. That distinction is the whole product.
 *
 * Disallow entries are belt-and-braces. Every private page also carries `robots: noindex`
 * in its own metadata, and the API withholds private data from an unauthenticated crawler
 * regardless of what this file says.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /guides is the reading surface — platform-written, reviewed in a pull request,
        // and the only content here that is meant to be found by a search engine at all.
        allow: ['/$', '/about', '/how-it-works', '/safety', '/resources', '/guides'],
        disallow: [
          '/cases', '/my-cases', '/create-case',
          '/community/', '/profiles/', '/profile', '/settings',
          '/notifications', '/invitations', '/invite/', '/me/',
          '/moderation', '/admin', '/login', '/register', '/forgot-password',
          '/auth-bff/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
