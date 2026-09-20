import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { RelatedArticles, fetchRelatedArticles } from '@/components/knowledge/RelatedArticles';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { ArticleAdWrapper } from '@/components/knowledge/ArticleAdWrapper';
import { PrimarySources } from '@/components/knowledge/PrimarySources';
import { SeriesNotice } from '@/components/knowledge/SeriesNotice';
import { ImportantNotice } from '@/components/knowledge/ImportantNotice';
import { ArticleEntityConnections } from '@/components/knowledge/ArticleEntityConnections';
import { getEntitiesForArticle } from '@/lib/entity-articles';
import { resolveEntityReferences } from '@/lib/entity-reference-resolver';
import { KeyTakeaways } from '@/components/knowledge/KeyTakeaways';
import { FrequentlyAskedQuestions } from '@/components/knowledge/FrequentlyAskedQuestions';
import { ReportAnError } from '@/components/knowledge/ReportAnError';
import { ArticleFeedback } from '@/components/knowledge/ArticleFeedback';
import { ArticleComments } from '@/components/knowledge/ArticleComments';
import { ReadingProgressBar } from '@/components/knowledge/ReadingProgressBar';
import { StickyShareBar } from '@/components/knowledge/StickyShareBar';
import { ArticleShareBar } from '@/components/knowledge/ArticleShareBar';
import { SaveArticleButton } from '@/components/member/FollowButton';
import { ArticleSidebar } from '@/components/knowledge/ArticleSidebar';
import { AdSlot } from '@/components/ads/AdSlot';
import { resolveArticleImage } from '@/lib/article-art';
import { formatArticleDate } from '@/lib/format-date';
import { extractKeyTakeaways } from '@/lib/seo/key-takeaways-extractor';
import { extractFaqSection } from '@/lib/seo/faq-section-extractor';
import { articleUrl } from '@/lib/article-url';
import { cmsGetArticles } from '@/lib/cms';
import { unwrapRetiredLinks } from '@/lib/content/retired-links';
import type { SeriesInfo } from '@/components/knowledge/SeriesNotice';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const AD_SLOT_ID = '4123514154';

async function resolveSeriesInfo(article: any): Promise<SeriesInfo | undefined> {
  if (!article.seriesSlug || !article.seriesTitle) return undefined;

  let siblings: any[] = [];
  try {
    siblings = await cmsGetArticles();
  } catch {
    return undefined;
  }

  const entries = siblings
    .filter((a) => a.seriesSlug === article.seriesSlug && a.slug)
    .map((a) => ({
      slug: a.slug as string,
      title: a.title,
      categorySlug: a.category?.slug,
      sectionTitle: a.seriesSectionTitle || undefined,
      order: typeof a.seriesOrder === 'number' ? a.seriesOrder : Number.MAX_SAFE_INTEGER,
      current: a.slug === article.slug,
    }));

  if (!entries.some((e) => e.current) && article.slug) {
    entries.push({
      slug: article.slug,
      title: article.title,
      categorySlug: article.category?.slug,
      sectionTitle: article.seriesSectionTitle || undefined,
      order: typeof article.seriesOrder === 'number' ? article.seriesOrder : Number.MAX_SAFE_INTEGER,
      current: true,
    });
  }

  if (entries.length < 2) return undefined;

  entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return { title: article.seriesTitle, entries };
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, '');
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export async function ArticleView({ article, slug }: { article: any; slug: string }) {
  const category = article.category;
  const authorName: string = (typeof article.author === 'string' ? article.author : article.author?.name) || 'Law Elite Editorial Team';
  const seriesInfo = await resolveSeriesInfo(article);

  const updatedAt = formatArticleDate(article.updatedAt || article.updated_at);
  const processedContent = unwrapRetiredLinks(article.content || '');
  const wordCount = countWords(processedContent);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const { items: keyTakeaways, html: contentWithoutKeyTakeaways } = extractKeyTakeaways(processedContent);
  const { pairs: faqPairs, html: bodyHtml } = extractFaqSection(contentWithoutKeyTakeaways);

  const relatedArticles = await fetchRelatedArticles(slug, category?.slug, category?.name, article.subcategory?.slug);
  const connectedEntities = resolveEntityReferences(await getEntitiesForArticle(article));
  const canonicalUrl = `${SITE}${articleUrl({ slug, category })}`;

  const readAlsoArticle = relatedArticles.length > 0 ? relatedArticles[0] : {
    title: 'How Many Hours Should You Actually Study in Law School?',
    slug: 'how-many-hours-should-you-study-in-law-school',
    category: { slug: 'law-school-success' },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-[#E13131] selection:text-white font-sans">
      <ReadingProgressBar />
      <StickyShareBar url={canonicalUrl} title={article.title} />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">

          {/* ── Breadcrumbs ────────────────────────────────────────── */}
          <div className="mb-6">
            <Breadcrumbs
              category={category}
              subcategory={article.subcategory}
              articleTitle={article.title}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">

            {/* ── Left Article Column (8 Cols) ────────────────────── */}
            <article className="lg:col-span-8 space-y-6">

              <header className="space-y-4">
                {/* Badges: Red Category + Black EXCLUSIVE */}
                <div className="flex items-center gap-2">
                  {category?.name && (
                    <Link
                      href={category.slug ? `/${category.slug}` : '#'}
                      className="bg-[#E13131] text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-1 hover:bg-red-700 transition-colors"
                    >
                      {category.name}
                    </Link>
                  )}
                  <span className="bg-black text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-1">
                    EXCLUSIVE
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-headline text-[2rem] md:text-[2.75rem] lg:text-[3rem] font-black text-slate-900 tracking-[-0.02em] leading-[1.07] my-3">
                  {article.title}
                </h1>

                {/* Byline & Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-700">
                    <span className="font-bold uppercase tracking-wide">By {authorName}</span>
                    {updatedAt && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">{updatedAt}</span>
                      </>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{readingTimeMinutes} min read</span>
                  </div>

                  {/* Social Icons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <SaveArticleButton slug={article.slug} />
                    <ArticleShareBar url={canonicalUrl} title={article.title} />
                  </div>
                </div>

                <SeriesNotice series={seriesInfo ?? null} />

                {/* Featured Hero Image */}
                <figure className="my-4">
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-900 rounded-none border border-slate-200">
                    <Image
                      src={resolveArticleImage(article)}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 py-1.5 border-b border-slate-100">
                    <span className="truncate max-w-[70%]">{article.title}</span>
                    <span className="text-slate-400 shrink-0">Law Elite Newsroom</span>
                  </div>
                </figure>

                {/* Follow on Google News Box */}
                <div className="border border-slate-200 p-3.5 my-4 flex flex-wrap items-center justify-between gap-3 bg-white">
                  <span className="text-xs md:text-sm font-bold text-slate-900">
                    Stay informed — get Law Elite legal intelligence in your news feed.
                  </span>
                  <a
                    href="https://news.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-black text-black font-black uppercase text-[10.5px] tracking-wider px-3.5 py-1.5 hover:bg-black hover:text-white transition-colors shrink-0"
                  >
                    FOLLOW ON GOOGLE NEWS
                  </a>
                </div>
              </header>

              {/* Inline READ ALSO module */}
              {readAlsoArticle && (
                <div className="my-6 p-4 border-l-4 border-[#E13131] bg-slate-50">
                  <span className="text-[#E13131] font-black text-[11px] uppercase tracking-widest block mb-1">
                    READ ALSO
                  </span>
                  <Link
                    href={articleUrl({ slug: readAlsoArticle.slug, category: (readAlsoArticle as any).category })}
                    className="font-headline font-bold text-base md:text-lg text-slate-900 hover:text-[#E13131] transition-colors leading-snug"
                  >
                    {readAlsoArticle.title}
                  </Link>
                </div>
              )}

              {/* Key Takeaways */}
              <KeyTakeaways items={keyTakeaways} />

              {/* Article Content Prose */}
              <ArticleAdWrapper wordCount={wordCount} enableAds={true}>
                <div
                  className="prose-legal max-w-none pt-4 drop-cap"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </ArticleAdWrapper>

              <ImportantNotice />

              <PrimarySources sources={article.primarySources} />

              <ArticleEntityConnections entities={connectedEntities} />

              <FrequentlyAskedQuestions pairs={faqPairs} />

              <ArticleFeedback slug={slug} />

              <ArticleComments slug={slug} />
            </article>

            {/* ── Right Sidebar Column (4 Cols) ───────────────────── */}
            <aside className="lg:col-span-4 sticky top-32">
              <ArticleSidebar
                categorySlug={category?.slug}
                categoryLabel={category?.name || 'Law Elite Network'}
                excludeSlug={slug}
              />
            </aside>

          </div>

          {/* Bottom Ad & Related Articles */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <AdSlot
              slotId={AD_SLOT_ID}
              format="horizontal"
              placement="article-footer"
              fullWidthResponsive
              minHeight="100px"
            />
          </div>

          <div className="mt-8">
            <RelatedArticles articles={relatedArticles} />
            <ReportAnError title={article.title} url={canonicalUrl} />
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-slate-400 mb-6 border border-slate-200">
        <BookOpen className="w-10 h-10 text-[#E13131]" />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase tracking-tight">Guide Not Found</h2>
      <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed text-sm">
        We couldn't find the guide you're looking for. It may have been moved, retitled, or isn't published yet.
      </p>
      <Link href="/">
        <button className="bg-[#E13131] hover:bg-slate-900 text-white px-8 h-12 font-bold text-xs uppercase tracking-widest transition-colors">
          Return to Homepage
        </button>
      </Link>
    </div>
  );
}
