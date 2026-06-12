/**
 * Per-page metadata builder for the institutional IR routes. Reads the SEO
 * envelope from the canonical page definition (src/lib/ir-pages.ts) so titles,
 * descriptions, canonicals and Open Graph tags stay in one place and in sync
 * with what is seeded into the CMS.
 */
import type { Metadata } from 'next';
import { AppConfig } from '@/config';
import { getIrPage } from '@/lib/ir-pages';

const ORIGIN = AppConfig.baseUrl.replace(/\/$/, '');

export function irMetadata(slug: string): Metadata {
  const pageDef = getIrPage(slug);
  const seo = pageDef?.seo;
  const title = seo?.title ?? pageDef?.title ?? 'Investor Relations | Baalvion';
  const description =
    seo?.description ??
    pageDef?.description ??
    'Investor relations for Baalvion — the AI-native operating system for global B2B trade.';
  const url = `${ORIGIN}${slug}`;

  return {
    // Absolute bypasses the root layout's "%s | Baalvion" template — our SEO
    // titles already carry the brand suffix, so this avoids "… | Baalvion | Baalvion".
    title: { absolute: title },
    description,
    keywords: seo?.keywords,
    alternates: { canonical: slug },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Baalvion Investor Relations',
      locale: 'en_US',
      images: [
        {
          url: `${ORIGIN}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@baalvion',
    },
    robots: { index: true, follow: true },
  };
}
