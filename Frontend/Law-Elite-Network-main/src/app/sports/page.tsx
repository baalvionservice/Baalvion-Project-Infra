import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PersonCard } from '@/components/people/PersonCard';
import { getPeopleByCategory } from '@/data/people';
import { getMergedSportsTeams, getMergedSportsCompetitions } from '@/lib/sports-server';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { cmsGetArticles } from '@/lib/cms';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { AdSlot } from '@/components/ads/AdSlot';
import { LatestStoriesFeed } from '@/components/newsfeed/LatestStoriesFeed';
import { getArticlesMentioningPersonCategory } from '@/lib/newsfeed/entity-category-articles';
import {
  YELLOW,
  dateVal,
  LeadStory,
  SideStory,
  Section,
  LatestBanner,
  TrendingNow,
  MostRead,
} from '@/components/newsfeed/TabloidHubWidgets';

export const revalidate = 86400;

// Same AdSense slot as SIDEBAR_AD_SLOT_ID in entertainment/page.tsx -- one
// AdSense slot ID is reused across placements site-wide (see AD_PLACEMENTS in
// AdManager.tsx; not imported directly because that file is 'use client' and
// its export doesn't survive an import into this server component).
const SIDEBAR_AD_SLOT_ID = '4123514154';

const CATEGORY_SLUG = 'sports';

export default async function SportsHubPage() {
  const athletes = getPeopleByCategory('athletes');
  const [teams, competitions, cmsArticles, entityTaggedArticles] = await Promise.all([
    getMergedSportsTeams(),
    getMergedSportsCompetitions(),
    cmsGetArticles(undefined, CATEGORY_SLUG).catch(() => [] as any[]),
    // Real athlete profiles (Ronaldo, Messi, LeBron, ...) filed under a
    // different CMS category (celebrity-news is their primary placement on
    // /entertainment) still belong here -- found by what the article
    // actually names, not by an editor picking the right category/subcategory
    // for a second time. See entity-category-articles.ts.
    getArticlesMentioningPersonCategory(['athletes']).catch(() => [] as any[]),
  ]);

  // Sports has one CMS category (no dedicated /football, /basketball hubs
  // the way entertainment has /movies, /music, ...), so the news feed groups
  // by subcategory (League Governance, Olympic Arbitration, ...) instead of
  // a fixed SECTIONS list -- it stays correct as new subcategories get added
  // rather than needing a code change to appear.
  const seen = new Set<string>();
  const raw = [...cmsArticles, ...getArticlesByCategorySlug(CATEGORY_SLUG), ...entityTaggedArticles]
    .map((a: any) => ({ ...a, summary: a.summary ?? a.excerpt }))
    .filter((a) => {
      if (!a?.slug || seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    });

  const groupMap = new Map<string, { label: string; articles: any[] }>();
  for (const a of raw) {
    const label = a.subcategory?.name || 'Sports News';
    if (!groupMap.has(label)) groupMap.set(label, { label, articles: [] });
    groupMap.get(label)!.articles.push(a);
  }
  const groups = [...groupMap.values()]
    .map((g) => ({ ...g, articles: g.articles.sort((a, b) => dateVal(b) - dateVal(a)) }))
    .sort((a, b) => dateVal(b.articles[0]) - dateVal(a.articles[0]));

  const all = groups.flatMap((g) => g.articles);
  const byViews = [...all].sort((a, b) => (b.views || 0) - (a.views || 0));
  const popular = byViews.slice(0, 5);
  const trending = byViews.slice(5, 10);
  const [top, ...others] = all;
  const topSide = others.slice(0, 2);
  const usedTop = new Set([top, ...topSide].filter(Boolean).map((a: any) => a.slug));
  const sections = groups
    .map((g) => ({ ...g, articles: g.articles.filter((a: any) => !usedTop.has(a.slug)) }))
    .filter((g) => g.articles.length > 0);

  // Full real pool, not just what's left after the hero/sections above pick
  // their stories -- see the identical note in entertainment/page.tsx.
  const latest = [...all].sort((a, b) => dateVal(b) - dateVal(a));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-[1080px] px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h1 className="font-headline font-black italic uppercase tracking-[-0.05em] leading-none text-black text-[34px] sm:text-[52px] md:text-[68px]">
                Sports
              </h1>
              <div className="h-[10px] w-full mt-1" style={{ background: YELLOW }} />

              {top && (
                <div className="mt-4 grid gap-x-6 md:grid-cols-[minmax(0,1.82fr)_1px_minmax(0,1fr)]">
                  <LeadStory a={top} headSize="text-[32px] md:text-[36px]" />
                  {topSide.length > 0 && (
                    <>
                      <div className="hidden md:block bg-neutral-700" aria-hidden />
                      <div className="mt-8 md:mt-0">
                        {topSide.map((a, i) => (
                          <SideStory key={a.slug} a={a} last={i === topSide.length - 1} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {sections.map((g, i) => (
                // No `moreHref` -- unlike entertainment's categories, these
                // subcategory groups have no dedicated route to link to yet.
                <Section key={g.label} label={g.label} articles={g.articles} leadSide={i % 2 === 0 ? 'left' : 'right'} />
              ))}

              {latest.length > 0 && (
                <div>
                  <LatestBanner />
                  <LatestStoriesFeed articles={latest} />
                </div>
              )}

              <div className="mt-16 border-t-[3px] border-black pt-10 space-y-16">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight">Athletes</h2>
                    <Link href="/people" className="text-[13px] font-bold text-blue-600 hover:underline">View all people →</Link>
                  </div>
                  {athletes.length === 0 ? (
                    <p className="text-slate-500 text-sm">No athlete profiles yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                      {athletes.map((p) => <PersonCard key={p.slug} person={p} />)}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Teams</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                      <Link key={team.slug} href={teamUrl(team.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                        <span className="kicker mb-2">{team.sport}</span>
                        <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{team.name}</h3>
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Competitions</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map((c) => (
                      <Link key={c.slug} href={competitionUrl(c.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                        <span className="kicker mb-2">{c.sport}</span>
                        <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{c.name}</h3>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {(popular.length > 0 || trending.length > 0) && (
              // Each widget sits in its own tall "slot" div, and only the
              // inner box is `sticky top-28` -- see the identical note in
              // entertainment/page.tsx for why a bare sticky sibling here
              // (no slot wrapper) let Most Read and the Ad box render on top
              // of each other instead of leapfrogging.
              <aside className="hidden lg:block space-y-6">
                {popular.length > 0 && (
                  <div className="lg:min-h-[760px]">
                    <div className="lg:sticky lg:top-28 border border-neutral-300 bg-white p-5">
                      <MostRead articles={popular} />
                    </div>
                  </div>
                )}

                <div className="lg:min-h-[760px]">
                  <div className="lg:sticky lg:top-28 bg-white">
                    <AdSlot slotId={SIDEBAR_AD_SLOT_ID} format="vertical" placement="sports-sidebar" fullWidthResponsive minHeight="600px" />
                  </div>
                </div>

                {trending.length > 0 && (
                  <div className="lg:min-h-[760px]">
                    <div className="lg:sticky lg:top-28 border border-neutral-300 bg-white p-5">
                      <TrendingNow articles={trending} siteName="Law Elite Network" />
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
