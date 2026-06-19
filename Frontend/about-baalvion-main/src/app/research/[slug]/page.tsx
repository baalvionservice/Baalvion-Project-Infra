import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { getResearch, getResearchSlugs, loadResearch } from '@/lib/research';
import { BASE_URL, SITE_NAME, articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';

export const revalidate = 3600;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getResearchSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getResearch(slug);
  if (!doc) return { title: 'Research Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion Research`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} — research from Baalvion.`;
  const url = `${BASE_URL}/research/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Baalvion Research')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: doc.seo?.canonical || url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function ResearchDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = getResearch(slug);
  if (!doc) notFound();

  const related = loadResearch()
    .filter((d) => d.slug !== slug)
    .slice(0, 4)
    .map((d) => ({ label: d.title, href: `/research/${d.slug}` }));

  const url = `/research/${doc.slug}`;
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Research', url: '/research' }, { name: doc.title, url }]),
    articleSchema({
      headline: doc.seo?.title || doc.title,
      description: doc.seo?.description || doc.excerpt,
      url,
      author: doc.author,
      datePublished: doc.createdAt,
      dateModified: doc.updatedAt,
    }),
    ...(doc.faqs.length ? [faqSchema(doc.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={schema} />
      <Navbar />
      <AuthorityDoc
        doc={doc}
        eyebrow={doc.readTime ? `Research · ${doc.readTime}` : 'Research'}
        crumbs={[{ name: 'Home', url: '/' }, { name: 'Research', url: '/research' }, { name: doc.title, url }]}
        related={{ title: 'Related research', links: related }}
        ctaTitle="Explore the Trade Operating System"
        ctaText="See how the reference architecture described here maps to a working platform unifying documentation, compliance, logistics, finance, and payments."
      />
      <Footer />
    </div>
  );
}
