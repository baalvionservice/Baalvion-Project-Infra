import type { Metadata } from 'next';
import { loadInsights } from '@/lib/insights';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

export const revalidate = 3600;

const TITLE = 'Insights | Baalvion';
const DESCRIPTION =
  'Research-grade insights on the structural problems of global trade — documentation, compliance, logistics, and the economics of an industry still run on email, PDFs, and spreadsheets.';
const URL = `${BASE_URL}/insights`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Insights')}&eyebrow=${encodeURIComponent('Baalvion Research')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function InsightsPage() {
  const docs = loadInsights();
  const items = docs.map((d) => ({ title: d.title, excerpt: d.excerpt, href: `/insights/${d.slug}`, tag: 'Insight' }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights' }]),
    collectionSchema({ name: 'Insights', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Research & Insights"
        title="Insights"
        intro="Problem-awareness research on why cross-border trade still runs on unstructured documents — and what a unified Trade Operating System changes about cost, speed, and risk."
        items={items}
        emptyLabel="Insights are being published."
      />
    </>
  );
}
