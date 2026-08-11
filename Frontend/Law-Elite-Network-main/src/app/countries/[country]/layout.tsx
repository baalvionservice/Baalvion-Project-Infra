import type { Metadata } from 'next';
import { getCountryBySlug, getArticlesByCountrySlug } from '@/data/countries';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

/**
 * Indexed only once a country actually has at least one jurisdiction-specific
 * article -- an empty (or overview-only) hub is a thin/near-duplicate page for
 * crawlers, not a real destination. Mirrors sitemap.ts's populatedCountries
 * filter so the sitemap and the page's own robots tag never disagree. Flip a
 * country to indexed automatically the moment getArticlesByCountrySlug finds
 * real content for it -- no manual allowlist to maintain here.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ country: string }> },
): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return { robots: { index: false, follow: false } };
  const articles = await getArticlesByCountrySlug(countrySlug);
  return {
    title: { absolute: `${country.name} Legal Guides | Law Elite Network` },
    alternates: { canonical: `${SITE}/countries/${countrySlug}` },
    robots: { index: articles.length > 0, follow: true },
  };
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
