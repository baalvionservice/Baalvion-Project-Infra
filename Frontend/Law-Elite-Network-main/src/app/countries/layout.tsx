import type { Metadata } from 'next';
import { getCountryArticleCounts } from '@/data/countries';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

/**
 * Indexed only once at least one country actually has real jurisdiction-
 * specific articles -- mirrors sitemap.ts's populatedCountries check and
 * ./[country]/layout.tsx's per-country version, so the directory, the
 * per-country pages, and the sitemap never disagree about what's indexable.
 * Same AdSense-safety idiom already used for empty A-Z glossary letters
 * (src/app/legal/[letter]/layout.tsx) -- thin/empty pages stay out of the
 * indexable surface until they have real content.
 */
export async function generateMetadata(): Promise<Metadata> {
  const counts = await getCountryArticleCounts();
  const hasPopulatedCountry = Object.values(counts).some((n) => n > 0);
  return {
    title: { absolute: 'Legal Guides by Country | Law Elite Network' },
    alternates: { canonical: `${SITE}/countries` },
    robots: { index: hasPopulatedCountry, follow: true },
  };
}

export default function CountriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
