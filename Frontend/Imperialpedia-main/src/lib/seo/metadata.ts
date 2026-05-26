import { Metadata } from 'next';
import { env } from '@/config/env';

interface MetadataProps {
  title: string;
  description: string;
  keywords?: string[];
  slug?: string;
  type?: 'website' | 'article' | 'profile';
  image?: string;
}

const siteName = 'Imperialpedia';
const defaultDescription = 'The world\'s most scalable financial intelligence engine. Explore over 1,000,000 pages of deep financial insights.';

/**
 * Global Metadata Generator for Next.js 14+
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  slug = '',
  type = 'website',
  image = '/og-image.jpg',
}: MetadataProps): Metadata {
  const baseUrl = env.siteUrl || 'https://imperialpedia.com';
  const url = `${baseUrl}${slug ? (slug.startsWith('/') ? slug : `/${slug}`) : ''}`;
  const fullTitle = `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description: description || defaultDescription,
    keywords: [...keywords, 'Finance', 'Investing', 'Intelligence', 'pSEO'],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: description || defaultDescription,
      url: url,
      siteName: siteName,
      images: [
        {
          url: image.startsWith('http') ? image : `${baseUrl}${image}`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description || defaultDescription,
      images: [image.startsWith('http') ? image : `${baseUrl}${image}`],
      creator: '@imperialpedia',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Helper to generate metadata for specific knowledge entities
 */
export function generateEntityMetadata(entity: any, type: 'country' | 'company' | 'industry' | 'technology'): Metadata {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  return generateMetadata({
    title: `${entity.name} | ${typeLabel} Profile`,
    description: entity.description || `Explore ${entity.name}'s ${type} profile, industry data, and market impact on Imperialpedia.`,
    keywords: entity.tags || [],
    slug: `/${type}s/${entity.slug}`,
    type: 'article',
  });
}
