import type { Metadata } from 'next';
import { brandTitle, clampDescription } from '@/lib/seo/brand-title';
import { JsonLd, breadcrumbLd } from '@/lib/seo/json-ld';
import { getMergedSportsTeamBySlug } from '@/lib/sports-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const team = await getMergedSportsTeamBySlug(slug);
  const url = `${SITE}/sports/teams/${slug}`;

  if (!team) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: { absolute: brandTitle(`${team.name} — Team Profile`) },
    description: clampDescription(team.description),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title: team.name, description: team.description },
    twitter: { card: 'summary', title: team.name, description: team.description },
  };
}

export default async function TeamLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const team = await getMergedSportsTeamBySlug(slug);
  if (!team) return <>{children}</>;
  const path = `/sports/teams/${slug}`;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsTeam',
          name: team.name,
          sport: team.sport,
          description: team.description,
          url: `${SITE}${path}`,
          sameAs: team.url ? [team.url] : undefined,
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: 'Sports', path: '/sports' }, { name: 'Teams', path: '/sports/teams' }, { name: team.name, path }])} />
      {children}
    </>
  );
}
