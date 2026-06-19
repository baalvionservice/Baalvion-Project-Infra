import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { getInsight, getInsightSlugs, loadInsights } from '@/lib/insights';
import { BASE_URL, SITE_NAME, articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';

export const revalidate = 3600;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getInsightSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getInsight(slug);
  if (!doc) return { title: 'Insight Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion Insights`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} — research from Baalvion.`;
  const url = `${BASE_URL}/insights/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Baalvion Insights')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: doc.seo?.canonical || url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function InsightDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = getInsight(slug);
  if (!doc) notFound();

  const related = loadInsights()
    .filter((d) => d.slug !== slug)
    .slice(0, 4)
    .map((d) => ({ label: d.title, href: `/insights/${d.slug}` }));

  const url = `/insights/${doc.slug}`;
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights' }, { name: doc.title, url }]),
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
        eyebrow={doc.readTime ? `Insight · ${doc.readTime}` : 'Insight'}
        crumbs={[{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights' }, { name: doc.title, url }]}
        related={{ title: 'Related research', links: related }}
        ctaTitle="Go deeper on the Trade Operating System"
        ctaText="See how Baalvion unifies documentation, compliance, customs, logistics, and finance into one connected system of record."
      />
      <Footer />
    </div>
  );
}
