import { SEOConfig } from '@/types';
import { platformConfig } from './platform';
import { env } from './env';

/**
 * @fileOverview Default SEO configuration and metadata.
 */

export const seoConfig: SEOConfig = {
  defaultTitle: `${platformConfig.name} — Scalable Financial Knowledge Platform`,
  defaultDescription: platformConfig.description,
  defaultKeywords: ['Finance', 'Investing', 'Financial Glossary', 'Creator Economy', 'Market Analytics', 'pSEO'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: env.siteUrl,
    siteName: platformConfig.name,
    images: [
      {
        url: `${env.siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: platformConfig.name,
      },
    ],
  },
  twitter: {
    handle: '@imperialpedia',
    site: '@imperialpedia',
    cardType: 'summary_large_image',
  },
};
