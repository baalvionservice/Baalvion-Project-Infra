import type { Metadata } from 'next';
import { loadGuides } from '@/lib/guides';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

// Guides are sourced from committed Markdown, parsed at build time. Force fully
// static output so no serverless fs read happens at runtime (ISR regeneration on
// Vercel would not have the content-gen/ files traced into the lambda). Content
// updates ship via redeploy, which is correct for evergreen reference content.
export const dynamic = 'force-static';

const TITLE = 'Trade Guides | Baalvion';
const DESCRIPTION =
  'Educational reference guides on the fundamentals of global trade — HS classification, freight forwarding, customs brokerage, export documentation, and export compliance.';
const URL = `${BASE_URL}/guides`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Trade Guides')}&eyebrow=${encodeURIComponent('Baalvion')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function GuidesPage() {
  const guides = loadGuides();
  const items = guides.map((g) => ({
    title: g.title,
    excerpt: g.excerpt,
    href: `/guides/${g.slug}`,
    tag: 'Trade Guide',
  }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }]),
    collectionSchema({ name: 'Trade Guides', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Global Trade Fundamentals"
        title="Trade Guides"
        intro="Plain-language, research-grade reference material on how global trade actually works — written for first-time exporters, SMEs, manufacturers, freight and customs professionals, and students of international trade."
        items={items}
        emptyLabel="Guides are being published."
      />
    </>
  );
}
