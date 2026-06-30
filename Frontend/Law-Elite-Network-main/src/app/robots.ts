import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/plans', '/about-us', '/contact-us', '/careers', '/advertise', '/editorial-process', '/privacy-policy', '/terms-of-service', '/disclaimer', '/lawyers/', '/article/', '/law/', '/legal/'],
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
          '/booking/',
          '/booking-details/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/access-denied',
          '/lawyer/dashboard',
          '/lawyer/earnings',
          '/lawyer/requests',
          '/lawyer/availability',
          '/lawyer/profile',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
