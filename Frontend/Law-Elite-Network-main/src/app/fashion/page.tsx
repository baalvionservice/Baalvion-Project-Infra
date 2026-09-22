import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { cmsGetArticles } from '@/lib/cms';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { AdSlot } from '@/components/ads/AdSlot';
import { LatestStoriesFeed } from '@/components/newsfeed/LatestStoriesFeed';
import { FASHION_DESIGN_PREVIEW_PLACEHOLDER } from '@/data/fashion-design-preview-placeholder';
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
// AdSense slot ID is reused across placements site-wide (see the identical
// note there for why it's a literal rather than an AD_PLACEMENTS import).
const SIDEBAR_AD_SLOT_ID = '4123514154';

const CATEGORY_SLUG = 'fashion';

/** True only when there is zero real Fashion content anywhere (CMS or bundled). */
async function hasNoRealFashionContent(): Promise<boolean> {
  const cmsArticles = await cmsGetArticles(undefined, CATEGORY_SLUG).catch(() => [] as any[]);
  return cmsArticles.length === 0 && getArticlesByCategorySlug(CATEGORY_SLUG).length === 0;
}

// Keeps this preview page out of search results while it's showing
// placeholder content -- real content flips this back to indexable on its
// own (see hasNoRealFashionContent) with no manual step required.
export async function generateMetadata(): Promise<Metadata> {
  const isPreview = await hasNoRealFashionContent();
  return isPreview ? { robots: { index: false, follow: false } } : {};
}

export default async function FashionHubPage() {
  const cmsArticles = await cmsGetArticles(undefined, CATEGORY_SLUG).catch(() => [] as any[]);

  // No bundled fashion articles exist yet (unlike sports/entertainment,
  // there's nothing to fall back to locally) -- getArticlesByCategorySlug
  // still runs so real CMS content and any future bundled fashion articles
  // show up the moment either exists, with no code change needed.
  const seen = new Set<string>();
  const realRaw = [...cmsArticles, ...getArticlesByCategorySlug(CATEGORY_SLUG)]
    .map((a: any) => ({ ...a, summary: a.summary ?? a.excerpt }))
    .filter((a) => {
      if (!a?.slug || seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    });

  // Design-preview fallback: only used when there is zero real content. The
  // moment one real Fashion article exists (CMS or bundled), `realRaw` is
  // non-empty and this placeholder set is never referenced again.
  const isPreview = realRaw.length === 0;
  const raw = isPreview ? FASHION_DESIGN_PREVIEW_PLACEHOLDER : realRaw;

  // Fashion has no fixed sub-taxonomy yet, so -- same as /sports -- the feed
  // groups by whatever subcategory each article actually carries (Designer
  // Trademarks, Fashion Week Contracts, ...) rather than a hardcoded list.
  const groupMap = new Map<string, { label: string; articles: any[] }>();
  for (const a of raw) {
    const label = a.subcategory?.name || 'Fashion News';
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

  const latest = [...all].sort((a, b) => dateVal(b) - dateVal(a));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-[1080px] px-4 md:px-6">
          {isPreview && (
            <div className="mb-8 border-2 border-black bg-[#FFCF00] px-4 py-3 text-[13px] font-bold text-black">
              DESIGN PREVIEW — every story below is placeholder content so the layout can be checked before
              real articles are published. Nothing here is a real story, it isn't indexed, and it disappears
              automatically the moment a real Fashion article is published in the CMS.
            </div>
          )}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h1 className="font-headline font-black italic uppercase tracking-[-0.05em] leading-none text-black text-[34px] sm:text-[52px] md:text-[68px]">
                Fashion
              </h1>
              <div className="h-[10px] w-full mt-1" style={{ background: YELLOW }} />

              {top ? (
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
              ) : (
                // Real state, not a placeholder card: no fashion article has
                // been published yet (locally or via the CMS). This section
                // fills in on its own the moment one exists -- no code
                // change needed.
                <p className="mt-8 max-w-xl text-[15px] text-neutral-500">
                  No fashion coverage has been published yet. Once articles are added in the CMS under
                  the Fashion category, this page fills in automatically.
                </p>
              )}

              {sections.map((g, i) => (
                <Section key={g.label} label={g.label} articles={g.articles} leadSide={i % 2 === 0 ? 'left' : 'right'} />
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
              // inner box is `sticky top-28` -- see the identical note in
              // entertainment/page.tsx for why a bare sticky sibling (no
              // slot wrapper) lets sticky siblings render on top of each
              // other instead of leapfrogging.
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
                    <AdSlot slotId={SIDEBAR_AD_SLOT_ID} format="vertical" placement="fashion-sidebar" fullWidthResponsive minHeight="600px" />
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
