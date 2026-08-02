import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://community.marketunderworld.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/auth',
        '/dashboard',
        '/design-system',
        '/checkout',
        '/messages',
        '/notifications',
        '/settings',
        '/invoice',
        '/invoices',
        '/my-cards',
        '/wishlist',
        '/onboarding',
        '/referrals',
        '/returns',
        '/stats',
        '/subscriptions',
        '/chat',
        '/classroom',
        '/creator',
        '/investor',
        '/seller',
        '/seller-dashboard',
        '/student',
        '/student-dashboard',
        '/teacher-dashboard',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
