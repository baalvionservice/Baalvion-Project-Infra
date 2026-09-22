import { MetadataRoute } from 'next';
import { env } from '@/config/env';

const DISALLOW = [
  '/admin/',
  '/api/',
  '/private/',
  '/creator/dashboard/',
  '/dashboard/',
  '/editor/',
  '/writer/',
  '/outline',
  '/auth/',
  '/maintenance',
  '/pricing',
];

// Dead paths (/calculators/, /terms, /topics, /learning-paths, /datasets,
// /savings, /creator-guides, /social-media-earnings, /scams-and-fraud-protection)
// are deliberately not disallowed: blocking a URL Google already indexed stops
// it from re-crawling to see the 404/410, so it never leaves the index.

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.siteUrl || 'https://imperialpedia.com';

  return {
    rules: [
      // AdSense crawlers ignore the '*' group when they have their own, and must
      // reach every page to pick ads, including routes hidden from search.
      { userAgent: ['Mediapartners-Google', 'Google-Display-Ads-Bot'], allow: '/' },
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
  };
}
