import React from 'react';
import { categoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { TopicTicker } from '@/components/knowledge/news/TopicTicker';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { LatestRail } from '@/components/knowledge/news/LatestRail';
import { CategorySection } from '@/components/knowledge/news/CategorySection';
import { TrustSection } from '@/components/knowledge/TrustSection';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import SearchBar from '@/components/search/SearchBar';
import { ShieldCheck } from 'lucide-react';

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
  const [cmsArticles, apiCategoriesRaw, apiArticles] = await Promise.all([
    cmsGetArticles().catch(() => []),
    categoriesPublicApi
      .list()
      .then((res: any) => (Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => []),
    articlesPublicApi
      .list({ sortBy: 'views', order: 'desc', limit: 50, status: 'published' })
      .then((res: any) => {
        const items = res.data?.data?.items || res.data?.data || [];
        return Array.isArray(items) ? items : [];
      })
      .catch(() => []),
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

  const trending = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0));

  const lead = trending[0];
  const heroSecondary = trending.slice(1, 3);
  const latest = trending.slice(3, 7);

  const usedSlugs = new Set<string>();
  if (lead) usedSlugs.add(lead.slug);
  heroSecondary.forEach((a) => usedSlugs.add(a.slug));
  latest.forEach((a) => usedSlugs.add(a.slug));

  const categories = apiCategories.length > 0
    ? apiCategories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
    : deriveCategories(pool);

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
      {/* Masthead strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <span className="kicker">
              <ShieldCheck className="w-3.5 h-3.5" /> Trusted Legal Knowledge · Worldwide
            </span>
            <h1 className="font-headline text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mt-2">
              Plain-language guides to the law,
              <br className="hidden md:block" /> for every jurisdiction.
            </h1>
          </div>
          <div className="w-full lg:max-w-md">
            <SearchBar variant="navbar" />
          </div>
        </div>
      </section>

      <TopicTicker categories={categories} />

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
            <div className="lg:col-span-4">
              <LatestRail articles={latest} />
            </div>
          </div>
        </section>

        {/* Category sections */}
        <div className="py-8 border-t border-slate-200">
          {articlesByCategory.map((cat: any) => (
            <CategorySection key={cat.slug} name={cat.name} slug={cat.slug} articles={cat.articles} />
          ))}
        </div>

      </main>

      <section className="border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12">
          <TrustSection />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
// Force rebuild at Mon Aug  3 00:52:42 IST 2026
// Deploy timestamp: Mon Aug  3 01:25:18 IST 2026
// Vercel deploy with secrets: 1785700666
