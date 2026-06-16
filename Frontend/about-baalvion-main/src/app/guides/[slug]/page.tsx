import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { getGuide, getGuideSlugs, loadGuides } from '@/lib/guides';
import { BASE_URL, SITE_NAME, breadcrumbSchema, faqSchema, articleSchema } from '@/lib/schema';

export const revalidate = 3600;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getGuide(slug);
  if (!doc) return { title: 'Guide Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} — Baalvion trade guide.`;
  const url = `${BASE_URL}/guides/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Trade Guide')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = getGuide(slug);
  if (!doc) notFound();

  const related = loadGuides()
    .filter((g) => g.slug !== slug)
    .slice(0, 4)
    .map((g) => ({ label: g.title, href: `/guides/${g.slug}` }));

  const url = `/guides/${doc.slug}`;
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }, { name: doc.title, url }]),
    articleSchema({
      headline: doc.title,
      description: doc.excerpt,
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
        eyebrow="Trade Guide"
        crumbs={[{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }, { name: doc.title, url }]}
        related={{ title: 'More trade guides', links: related }}
        ctaTitle="Unify your trade operations"
        ctaText="Documentation, classification, compliance, and logistics fragmented across email, PDFs, and spreadsheets is the problem these guides describe. See how a unified Trade Operating System brings them into one connected record."
      />
      <Footer />
    </div>
  );
}
