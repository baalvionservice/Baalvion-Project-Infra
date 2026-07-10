import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { cmsGetNews } from '@/lib/cms';
import { getRegions } from '@/lib/regions';
import { getCountries } from '@/services/lawyers/lawyerService';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { BreakingTicker } from '@/components/knowledge/news/BreakingTicker';
import { NewsHero } from '@/components/knowledge/news/NewsHero';
import { TodayHighlights } from '@/components/knowledge/news/TodayHighlights';
import { Newsletter } from '@/components/knowledge/news/Newsletter';
import { JurisdictionDirectory } from '@/components/knowledge/world/JurisdictionDirectory';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const metadata: Metadata = {
  title: 'World',
  description:
    'Global legal news and a jurisdiction-by-jurisdiction directory of Law Elite Network practitioners across the Americas, Europe, the Middle East & Africa, and Asia-Pacific.',
  alternates: { canonical: `${SITE}/world` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE}/world`,
    title: 'World | Law Elite Network',
    description: 'Global legal news and a jurisdiction-by-jurisdiction lawyer directory.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World | Law Elite Network',
    description: 'Global legal news and a jurisdiction-by-jurisdiction lawyer directory.',
  },
};

const REGION_QUICK_LINKS = [
  { id: 'americas', label: 'Americas' },
  { id: 'europe', label: 'Europe' },
  { id: 'mea', label: 'Middle East & Africa' },
  { id: 'apac', label: 'Asia-Pacific' },
] as const;

/**
 * /world — the network's global hub. Top half is a CNBC-style news feed
 * (same lead/trending/highlights pattern as /news, scoped to the same
 * worldwide-audience content); bottom half is a real jurisdiction directory
 * so "World" resolves to something a visitor can actually act on: find a
 * lawyer in a given country.
 */
export default async function WorldPage() {
  const news = await cmsGetNews(40);
  const lead = news[0];
  const rest = news.slice(1);
  const trending = rest.slice(0, 8);

  const regions = getRegions();
  let countryCounts: { country: string; countryCode: string; count: number }[] = [];
  try {
    countryCounts = await getCountries();
  } catch {
    // Directory still renders without count badges.
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'World',
    description: 'Global legal news and a jurisdiction-by-jurisdiction lawyer directory from Law Elite Network.',
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

      {lead && <BreakingTicker articles={news} />}

      <div className="pt-[60px] lg:pt-[96px]">
        <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <span className="kicker">Global Coverage</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.02] mt-3">
              World
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-4">
              Cross-border legal news, and a live directory of the network&rsquo;s practitioners across every
              region we cover.
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2.5">
                <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-news-600 pr-3 mr-1 border-r border-slate-300 dark:border-slate-700">
                  <Globe className="w-3.5 h-3.5" /> Regions
                </span>
                {REGION_QUICK_LINKS.map((region) => (
                  <a
                    key={region.id}
                    href={`#region-${region.id}`}
                    className="shrink-0 px-3 py-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-news-600 whitespace-nowrap transition-colors"
                  >
                    {region.label}
                  </a>
                ))}
              </div>
            </div>
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
                  Global legal news is being added. In the meantime, browse the jurisdiction directory below.
                </p>
              </div>
            )}

            <JurisdictionDirectory regions={regions} counts={countryCounts} />

            <Newsletter />
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
