import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthorityDoc } from '@/components/authority-doc';
import { JsonLd } from '@/components/json-ld';
import { cmsGetCaseStudies, cmsGetRichDoc } from '@/lib/cms';
import { BASE_URL, SITE_NAME, ORG_NAME, breadcrumbSchema, faqSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const studies = await cmsGetCaseStudies();
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc) return { title: 'Case Study Not Found', robots: { index: false, follow: true } };
  const title = doc.seo?.title || `${doc.title} | Baalvion Case Study`;
  const description = doc.seo?.description || doc.excerpt || `${doc.title} — a Baalvion case study.`;
  const url = `${BASE_URL}/case-studies/${doc.slug}`;
  const og = doc.seo?.ogImage || `${BASE_URL}/api/og?title=${encodeURIComponent(doc.title)}&eyebrow=${encodeURIComponent('Baalvion Case Study')}`;
  return {
    title,
    description,
    keywords: doc.seo?.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description, url, siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630, alt: doc.title }], locale: 'en_US' },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = await cmsGetRichDoc(slug);
  if (!doc || doc.kind !== 'case_study') notFound();

  const all = await cmsGetCaseStudies();
  const related = all.filter((s) => s.slug !== slug).slice(0, 4).map((s) => ({ label: s.title, href: `/case-studies/${s.slug}` }));

  const url = `/case-studies/${doc.slug}`;
  const caseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.seo?.title || doc.title,
    description: doc.seo?.description || doc.excerpt,
    datePublished: doc.createdAt,
    dateModified: doc.updatedAt,
    author: [{ '@type': 'Organization', name: ORG_NAME, url: BASE_URL }],
    publisher: { '@type': 'Organization', name: ORG_NAME, url: BASE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}${url}` },
  };
  const schema = [
    breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Case Studies', url: '/case-studies' }, { name: doc.title, url }]),
    caseSchema,
    ...(doc.faqs.length ? [faqSchema(doc.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={schema} />
      <Navbar />
      <AuthorityDoc
        doc={doc}
        eyebrow={doc.custom?.sector ? `Case Study · ${doc.custom.sector}` : 'Case Study'}
        crumbs={[{ name: 'Home', url: '/' }, { name: 'Case Studies', url: '/case-studies' }, { name: doc.title, url }]}
        related={{ title: 'More case studies', links: related }}
        ctaTitle="Achieve outcomes like these"
      />
      <Footer />
    </div>
  );
}
