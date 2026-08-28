import React from 'react';
import { fetchPublicApi } from '@/lib/api/public-fetch';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles, cmsGetNews } from '@/lib/cms';
import { getMergedAuthors } from '@/lib/authors-server';
import { authorNameToSlug, isEditorRole } from '@/data/authors';
import { COUNTRIES } from '@/data/countries';
import { TopicTicker } from '@/components/knowledge/news/TopicTicker';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { LatestRail } from '@/components/knowledge/news/LatestRail';
import { CategorySection } from '@/components/knowledge/news/CategorySection';
import { LatestGuidesGrid } from '@/components/knowledge/LatestGuidesGrid';
import { PracticeAreaChart } from '@/components/knowledge/PracticeAreaChart';
import { LatestNewsList } from '@/components/knowledge/LatestNewsList';
import { FeaturedGuideSpotlight } from '@/components/knowledge/FeaturedGuideSpotlight';
import { ForProfessionalsSection } from '@/components/knowledge/ForProfessionalsSection';
import { MissionAndBoardSection } from '@/components/knowledge/MissionAndBoardSection';
import { TrustSection } from '@/components/knowledge/TrustSection';
import { JurisdictionSection } from '@/components/knowledge/JurisdictionSection';
import { PlatformIntro } from '@/components/knowledge/PlatformIntro';
import { WhatYouCanFind } from '@/components/knowledge/WhatYouCanFind';
import { WhoIsThisFor } from '@/components/knowledge/WhoIsThisFor';
import { HomepageDisclaimer } from '@/components/knowledge/HomepageDisclaimer';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AdSlot } from '@/components/ads/AdSlot';
import { ShieldCheck, ArrowRight, Globe2 } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// Same literal-vs-import note as ArticleSidebar.tsx's SIDEBAR_AD_SLOT_ID.
const AD_SLOT_ID = '4123514154';

// Serve a cached page and refresh it in the background every 5 minutes,
// instead of re-rendering (and re-fetching from the CMS/law-service) on
// every single visitor/Googlebot request.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Law Elite Network | Plain-Language Legal Guides, Worldwide',
  description:
    'Understand your rights before you call a lawyer. Free, plain-language guides to family, criminal, employment, business, tax and property law — written for a general audience, covering every jurisdiction.',
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    url: SITE,
    title: 'Law Elite Network | Plain-Language Legal Guides, Worldwide',
    description:
      'Understand your rights before you call a lawyer. Free, plain-language guides to family, criminal, employment, business, tax and property law.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Law Elite Network | Plain-Language Legal Guides, Worldwide',
    description:
      'Understand your rights before you call a lawyer. Free, plain-language guides to family, criminal, employment, business, tax and property law.',
  },
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
  const [cmsArticles, apiCategoriesRaw, apiArticles, newsItems, editorialBoard] = await Promise.all([
    cmsGetArticles().catch(() => []),
    fetchPublicApi('/categories').then((j) => (Array.isArray(j?.data) ? j.data : [])),
    fetchPublicApi('/articles', { sortBy: 'views', order: 'desc', limit: 50, status: 'published' }).then((j) => {
      const items = j?.data?.items || j?.data || [];
      return Array.isArray(items) ? items : [];
    }),
    cmsGetNews(4).catch(() => []),
    getMergedAuthors().catch(() => []),
  ]);
  const apiCategories = apiCategoriesRaw;

  // CMS is the authoritative admin-managed source, so it wins on a slug collision;
  // mergeArticles() then fills any remaining gap with the bundled/static set.
  const seenSlugs = new Set<string>();
  const combinedSource = [...cmsArticles, ...apiArticles].filter((a: any) => {
    if (!a?.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });
  const pool = mergeArticles(combinedSource);

  // Editor's-picks first, not raw popularity -- a "trending by views" sort is
  // the newsroom pattern /news already owns. The homepage is an evergreen
  // library, so it leads with `featured` (an editorial curation flag already
  // set in the CMS) and only falls back to the full pool when too few guides
  // are flagged, mirroring the same fallback used by law-content.ts's own
  // getFeaturedArticles().
  const featuredPool = pool.filter((a: any) => a.featured);
  const spotlightSource = featuredPool.length >= 7 ? featuredPool : pool;
  const spotlight = [...spotlightSource].sort((a, b) => (b.views || 0) - (a.views || 0));

  const lead = spotlight[0];
  const heroSecondary = spotlight.slice(1, 3);
  const latest = spotlight.slice(3, 7);

  const usedSlugs = new Set<string>();
  if (lead) usedSlugs.add(lead.slug);
  heroSecondary.forEach((a) => usedSlugs.add(a.slug));
  latest.forEach((a) => usedSlugs.add(a.slug));

  // Editor's Pick spotlight (Investopedia's "Making Sense of Modern Crypto"
  // slot) -- one real featured guide, not already shown above, paired with
  // its actual byline's author profile.
  const spotlightGuide =
    spotlight.find((a: any) => a?.featured && a?.slug && !usedSlugs.has(a.slug)) ||
    spotlight.find((a: any) => a?.slug && !usedSlugs.has(a.slug)) ||
    null;
  if (spotlightGuide) usedSlugs.add(spotlightGuide.slug);
  const spotlightAuthor = spotlightGuide?.author
    ? editorialBoard.find((a: any) => a.slug === authorNameToSlug(spotlightGuide.author)) || null
    : null;

  // Both sources (live law-service categories and CMS-derived article categories)
  // can surface stray/legacy/subcategory slugs that have no real page -- e.g.
  // `family-law-child-custody`, `legal-guides`. TopicTicker links every entry
  // here unconditionally, so an unfiltered list turns into dead links straight
  // off the homepage. Restrict to the site's curated practice-area hubs.
  const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const rawCategories = apiCategories.length > 0
    ? apiCategories.map((c: any) => ({ id: c.id, name: c.name, slug: toNewCategorySlug(c.slug) }))
    : deriveCategories(pool);
  const categories = rawCategories.filter((c: { id: string; name: string; slug: string }) =>
    currentSlugSet.has(c.slug),
  );

  // Full (unsliced) per-category counts for the homepage's "Guides by
  // Practice Area" chart -- deliberately computed from the whole `pool`, not
  // the already-excludes-hero-slugs filter below, since a library snapshot
  // should reflect real totals rather than "what's left to show."
  const categoryCounts = categories.map((cat: any) => ({
    name: cat.name,
    slug: cat.slug,
    count: pool.filter((a: any) => categoryIdOf(a) === String(cat.id) || categorySlugOf(a) === cat.slug).length,
  }));

  // "Latest Guides" grid: prefer the CMS's own date-sorted feed (real
  // publishedAt-derived dates) and only fall back to the merged pool when the
  // CMS is sparse, mirroring the same threshold used for `spotlightSource`.
  // Capped at 2-per-category so a single practice area with a recent content
  // batch (e.g. Dispute Resolution) can't dominate every slot -- backfills
  // from the overflow (still most-recent-first) if the cap leaves the grid
  // short of 8, so sparse days never render fewer than the source supports.
  const latestGuidesSource = cmsArticles.length >= 8 ? cmsArticles : pool;
  const latestGuidesSorted = [...latestGuidesSource]
    .filter((a: any) => a?.slug && !usedSlugs.has(a.slug))
    .sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const MAX_PER_CATEGORY = 2;
  const perCategoryCount = new Map<string, number>();
  const latestGuides: any[] = [];
  const latestGuidesOverflow: any[] = [];
  for (const a of latestGuidesSorted) {
    const catKey = categorySlugOf(a) || categoryIdOf(a) || 'uncategorized';
    const count = perCategoryCount.get(catKey) || 0;
    if (count < MAX_PER_CATEGORY) {
      latestGuides.push(a);
      perCategoryCount.set(catKey, count + 1);
    } else {
      latestGuidesOverflow.push(a);
    }
    if (latestGuides.length >= 8) break;
  }
  for (const a of latestGuidesOverflow) {
    if (latestGuides.length >= 8) break;
    latestGuides.push(a);
  }
  latestGuides.forEach((a: any) => usedSlugs.add(a.slug));

  const homeStats = {
    guides: pool.length,
    practiceAreas: categories.length,
    jurisdictions: COUNTRIES.length,
  };
  // "Editorial Board" means desk editors specifically (the real "...Editor"
  // vs. "...Contributor" role already encoded in each profile's `title`, see
  // isEditorRole()) -- not an arbitrary slice of the full contributor list,
  // which previously could show names that don't match who's actually
  // bylining articles on this same page.
  const editors = editorialBoard.filter((a: any) => isEditorRole(a.title));
  const editorialBoardPreview = (editors.length > 0 ? editors : editorialBoard).slice(0, 4);

  const articlesByCategory = categories.map((cat: any) => ({
    ...cat,
    articles: pool
      .filter((a) => !usedSlugs.has(a.slug))
      .filter(
        (a) => categoryIdOf(a) === String(cat.id) || categorySlugOf(a) === cat.slug,
      )
      .slice(0, 3),
  }));

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      {/* Masthead strip -- search lives once, in the persistent header above;
          duplicating it here read as broken/unpolished to reviewers. */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-8">
          <span className="kicker">
            <ShieldCheck className="w-3.5 h-3.5" /> Global Legal Education
          </span>
          <h1 className="font-headline text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mt-2">
            Plain-language legal information
            <br className="hidden md:block" /> for a global audience.
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed mt-3">
            Law Elite Network is an independent legal-information platform helping people understand
            laws, legal procedures, rights, regulations, and legal concepts across different
            jurisdictions.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <a
              href="#legal-guides"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-[#0B1F3A] text-white text-[13px] font-bold tracking-wide hover:bg-blue-800 transition-colors"
            >
              Explore Legal Guides <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/countries"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md border border-slate-200 text-slate-700 text-[13px] font-bold tracking-wide hover:border-news-600 hover:text-news-600 transition-colors"
            >
              <Globe2 className="w-4 h-4" /> Browse by Jurisdiction
            </Link>
          </div>
        </div>
      </section>

      <div id="practice-areas">
        <TopicTicker categories={categories} />
      </div>

      <main className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Hero: lead + secondary + latest rail */}
        <section className="py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8 space-y-9">
              {lead && <StoryCard article={lead} variant="lead" priority />}
              {heroSecondary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 pt-2 border-t border-slate-100">
                  {heroSecondary.map((a) => (
                    <StoryCard key={a.id || a.slug} article={a} variant="default" />
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-4 space-y-9">
              <LatestRail articles={latest} />
            </div>
          </div>
        </section>

        <div className="py-6">
          <AdSlot slotId={AD_SLOT_ID} format="horizontal" placement="homepage-mid-feed" fullWidthResponsive minHeight="100px" />
        </div>

        {/* Latest Guides grid */}
        <LatestGuidesGrid articles={latestGuides} />

        {/* Library snapshot + newsroom + editor's pick */}
        <section className="py-8 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PracticeAreaChart data={categoryCounts} />
            <LatestNewsList news={newsItems} />
            <FeaturedGuideSpotlight article={spotlightGuide} author={spotlightAuthor} />
          </div>
        </section>

        {/* Category sections */}
        <div id="legal-guides" className="py-8 border-t border-slate-200 scroll-mt-24">
          {articlesByCategory.map((cat: { id: string; name: string; slug: string; articles: any[] }) => (
            <CategorySection key={cat.slug} name={cat.name} slug={cat.slug} articles={cat.articles} />
          ))}
        </div>

        <WhatYouCanFind />
        <JurisdictionSection />
        <PlatformIntro />
        <WhoIsThisFor />

        <ForProfessionalsSection />
        <MissionAndBoardSection stats={homeStats} authors={editorialBoardPreview} />
      </main>

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
