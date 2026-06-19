import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Globe, ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { cmsGetArticle, cmsGetArticles, cmsGetRichDoc } from '@/lib/cms';
import { RichContent } from '@/components/rich-content';
import { PageFaq } from '@/components/page-faq';
import { JsonLd } from '@/components/json-ld';
import { breadcrumbSchema, faqSchema } from '@/lib/schema';
import { ArticleShare } from './article-share';

const BASE_URL = 'https://about.baalvion.com';
const SITE_NAME = 'Baalvion Operating System (BOS)';

// Incremental Static Regeneration: pages are statically generated and refreshed
// from the CMS at most once per hour.
export const dynamic = 'force-dynamic';

type Params = { category: string; slug: string };

function ogImageFor(title: string): string {
  return `${BASE_URL}/api/og?title=${encodeURIComponent(title)}&eyebrow=${encodeURIComponent('Baalvion News')}`;
}

// Pre-render the known article URLs at build time; new articles render on demand
// (dynamicParams defaults to true) and are then cached per `revalidate`.
// Paths that have their own explicit (non-dynamic) page and must not be
// prerendered by this dynamic route — otherwise they collide at the same output
// path during static generation.
const RESERVED_PATHS = new Set(['updates/today']);

export async function generateStaticParams(): Promise<Params[]> {
  const articles = await cmsGetArticles();
  return articles
    .filter((a) => a.category && a.slug)
    .filter((a) => !RESERVED_PATHS.has(`${a.category}/${a.slug}`))
    .map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await cmsGetArticle(slug);

  if (!article) {
    return { title: 'Brief Not Found', robots: { index: false, follow: true } };
  }

  const title = article.seo?.title || article.title;
  const description =
    article.seo?.description ||
    `${article.title} — strategic intelligence and analysis from Baalvion Industries.`;
  const url = `${BASE_URL}/news/${article.category}/${article.slug}`;
  const ogImage = article.seo?.ogImage || ogImageFor(article.title);

  return {
    title,
    description,
    keywords: article.seo?.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Technology & AI',
  insights: 'Insights',
  finance: 'Finance & Compliance',
  updates: 'Company Updates',
  company: 'Company',
  markets: 'Markets',
  sustainability: 'Sustainability',
  community: 'Community',
  reports: 'Reports',
};

export default async function ArticleDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [article, doc] = await Promise.all([cmsGetArticle(slug), cmsGetRichDoc(slug)]);

  if (!article) notFound();

  const moreNews = (await cmsGetArticles(article.category))
    .filter((a) => a.id !== article.id)
    .slice(0, 4);

  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;
  const articleUrl = `${BASE_URL}/news/${article.category}/${article.slug}`;
  const hasRichBody = !!doc && doc.blocks.length > 0;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.seo?.title || article.title,
    description: article.seo?.description,
    image: [article.image],
    datePublished: article.date,
    dateModified: article.date,
    author: [{ '@type': 'Person', name: article.author, url: 'https://baalvion.nexus' }],
    publisher: {
      '@type': 'Organization',
      name: 'Baalvion Industries',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  const schema: Record<string, unknown>[] = [
    articleJsonLd,
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'News', url: '/news' },
      { name: categoryLabel, url: `/news/${article.category}` },
      { name: article.title, url: `/news/${article.category}/${article.slug}` },
    ]),
  ];
  if (doc && doc.faqs.length > 0) schema.push(faqSchema(doc.faqs));

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={schema} />
      <Navbar />
      <main className="pt-48 pb-0">
        <div className="max-w-4xl mx-auto px-6 mb-24">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              <li><Link href="/news" className="hover:text-primary transition-colors">News</Link></li>
              <li className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /><Link href={`/news/${article.category}`} className="hover:text-primary transition-colors">{categoryLabel}</Link></li>
            </ol>
          </nav>

          {/* Main Headline */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight tracking-tight">
              {article.title}
            </h1>
            <p className="text-xl text-gray-500 font-medium">
              Baalvion Strategic Brief • {article.date}
            </p>
          </div>

          {/* Share Button */}
          <div className="flex justify-end mb-8">
            <ArticleShare />
          </div>

          {/* Author & Timestamp */}
          <div className="flex items-center justify-between py-8 border-y border-gray-100 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Globe className="text-white w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Strategic Intelligence by{' '}
                <span className="text-[#007185]">{article.author}</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Registry Date: {article.date}
              </p>
              <p className="text-xs text-gray-400 font-medium">{article.readTime}</p>
            </div>
          </div>

          {/* Article Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden mb-12 bg-gray-100">
            <Image src={article.image} alt={article.title} fill className="object-cover" priority />
          </div>

          {/* Article Content */}
          <div className="mb-16">
            {hasRichBody ? (
              <RichContent blocks={doc!.blocks} />
            ) : (
              <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                {article.content ||
                  'Content for this strategic brief is currently being synchronized with the Baalvion Operating System (BOS).'}
              </div>
            )}
          </div>

          {/* FAQ */}
          {doc && doc.faqs.length > 0 && <PageFaq faqs={doc.faqs} />}

          {/* Bottom Navigation */}
          <div className="mt-20 pt-10 border-t border-gray-100">
            <Button asChild variant="ghost" className="h-12 px-0 hover:bg-transparent text-primary font-bold group">
              <Link href={`/news/${article.category}`}>
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Intelligence Nexus
              </Link>
            </Button>
          </div>
        </div>

        {/* More News Section */}
        {moreNews.length > 0 && (
          <section className="bg-[#F2F2F2] py-20">
            <div className="max-w-[1200px] mx-auto px-6">
              <h2 className="text-xl font-bold text-[#111111] mb-8 uppercase tracking-widest">Related Intelligence</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {moreNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.category}/${news.slug}`} className="group bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-[#007185] transition-colors line-clamp-3">
                          {news.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">{news.date}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
