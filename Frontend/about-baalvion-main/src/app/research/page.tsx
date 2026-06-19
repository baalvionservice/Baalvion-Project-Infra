import type { Metadata } from 'next';
import { loadResearch } from '@/lib/research';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

const TITLE = 'Research | Baalvion';
const DESCRIPTION =
  'Category-defining research on the Trade Operating System — the unified data layer, processes, and network that replace fragmented trade software and paper-based workflows.';
const URL = `${BASE_URL}/research`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Research')}&eyebrow=${encodeURIComponent('Baalvion')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function ResearchPage() {
  const docs = loadResearch();
  const items = docs.map((d) => ({ title: d.title, excerpt: d.excerpt, href: `/research/${d.slug}`, tag: 'Research' }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Research', url: '/research' }]),
    collectionSchema({ name: 'Research', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Category Research"
        title="Research"
        intro="First-principles research defining the Global Trade Operating System category — the reference architecture, design principles, and maturity model behind unified trade infrastructure."
        items={items}
        emptyLabel="Research is being published."
      />
    </>
  );
}
