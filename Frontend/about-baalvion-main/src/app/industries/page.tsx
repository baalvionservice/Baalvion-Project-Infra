import type { Metadata } from 'next';
import { cmsGetIndustries } from '@/lib/cms';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

export const revalidate = 3600;

const TITLE = 'Industries We Serve | Baalvion';
const DESCRIPTION =
  'How Baalvion applies infrastructure-grade engineering across healthcare, finance, manufacturing, retail, logistics, education, real estate, and SaaS.';
const URL = `${BASE_URL}/industries`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Industries')}&eyebrow=${encodeURIComponent('Baalvion')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default async function IndustriesPage() {
  const industries = await cmsGetIndustries();
  const items = industries.map((s) => ({ title: s.title, excerpt: s.excerpt, href: `/industries/${s.slug}`, tag: 'Industry' }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Industries', url: '/industries' }]),
    collectionSchema({ name: 'Industries', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Sectors"
        title="Industries"
        intro="The Baalvion Operating System is built for regulated, high-scale industries. Explore how our engineering and platform capabilities map to the realities of each sector."
        items={items}
        emptyLabel="Industry pages are being published to the CMS."
      />
    </>
  );
}
