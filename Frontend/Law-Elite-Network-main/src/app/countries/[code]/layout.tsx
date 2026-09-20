import type { Metadata } from 'next';
import { brandTitle } from '@/lib/seo/brand-title';
import { COUNTRIES } from '@/lib/countries';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> },
): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRIES.find((c) => c.code === code.toUpperCase());
  const url = `${SITE}/countries/${code.toLowerCase()}`;

  if (!country) {
    return { title: `${code} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  const title = country.name;
  const description = `People, cases, and coverage connected to ${country.name} on Law Elite Network.`;

  return {
    title: { absolute: brandTitle(title) },
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary', title, description },
  };
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
