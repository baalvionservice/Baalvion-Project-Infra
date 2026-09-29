import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry } from '@/lib/i18n/countries';

type CollectionsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  return {
    title: 'Collections | Curated Luxury Houses & Editions',
    description:
      'Browse the curated collections of Amarisé Maison Avenue — iconic luxury houses, limited editions, and heritage capsules.',
    alternates: buildAlternates(cc, '/collections'),
    openGraph: {
      title: 'Collections | Amarisé Maison Avenue',
      description:
        'Curated luxury collections — iconic houses, limited editions, and heritage capsules.',
      type: 'website',
    },
  };
}

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  return children;
}
