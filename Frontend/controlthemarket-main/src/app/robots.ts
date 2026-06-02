import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/company/', '/candidate/', '/admin/', '/dashboard/'],
    },
    sitemap: 'https://controlthemarket.com/sitemap.xml',
  };
}
