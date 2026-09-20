import type { Metadata } from 'next';
import { brandTitle, clampDescription } from '@/lib/seo/brand-title';
import { JsonLd, breadcrumbLd } from '@/lib/seo/json-ld';
import { getMergedCourtBySlug } from '@/lib/legal-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const court = await getMergedCourtBySlug(slug);
  const url = `${SITE}/legal/courts/${slug}`;

  if (!court) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: { absolute: brandTitle(court.name) },
    description: clampDescription(court.description),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title: court.name, description: court.description },
    twitter: { card: 'summary', title: court.name, description: court.description },
  };
}

export default async function CourtLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const court = await getMergedCourtBySlug(slug);
  if (!court) return <>{children}</>;
  const path = `/legal/courts/${slug}`;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'GovernmentOrganization',
          name: court.name,
          description: court.description,
          url: court.url || `${SITE}${path}`,
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: 'Legal', path: '/legal/cases' }, { name: 'Courts', path: '/legal/courts' }, { name: court.name, path }])} />
      {children}
    </>
  );
}
