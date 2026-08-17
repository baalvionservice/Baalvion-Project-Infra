import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AdvertiseToc } from '@/components/knowledge/AdvertiseToc';
import Link from 'next/link';
import { fetchPublicApi } from '@/lib/api/public-fetch';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { getMergedAuthors } from '@/lib/authors-server';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

// Server component so the platform-overview stats below are computed from
// the same real data sources the homepage uses, instead of the hardcoded
// "72+ / 8 / 11" figures this page shipped with (8 practice areas was stale
// the moment the network grew to 16). The only client-side bit -- the
// collapsible table of contents -- is split out into AdvertiseToc.tsx.
export const revalidate = 300;

// Only the two sections this page actually has content for. The previous
// version listed 7 anchors ("Content Integration", "Network Intelligence
// Ads", "Brand Integrity Standards", "Case Studies", "Request Media Kit")
// that pointed at sections which were never built -- dead in-page links.
const TOC_LINKS = [
  { label: 'Platform Overview', id: 'audience' },
  { label: 'B2B Partnership Tiers', id: 'partnerships' },
];

export default async function AdvertisePage() {
  const [cmsArticles, apiArticles, editorialBoard] = await Promise.all([
    cmsGetArticles().catch(() => []),
    fetchPublicApi('/articles', { limit: 200, status: 'published' })
      .then((j) => {
        const items = j?.data?.items || j?.data || [];
        return Array.isArray(items) ? items : [];
      })
      .catch(() => []),
    getMergedAuthors().catch(() => []),
  ]);

  const seenSlugs = new Set<string>();
  const combinedSource = [...cmsArticles, ...apiArticles].filter((a: any) => {
    if (!a?.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });
  const guidesCount = mergeArticles(combinedSource).length;
  const practiceAreaCount = CURRENT_CATEGORY_SLUGS.length;
  const contributorCount = editorialBoard.length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              Advertise
            </h1>

            <AdvertiseToc links={TOC_LINKS} />
          </header>

          <section className="space-y-20">
            <div id="audience" className="space-y-6">
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">{guidesCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Published Legal Guides</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">{practiceAreaCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Practice Area Verticals</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">{contributorCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contributing Authors</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 max-w-2xl">
                Every guide is written and attributed to a named contributor across our practice areas, giving
                advertisers a brand-safe, subject-matter-relevant context rather than generic traffic.
              </p>
            </div>

            <div id="partnerships" className="space-y-8">
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">B2B Partnership Tiers</h2>
              <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-bold italic font-serif">Elite Network Sponsorship</h3>
                  <p className="text-slate-400 leading-relaxed italic">Align your brand with high-intent legal-education content and readers researching real questions.</p>
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all"
                  >
                    Request Partnership Details
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
