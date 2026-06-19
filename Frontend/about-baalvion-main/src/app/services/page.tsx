import type { Metadata } from 'next';
import { cmsGetServices } from '@/lib/cms';
import { AuthorityIndex } from '@/components/authority-index';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema, collectionSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

const TITLE = 'Services | Enterprise Software Engineering | Baalvion';
const DESCRIPTION =
  'Baalvion engineering services: custom software, AI solutions, cloud, DevOps, automation, and enterprise platforms — the capabilities behind the Baalvion Operating System.';
const URL = `${BASE_URL}/services`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Baalvion Services')}&eyebrow=${encodeURIComponent('Engineering Capabilities')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default async function ServicesPage() {
  const services = await cmsGetServices();
  const items = services.map((s) => ({ title: s.title, excerpt: s.excerpt, href: `/services/${s.slug}`, tag: 'Service' }));
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }]),
    collectionSchema({ name: 'Baalvion Services', description: DESCRIPTION, url: URL, items: items.map((i) => ({ name: i.title, url: i.href })) }),
  ];
  return (
    <>
      <JsonLd data={schema} />
      <AuthorityIndex
        eyebrow="Engineering Capabilities"
        title="Services"
        intro="We build and operate large-scale enterprise software. These are the engineering capabilities behind the Baalvion Operating System — available to partners modernising, scaling, or automating their own platforms."
        items={items}
        emptyLabel="Services are being published to the CMS."
      />
    </>
  );
}
