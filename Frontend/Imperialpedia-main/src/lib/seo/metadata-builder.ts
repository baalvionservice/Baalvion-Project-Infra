import { Metadata } from 'next';
import { seoConfig } from '@/config/seo';
import { env } from '@/config/env';
import { isPathHiddenByAdsenseCleanup } from '@/config/adsense-cleanup';

interface MetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  // Bypasses the root layout's `%s | Imperialpedia` template — for a title that
  // already stands on its own (the homepage), the template would double the brand.
  absoluteTitle?: boolean;
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
  absoluteTitle = false,
}: MetadataProps = {}): Metadata {
  const siteName = 'Imperialpedia';
  const suffixPattern = new RegExp(`\\s*\\|\\s*${siteName}\\s*$`, 'i');
  let cleanTitle = title?.trim();
  while (cleanTitle && suffixPattern.test(cleanTitle)) {
    cleanTitle = cleanTitle.replace(suffixPattern, '').trim();
  }
  const finalTitle = cleanTitle || seoConfig.defaultTitle;
  const socialTitle = !cleanTitle
    ? seoConfig.defaultTitle
    : absoluteTitle
      ? cleanTitle
      : `${cleanTitle} | ${siteName}`;
  const finalDescription = description || seoConfig.defaultDescription;
  const finalKeywords = keywords || seoConfig.defaultKeywords;
  
  // Ensure canonical is an absolute URL and only set when explicitly provided.
  const baseUrl = env.siteUrl.endsWith('/') ? env.siteUrl.slice(0, -1) : env.siteUrl;
  const absoluteCanonical = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${baseUrl}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : undefined;

  const isHiddenByCleanup = canonical ? isPathHiddenByAdsenseCleanup(canonical) : false;
  const effectiveNoIndex = noIndex || isHiddenByCleanup;

  const metadata: Metadata = {
    title: absoluteTitle ? { absolute: finalTitle } : finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: socialTitle,
      description: finalDescription,
      url: absoluteCanonical || baseUrl,
      siteName: siteName,
      images: [
        {
          url: ogImage || `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
      locale: 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: finalDescription,
      images: [ogImage || `${baseUrl}/og-image.jpg`],
      creator: '@imperialpedia',
      site: '@imperialpedia',
    },
    robots: {
      index: !effectiveNoIndex,
      follow: true,
      googleBot: {
        index: !effectiveNoIndex,
        follow: true,
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


