import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { cmsGetServices, cmsGetRichDoc } from '@/lib/cms';
import { BASE_URL, SITE_NAME, breadcrumbSchema, faqSchema, serviceSchema } from '@/lib/schema';

export const revalidate = 3600;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const services = await cmsGetServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc) return { title: 'Service Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} from Baalvion Industries.`;
  const url = `${BASE_URL}/services/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Baalvion Services')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc || doc.kind !== 'service') notFound();

  const all = await cmsGetServices();
  const related = all.filter((s) => s.slug !== slug).slice(0, 4).map((s) => ({ label: s.title, href: `/services/${s.slug}` }));

  const url = `/services/${doc.slug}`;
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: doc.title, url }]),
    serviceSchema({ name: doc.title, description: doc.seo?.description || doc.excerpt || doc.title, url, serviceType: doc.title }),
    ...(doc.faqs.length ? [faqSchema(doc.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={schema} />
      <Navbar />
      <AuthorityDoc
        doc={doc}
        eyebrow="Baalvion Services"
        crumbs={[{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: doc.title, url }]}
        related={{ title: 'More services', links: related }}
        ctaTitle={`Talk to us about ${doc.title}`}
      />
      <Footer />
    </div>
  );
}
