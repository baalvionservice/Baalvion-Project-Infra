import type { Metadata } from 'next';
import { getCountryBySlug } from '@/data/countries';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

/**
 * Noindexed for the same reason as the /countries index (see that layout) --
 * no article carries country metadata yet, so every one of these pages is
 * genuinely empty today.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ country: string }> },
): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return { robots: { index: false, follow: false } };
  return {
    title: { absolute: `${country.name} Legal Guides | Law Elite Network` },
    alternates: { canonical: `${SITE}/countries/${countrySlug}` },
    robots: { index: false, follow: true },
  };
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
