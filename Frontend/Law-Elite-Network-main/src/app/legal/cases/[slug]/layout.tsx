import type { Metadata } from 'next';
import { brandTitle } from '@/lib/seo/brand-title';
import { getMergedLegalCaseBySlug } from '@/lib/legal-server';
import { getPersonBySlug } from '@/data/people';
import { getCourtBySlug } from '@/data/courts';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const legalCase = await getMergedLegalCaseBySlug(slug);
  const url = `${SITE}/legal/cases/${slug}`;

  if (!legalCase) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  const title = legalCase.seo?.metaTitle || legalCase.caseName;
  const description = legalCase.seo?.metaDescription || legalCase.summary.slice(0, 200);

  return {
    title: { absolute: brandTitle(title) },
    description,
    keywords: [legalCase.caseName, 'legal case', 'law elite network legal'],
    alternates: { canonical: legalCase.seo?.canonicalPath ? `${SITE}${legalCase.seo.canonicalPath}` : url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary', title, description },
  };
}

export default async function LegalCaseLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const legalCase = await getMergedLegalCaseBySlug(slug);
  const url = `${SITE}/legal/cases/${slug}`;

  if (!legalCase) return <>{children}</>;

  const court = getCourtBySlug(legalCase.courtSlug);

  // schema.org has no dedicated "court case" type, and the closest-sounding
  // one (Legislation) means statutory law, not case law -- asserting it here
  // would be an incorrect structured-data claim. CreativeWork is the honest,
  // generically valid choice for a reference write-up about a real case.
  const caseLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: legalCase.caseName,
    url,
    description: legalCase.summary,
    spatialCoverage: legalCase.jurisdiction,
    datePublished: legalCase.importantDates[0]?.date || undefined,
    mentions: court ? [{ '@type': 'Organization', name: court.name, url: court.url }] : undefined,
    about: [...legalCase.parties, ...legalCase.lawyers, ...legalCase.judges].map((p) => {
      const person = p.personSlug ? getPersonBySlug(p.personSlug) : null;
      return {
        '@type': 'Person',
        name: person?.displayName || person?.fullName || p.name,
        url: person ? `${SITE}/people/${person.slug}` : undefined,
      };
    }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Legal Cases', item: `${SITE}/legal/cases` },
      { '@type': 'ListItem', position: 3, name: legalCase.caseName, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(caseLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
