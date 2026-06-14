import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { cmsGetAboutPages, cmsGetRichDoc } from '@/lib/cms';
import { BASE_URL, SITE_NAME, breadcrumbSchema, faqSchema } from '@/lib/schema';

export const revalidate = 3600;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const pages = await cmsGetAboutPages();
  return pages.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc) return { title: 'Page Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} — Baalvion Industries.`;
  const url = `${BASE_URL}/about/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Baalvion Industries')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function AboutDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc || doc.kind !== 'company-about') notFound();

  const all = await cmsGetAboutPages();
  const related = all.filter((s) => s.slug !== slug).slice(0, 4).map((s) => ({ label: s.title, href: `/about/${s.slug}` }));

  const url = `/about/${doc.slug}`;
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }, { name: doc.title, url }]),
    ...(doc.faqs.length ? [faqSchema(doc.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={schema} />
      <Navbar />
      <AuthorityDoc
        doc={doc}
        eyebrow="About Baalvion"
        crumbs={[{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }, { name: doc.title, url }]}
        related={{ title: 'More about Baalvion', links: related }}
        ctaTitle="Work with Baalvion"
      />
      <Footer />
    </div>
  );
}
