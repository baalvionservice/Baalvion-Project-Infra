import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { cmsGetNews } from '@/lib/cms';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { BreakingTicker } from '@/components/knowledge/news/BreakingTicker';
import { NewsHero } from '@/components/knowledge/news/NewsHero';
import { TodayHighlights } from '@/components/knowledge/news/TodayHighlights';
import { Newsletter } from '@/components/knowledge/news/Newsletter';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const metadata: Metadata = {
  title: 'World',
  description: 'Cross-border legal news from Law Elite Network, covering the Americas, Europe, the Middle East & Africa, and Asia-Pacific.',
  alternates: { canonical: `${SITE}/world` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE}/world`,
    title: 'World | Law Elite Network',
    description: 'Cross-border legal news from Law Elite Network.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World | Law Elite Network',
    description: 'Cross-border legal news from Law Elite Network.',
  },
};

/**
 * /world — the network's global news hub (same lead/trending/highlights
 * pattern as /news, scoped to worldwide-audience content).
 */
export default async function WorldPage() {
  const news = await cmsGetNews(40);
  const lead = news[0];
  const rest = news.slice(1);
  const trending = rest.slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'World',
    description: 'Cross-border legal news from Law Elite Network.',
    url: `${SITE}/world`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'World', item: `${SITE}/world` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="pt-[60px] lg:pt-[96px]">
        {lead && <BreakingTicker articles={news} />}

        <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <span className="kicker">Global Coverage</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.02] mt-3">
              World
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-4">
              Cross-border legal news from every region we cover.
            </p>
          </div>
        </section>

        <main className="pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10 space-y-16">
            {lead ? (
              <>
                <NewsHero lead={lead} trending={trending} />
                <TodayHighlights articles={rest} />
              </>
            ) : (
              <div className="py-16 text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
                <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Global legal news is being added.
                </p>
              </div>
            )}

            <Newsletter />
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
