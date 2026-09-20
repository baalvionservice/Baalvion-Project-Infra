import type { Metadata } from 'next';
import { brandTitle, clampDescription } from '@/lib/seo/brand-title';
import { JsonLd, breadcrumbLd } from '@/lib/seo/json-ld';
import { getMergedSportsCompetitionBySlug } from '@/lib/sports-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getMergedSportsCompetitionBySlug(slug);
  const url = `${SITE}/sports/competitions/${slug}`;

  if (!competition) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: { absolute: brandTitle(competition.name) },
    description: clampDescription(competition.description),
    alternates: { canonical: url },
    robots: { index: competition.indexable !== false, follow: true },
    openGraph: { type: 'website', url, title: competition.name, description: competition.description },
    twitter: { card: 'summary', title: competition.name, description: competition.description },
  };
}

export default async function CompetitionLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const competition = await getMergedSportsCompetitionBySlug(slug);
  if (!competition) return <>{children}</>;
  const path = `/sports/competitions/${slug}`;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: competition.name,
          sport: competition.sport,
          description: competition.description,
          url: `${SITE}${path}`,
          startDate: competition.date || undefined,
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: 'Sports', path: '/sports' }, { name: 'Competitions', path: '/sports/competitions' }, { name: competition.name, path }])} />
      {children}
    </>
  );
}
