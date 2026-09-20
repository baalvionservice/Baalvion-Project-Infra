import React from 'react';
import { fetchPublicApi } from '@/lib/api/public-fetch';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { getMergedAuthors, getPublishedArticleCountsByAuthorSlug } from '@/lib/authors-server';
import { isEditorRole } from '@/data/authors';
import { TopicTicker } from '@/components/knowledge/news/TopicTicker';
import { MissionAndBoardSection } from '@/components/knowledge/MissionAndBoardSection';
import { TrustSection } from '@/components/knowledge/TrustSection';
import { HomepageDisclaimer } from '@/components/knowledge/HomepageDisclaimer';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AdSlot } from '@/components/ads/AdSlot';
import {
  BreakingStrip,
  ExploreBand,
  FrontPage,
  MediaRail,
  PeopleRail,
  PillarColumn,
  PopularTopics,
  TrendingList,
} from '@/components/home/HomeSections';
import { getHomeFeed } from '@/lib/home-feed';
import { getAllMedia } from '@/lib/media-server';
import type { Metadata } from 'next';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const TITLE = 'Law Elite Network | News on People, Entertainment, Sports and the Law';
const DESCRIPTION =
  'Law Elite Network covers the people, entertainment, sports and legal stories that matter, with profiles, cases, courts and interviews in one place.';

// Same literal-vs-import note as ArticleSidebar.tsx's SIDEBAR_AD_SLOT_ID.
const AD_SLOT_ID = '4123514154';

// /api/revalidate's revalidateTag() refreshes this on publish, so the window
// is only the no-webhook safety net.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE },
  openGraph: { type: 'website', url: SITE, title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

function categoryIdOf(a: any): string {
  return String(a?.categoryId ?? a?.category?.id ?? a?.category_id ?? '');
}
function categorySlugOf(a: any): string {
  return String(a?.category?.slug ?? a?.categorySlug ?? '');
}

function deriveCategories(pool: any[]): { id: string; name: string; slug: string }[] {
  const map = new Map<string, { id: string; name: string; slug: string }>();
  pool.forEach((a) => {
    const c = a?.category;
    if (c?.slug && c?.name && !map.has(c.slug)) {
      map.set(c.slug, { id: c.id, name: c.name, slug: c.slug });
    }
  });
  return [...map.values()];
}

// Server component so it can read the CMS directly (cms.ts's CMS_PUBLIC_URL/CMS_WEBSITE_SLUG
// env vars are server-only). Previously this ran client-side and only queried law-service's
// /v1/articles, which is empty in production — every admin-authored article (and its uploaded
// featured image) lives in the CMS, so the homepage silently showed only the bundled/static
// placeholder set no matter what was published. cmsGetArticles() already carries featuredImage
// through (see lib/cms.ts's CmsArticle.featuredImage comment); this just wires it into the pool.
export default async function KnowledgeHomePage() {
  const [cmsArticles, apiCategoriesRaw, apiArticles, editorialBoard] = await Promise.all([
    cmsGetArticles().catch(() => []),
    fetchPublicApi('/categories').then((j) => (Array.isArray(j?.data) ? j.data : [])),
    fetchPublicApi('/articles', { sortBy: 'views', order: 'desc', limit: 50, status: 'published' }).then((j) => {
      const items = j?.data?.items || j?.data || [];
      return Array.isArray(items) ? items : [];
    }),
    getMergedAuthors().catch(() => []),
  ]);
  const apiCategories = apiCategoriesRaw;

  // AdSense-readiness retirement (see category-slugs.ts's CURRENT_CATEGORY_SLUGS
  // comment): filtered here, before any pool/source is built from it, so every
  // downstream homepage feed (lead story, "Latest Guides" grid, "Most Viewed")
  // is covered in one place -- mergeArticles() below unconditionally backfills
  // every bundled article, including the 8 legacy practice areas now retired,
  // so filtering only the live sources and not the merged pool would still
  // leak them back in. Each of those feeds links out via articleUrl(), which
  // would otherwise point a still-live, indexed homepage straight into a
  // retired category's /article/{slug} gap.
  const currentSlugSetForPool = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const isKeptCategoryArticle = (a: any) => {
    const rawSlug = categorySlugOf(a);
    return !rawSlug || currentSlugSetForPool.has(toNewCategorySlug(rawSlug));
  };
  const cmsArticlesKept = cmsArticles.filter(isKeptCategoryArticle);

  // CMS is the authoritative admin-managed source, so it wins on a slug collision;
  // mergeArticles() then fills any remaining gap with the bundled/static set.
  const seenSlugs = new Set<string>();
  const combinedSource = [...cmsArticlesKept, ...apiArticles].filter((a: any) => {
    if (!a?.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });
  const pool = mergeArticles(combinedSource).filter(isKeptCategoryArticle);

  const feed = await getHomeFeed(pool);
  const [videos, interviews] = await Promise.all([getAllMedia('video'), getAllMedia('interview')]);
  const trendingCounts = new Map(feed.trendingPeople.map((t) => [t.person.slug, t.articleCount]));

  // TopicTicker links every entry unconditionally, so restrict to the curated
  // practice-area hubs (stray CMS/API slugs would be dead links).
  const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const rawCategories = apiCategories.length > 0
    ? apiCategories.map((c: any) => ({ id: c.id, name: c.name, slug: toNewCategorySlug(c.slug) }))
    : deriveCategories(pool);
  const categories = rawCategories.filter((c: { id: string; name: string; slug: string }) =>
    currentSlugSet.has(c.slug),
  );

  // Only published authors: the fallback used to list profiles with no
  // reachable article (AdSense second-rejection finding).
  const publishedAuthorSlugs = new Set(
    Array.from((await getPublishedArticleCountsByAuthorSlug()).entries())
      .filter(([, count]) => count > 0)
      .map(([slug]) => slug),
  );
  const publishedBoard = editorialBoard.filter((a: any) => publishedAuthorSlugs.has(a.slug));
  const editors = publishedBoard.filter((a: any) => isEditorRole(a.title));
  const editorialBoardPreview = (editors.length > 0 ? editors : publishedBoard).slice(0, 4);
  const homeStats = { guides: pool.length, practiceAreas: categories.length };

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <BreakingStrip articles={feed.breaking} />

      <main className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <h1 className="sr-only">Law Elite Network: people, entertainment, sports and legal news</h1>

        <FrontPage articles={feed.latest} />

        {(feed.trending.length > 0 || feed.celebrity.length > 0) && (
          <section className="py-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <TrendingList articles={feed.trending} />
            </div>
            <div className="lg:col-span-7">
              <PillarColumn title="Celebrity news" href="/celebrity-news" articles={feed.celebrity} />
            </div>
          </section>
        )}

        <div className="py-6">
          <AdSlot slotId={AD_SLOT_ID} format="horizontal" placement="homepage-mid-feed" fullWidthResponsive minHeight="100px" />
        </div>

        {(feed.entertainment.length > 0 || feed.sports.length > 0 || feed.legal.length > 0) && (
          <section className="py-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <PillarColumn title="Entertainment" href="/entertainment" articles={feed.entertainment} />
            <PillarColumn title="Sports" href="/sports" articles={feed.sports} />
            <PillarColumn title="Legal" href="/legal/cases" articles={feed.legal} />
          </section>
        )}

        <PeopleRail title="Trending people" href="/people" people={feed.trendingPeople.map((t) => t.person)} counts={trendingCounts} />
        <PeopleRail title="Featured people" href="/people" people={feed.featuredPeople} />
        <MediaRail title="Videos" href="/videos" items={videos.slice(0, 4)} />
        <MediaRail title="Interviews" href="/interviews" items={interviews.slice(0, 4)} />
        <PopularTopics topics={feed.popularTopics} />

        <div id="practice-areas" className="border-t border-slate-200 py-4">
          <TopicTicker categories={categories} />
        </div>

        <MissionAndBoardSection stats={homeStats} authors={editorialBoardPreview} />
      </main>

      <ExploreBand />

      <section className="border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12">
          <TrustSection />
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <HomepageDisclaimer />
      </div>

      <PublicFooter />
    </div>
  );
}
