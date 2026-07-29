import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { cmsGetNews, cmsGetNewsPage, type CmsArticle } from '@/lib/cms';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { BreakingTicker } from '@/components/knowledge/news/BreakingTicker';
import { NewsHero } from '@/components/knowledge/news/NewsHero';
import { CategorySection } from '@/components/knowledge/news/CategorySection';
import { TodayHighlights } from '@/components/knowledge/news/TodayHighlights';
import { VideoCarousel } from '@/components/knowledge/news/VideoCarousel';
import { LatestFeed } from '@/components/knowledge/news/LatestFeed';
import { Sidebar } from '@/components/knowledge/news/Sidebar';
import { Newsletter } from '@/components/knowledge/news/Newsletter';
import { articleUrl } from '@/lib/article-url';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const FEED_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: 'Legal News | Law Elite Network',
  description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network — clear, worldwide coverage written for a general audience.',
  alternates: { canonical: `${SITE}/news` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/news`, title: 'Legal News | Law Elite Network', description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.' },
  twitter: { card: 'summary_large_image', title: 'Legal News | Law Elite Network', description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.' },
};

/** Groups news articles by practice-area category, richest categories first. */
function groupByCategory(articles: CmsArticle[]): Array<{ name: string; slug: string; articles: CmsArticle[] }> {
  const groups = new Map<string, { name: string; slug: string; articles: CmsArticle[] }>();
  for (const article of articles) {
    const slug = article.category?.slug;
    if (!slug) continue;
    const group = groups.get(slug) ?? { name: article.category!.name, slug, articles: [] };
    group.articles.push(article);
    groups.set(slug, group);
  }
  return [...groups.values()].sort((a, b) => b.articles.length - a.articles.length);
}

/**
 * /news — CMS-first legal news hub. Reads content published with
 * contentType: 'news' in the central CMS (admin.baalvion.com); no bundled
 * fallback array exists yet, so an empty result renders an honest empty state
 * rather than fabricated headlines.
 */
export default async function NewsPage() {
  const news = await cmsGetNews(60);
  const lead = news[0];
  const rest = news.slice(1);
  const trending = rest.slice(0, 12);
  const categorySections = groupByCategory(rest).slice(0, 6);

  let initialFeed = rest;
  let initialHasMore = false;
  try {
    const { items, hasMore } = await cmsGetNewsPage(1, FEED_PAGE_SIZE);
    if (items.length) {
      initialFeed = items;
      initialHasMore = hasMore;
    }
  } catch {
    // keep the fallback slice
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legal News',
    description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.',
    url: `${SITE}/news`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: news.slice(0, 25).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: a.title,
        url: `${SITE}${articleUrl(a)}`,
      })),
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${SITE}/news` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {lead && <BreakingTicker articles={news} />}

      <div className="pt-[60px] lg:pt-[96px]">
        <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <span className="kicker">Newsroom</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.02] mt-3">
              Legal News
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-4">
              Breaking legal news, regulatory updates, and expert analysis — worldwide coverage written for a
              general audience.
            </p>
          </div>
        </section>

        <main className="pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10 space-y-16">
            {lead ? (
              <>
                <NewsHero lead={lead} trending={trending} />

                {categorySections.map((group) => (
                  <CategorySection key={group.slug} name={group.name} slug={group.slug} articles={group.articles} />
                ))}

                <TodayHighlights articles={rest} />

                <VideoCarousel articles={news} />

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="section-rule">
                      <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
                      <h2>Latest News</h2>
                    </div>
                    <LatestFeed initialArticles={initialFeed} initialHasMore={initialHasMore} />
                  </div>
                  <Sidebar articles={news} />
                </section>

                <Newsletter />
              </>
            ) : (
              <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
                <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="space-y-1.5">
                  <h4 className="font-headline text-xl font-bold text-slate-900 dark:text-white">No news yet</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    We haven&rsquo;t published any news stories yet. Check back soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
