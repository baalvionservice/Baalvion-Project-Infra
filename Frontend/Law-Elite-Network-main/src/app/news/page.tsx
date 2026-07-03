import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { cmsGetNews } from '@/lib/cms';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { PublicFooter } from '@/components/knowledge/PublicFooter';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const metadata: Metadata = {
  title: 'Legal News | Law Elite Network',
  description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network — clear, worldwide coverage written for a general audience.',
  alternates: { canonical: `${SITE}/news` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/news`, title: 'Legal News | Law Elite Network', description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.' },
  twitter: { card: 'summary_large_image', title: 'Legal News | Law Elite Network', description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.' },
};

/**
 * /news — CMS-first legal news hub. Reads content published with
 * contentType: 'news' in the central CMS (admin.baalvion.com); no bundled
 * fallback array exists yet, so an empty result renders an honest empty state
 * rather than fabricated headlines.
 */
export default async function NewsPage() {
  const news = await cmsGetNews(50);
  const lead = news[0];
  const rest = news.slice(1);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legal News',
    description: 'Breaking legal news, regulatory updates, and analysis from Law Elite Network.',
    url: `${SITE}/news`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
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
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
          <span className="kicker">Newsroom</span>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
            Legal News
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
            Breaking legal news, regulatory updates, and expert analysis — worldwide coverage written for a
            general audience.
          </p>
        </div>
      </section>

      <main className="pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          {lead ? (
            <>
              <StoryCard article={lead} variant="lead" priority />

              {rest.length > 0 && (
                <div className="mt-14">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-8">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
                      <h2 className="font-headline text-xl md:text-2xl font-extrabold text-slate-900 m-0">
                        More News
                      </h2>
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                      {rest.length} {rest.length === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
                    {rest.map((article) => (
                      <StoryCard key={article.id || article.slug} article={article} variant="default" />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="font-headline text-xl font-bold text-slate-900">No news yet</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  We haven&rsquo;t published any news stories yet. Check back soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
