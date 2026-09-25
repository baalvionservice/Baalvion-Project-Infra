import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { cmsGetArticles } from '@/lib/cms';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { AdSlot } from '@/components/ads/AdSlot';
import { LatestStoriesFeed } from '@/components/newsfeed/LatestStoriesFeed';
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

// Same AdSense slot as AD_PLACEMENTS.SIDEBAR_TOP (AdManager.tsx) -- literal
// because that file is 'use client' and its export doesn't survive an import
// into this server component (resolves to a client-ref stub with no keys;
// see the identical note on CATEGORY_AD_SLOT_ID in [categorySlug]/page.tsx).
const SIDEBAR_AD_SLOT_ID = '4123514154';

const SECTIONS = [
  { slug: 'movies', label: 'Movies' },
  { slug: 'music', label: 'Music' },
  { slug: 'television', label: 'Television' },
  { slug: 'streaming', label: 'Streaming' },
  { slug: 'celebrity-news', label: 'Celebrity News' },
] as const;

export default async function EntertainmentHubPage() {
  const perSection = await Promise.all(
    SECTIONS.map(async (s) => [
      ...(await cmsGetArticles(undefined, s.slug).catch(() => [] as any[])),
      ...getArticlesByCategorySlug(s.slug),
    ]),
  );

  const seen = new Set<string>();
  const groups = SECTIONS.map((s, i) => ({
    ...s,
    articles: (perSection[i] as any[]).map((a: any) => ({ ...a, summary: a.summary ?? a.excerpt }))
      .filter((a) => {
        if (!a?.slug || seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
      })
      .sort((a, b) => dateVal(b) - dateVal(a)),
  })).filter((g) => g.articles.length > 0);

  const all = groups.flatMap((g) => g.articles);
  const [top, ...others] = all;
  const topSide = others.slice(0, 2);
  const usedTop = new Set([top, ...topSide].filter(Boolean).map((a: any) => a.slug));

  // Sidebar rails only draw from articles not already shown in the hero above
  // them, so nothing appears twice on the page.
  const rest = all.filter((a: any) => !usedTop.has(a.slug));
  const byViews = [...rest].sort((a, b) => (b.views || 0) - (a.views || 0));
  const popular = byViews.slice(0, 5);
  // "Trending Now" reflects the admin's Trending flag (CMS -> content ->
  // Media tab) instead of a leftover view-count slice, so editors control it
  // directly -- falls back to the next most-viewed articles only until an
  // editor has flagged something trending (Most Read and Trending Now stay
  // two separately ranked boxes, not the same five twice).
  const flaggedTrending = rest.filter((a: any) => a.isTrending && !popular.some((p: any) => p.slug === a.slug));
  const trending = (flaggedTrending.length > 0 ? flaggedTrending : byViews.slice(popular.length)).slice(0, 5);
  const sections = groups
    .map((g) => ({ ...g, articles: g.articles.filter((a: any) => !usedTop.has(a.slug)) }))
    .filter((g) => g.articles.length > 0);

  // Flat reverse-chron feed, "THE LATEST" -- the FULL real pool
  // (not just what's left after the hero/sections above use their picks),
  // same as a real outlet's "Latest" list runs independently of what's
  // separately featured higher up the page. Using only the leftovers here
  // meant a thin category could show 4-5 real articles above yet "The
  // Latest" would report just 1-2 of them, which read as broken/incomplete
  // rather than as the deliberate curation it was.
  const latest = [...all].sort((a, b) => dateVal(b) - dateVal(a));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-[1080px] px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h1 className="font-headline font-black italic uppercase tracking-[-0.05em] leading-none text-black text-[34px] sm:text-[52px] md:text-[68px]">
                Entertainment
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
                <Section key={g.slug} label={g.label} articles={g.articles} leadSide={i % 2 === 0 ? 'left' : 'right'} moreHref={`/${g.slug}`} />
              ))}

              {latest.length > 0 && (
                <div>
                  <LatestBanner />
                  <LatestStoriesFeed articles={latest} />
                </div>
              )}
            </div>

            {(popular.length > 0 || trending.length > 0) && (
              // Each widget sits in its own tall "slot" div, and only the
              // inner box is `sticky top-28` -- the outer slot's min-height
              // is what makes them leapfrog cleanly instead of overlapping.
              // A sticky element's stuck range is bounded by its own PARENT's
              // height; give two sticky siblings the same bare parent (as an
              // earlier version of this did) and their stuck ranges overlap
              // for as long as both remain individually eligible, so the
              // later one (Ad) painted over "Most Read" and any of its
              // content taller than the Ad's box peeked out underneath.
              // Each slot here reserves more height than that widget's
              // content ever reaches, so one fully releases before the next
              // one's turn starts.
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
                    <AdSlot slotId={SIDEBAR_AD_SLOT_ID} format="vertical" placement="entertainment-sidebar" fullWidthResponsive minHeight="600px" />
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
