import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/plans', '/about-us', '/contact-us', '/careers', '/advertise', '/editorial-process', '/lawyers/', '/article/', '/law/', '/legal/'],
        disallow: [
          '/dashboard',
          '/admin/',
          '/profile',
          '/cases/',
          '/chat/',
          '/appointments',
          '/vault',
          '/transactions',
          '/billing',
          '/notifications',
          '/my-counsel',
          '/referral',
          '/onboarding',
          '/checkout/',
          '/booking-details/',
          '/lawyer/dashboard',
          '/lawyer/earnings',
          '/lawyer/requests',
          '/lawyer/availability',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
