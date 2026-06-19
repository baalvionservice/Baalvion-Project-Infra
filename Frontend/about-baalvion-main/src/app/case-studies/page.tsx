import type { Metadata } from 'next';
import { cmsGetCaseStudies } from '@/lib/cms';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

const TITLE = 'Case Studies | Baalvion';
const DESCRIPTION =
  'How Baalvion delivers measurable outcomes — real-world platform builds across trade, finance, compliance, logistics, and commerce on the Baalvion Operating System.';
const URL = `${BASE_URL}/case-studies`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Case Studies')}&eyebrow=${encodeURIComponent('Baalvion')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default async function CaseStudiesPage() {
  const studies = await cmsGetCaseStudies();
  const items = studies.map((s) => ({ title: s.title, excerpt: s.excerpt, href: `/case-studies/${s.slug}`, tag: s.custom?.sector || 'Case Study' }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Case Studies', url: '/case-studies' }]),
    collectionSchema({ name: 'Case Studies', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Proof of Work"
        title="Case Studies"
        intro="Selected engagements that show how the Baalvion Operating System turns fragmented operations into unified, auditable, real-time platforms — with the outcomes to match."
        items={items}
        emptyLabel="Case studies are being published to the CMS."
      />
    </>
  );
}
