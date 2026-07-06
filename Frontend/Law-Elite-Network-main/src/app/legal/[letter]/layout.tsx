import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(
  { params }: { params: Promise<{ letter: string }> },
): Promise<Metadata> {
  const { letter } = await params;
  const upper = letter.toUpperCase();
  const url = `${SITE}/legal/${letter.toLowerCase()}`;
  const title = `Legal Terms Starting With "${upper}" — Glossary | Law Elite Network`;
  const description = `Browse expert-verified legal terms, definitions, and guides beginning with the letter ${upper} in the Law Elite Network legal glossary — covering business, criminal, family, tax, employment, and property law.`;

  return {
    title,
    description,
    keywords: [`legal terms ${upper}`, `law glossary ${upper}`, 'legal dictionary', 'legal definitions'],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function LegalLetterLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ letter: string }> },
) {
  const { letter } = await params;
  const upper = letter.toUpperCase();
  const url = `${SITE}/legal/${letter.toLowerCase()}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Legal Terms Starting With "${upper}"`,
    description: `Legal glossary entries beginning with the letter ${upper} on Law Elite Network.`,
    url,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Legal Glossary', item: `${SITE}/legal` },
      { '@type': 'ListItem', position: 3, name: upper, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
