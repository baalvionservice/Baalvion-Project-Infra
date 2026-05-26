import { Metadata } from 'next';
import { seoConfig } from '@/config/seo';
import { env } from '@/config/env';

interface MetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
}

/**
 * Generates a dynamic Next.js Metadata object by merging custom values with global defaults.
 * Optimized for high-velocity SEO ingestion and social sharing impact.
 */
export function buildMetadata({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: MetadataProps = {}): Metadata {
  const siteName = 'Imperialpedia';
  const finalTitle = title ? `${title} | ${siteName}` : seoConfig.defaultTitle;
  const finalDescription = description || seoConfig.defaultDescription;
  const finalKeywords = keywords || seoConfig.defaultKeywords;
  
  // Ensure canonical is an absolute URL and only set when explicitly provided.
  const baseUrl = env.siteUrl.endsWith('/') ? env.siteUrl.slice(0, -1) : env.siteUrl;
  const absoluteCanonical = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${baseUrl}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : undefined;

  const metadata: Metadata = {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: absoluteCanonical || baseUrl,
      siteName: siteName,
      images: [
        {
          url: ogImage || `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
      locale: 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [ogImage || `${baseUrl}/og-image.jpg`],
      creator: '@imperialpedia',
      site: '@imperialpedia',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  if (absoluteCanonical) {
    metadata.alternates = {
      canonical: absoluteCanonical,
    };
  }

  return metadata;
}

