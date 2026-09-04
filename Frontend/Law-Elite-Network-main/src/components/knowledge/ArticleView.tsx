import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { RelatedArticles, fetchRelatedArticles } from '@/components/knowledge/RelatedArticles';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { ArticleTOC } from '@/app/[categorySlug]/[articleSlug]/ArticleTOC';
import { ArticleAuthorByline } from '@/app/[categorySlug]/[articleSlug]/ArticleAuthorByline';
import { ArticleAdWrapper } from '@/components/knowledge/ArticleAdWrapper';
import { PrimarySources } from '@/components/knowledge/PrimarySources';
import { SeriesNotice } from '@/components/knowledge/SeriesNotice';
import { ArticleMetaHeader } from '@/components/knowledge/ArticleMetaHeader';
import { ImportantNotice } from '@/components/knowledge/ImportantNotice';
import { KeyTakeaways } from '@/components/knowledge/KeyTakeaways';
import { FrequentlyAskedQuestions } from '@/components/knowledge/FrequentlyAskedQuestions';
import { ReportAnError } from '@/components/knowledge/ReportAnError';
import { ArticleFeedback } from '@/components/knowledge/ArticleFeedback';
import { ArticleComments } from '@/components/knowledge/ArticleComments';
import { ReadingProgressBar } from '@/components/knowledge/ReadingProgressBar';
import { StickyShareBar } from '@/components/knowledge/StickyShareBar';
import { ArticleShareBar } from '@/components/knowledge/ArticleShareBar';
import { ArticleTrustBadge } from '@/components/knowledge/ArticleTrustBadge';
import { ArticleTagPills } from '@/components/knowledge/ArticleTagPills';
import { ArticleSidebar } from '@/components/knowledge/ArticleSidebar';
import { AdSlot } from '@/components/ads/AdSlot';
import { getMergedAuthorByName } from '@/lib/authors-server';
import { resolveArticleImage } from '@/lib/article-art';
import { formatArticleDate } from '@/lib/format-date';
import { extractKeyTakeaways } from '@/lib/seo/key-takeaways-extractor';
import { extractFaqSection } from '@/lib/seo/faq-section-extractor';
import { articleUrl } from '@/lib/article-url';
import { cmsGetArticles } from '@/lib/cms';
import type { SeriesInfo } from '@/components/knowledge/SeriesNotice';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// Same literal-vs-import note as ArticleSidebar.tsx's SIDEBAR_AD_SLOT_ID.
const AD_SLOT_ID = '4123514154';

/**
 * Resolves this article's series siblings by matching `seriesSlug` (set via
 * admin SeriesPanel) against every other CMS article -- never fabricated.
 * Returns undefined both when the article isn't in a series at all, and when
 * it nominally is but no sibling shares the slug yet: a "series" of one
 * reader-facing article isn't a series, and showing the panel then would be
 * a dead-end disclosure box with nothing else to link to.
 */
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

  // The current article may not come back from cmsGetArticles() in
  // preview/draft states -- include it explicitly so it's never missing
  // from its own series list.
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

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/** Mirrors the previous client-side heading-id injection so in-page TOC anchors keep working. */
function injectHeadingIds(html: string): string {
  return html.replace(/<(h[1-3])>(.*?)<\/h[1-3]>/gi, (_match: string, tag: string, text: string) => {
    const id = text.toLowerCase().replace(/\W/g, '-');
    return `<${tag} id="${id}" class="scroll-mt-32">${text}</${tag}>`;
  });
}

/**
 * Count words in HTML/text content
 * Used to determine if ads should be placed
 */
function countWords(html: string): number {
  // Strip HTML tags and count words
  const text = html.replace(/<[^>]+>/g, '');
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * A single non-looped `.replace(/<[^>]+>/g, '')` pass can leave a crafted tag
 * behind (e.g. "<scri" + "<x>" + "pt>" reassembling into "<script>" after one
 * pass removes only the middle span) -- CodeQL flags this as incomplete
 * multi-character sanitization. Looping until the string stops changing closes
 * that gap. TOC labels render via plain JSX text interpolation (never
 * dangerouslySetInnerHTML), so this was never actually exploitable here, but
 * the sanitizer should be correct on its own terms rather than relying on that.
 */
function stripTags(value: string): string {
  let previous: string;
  let current = value;
  do {
    previous = current;
    current = previous.replace(/<[^>]+>/g, '');
  } while (current !== previous);
  return current;
}

function extractToc(html: string): TOCItem[] {
  const headingRe = /<(h[1-3]) id="([^"]+)"[^>]*>(.*?)<\/h[1-3]>/gi;
  const items: TOCItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(html))) {
    items.push({
      id: match[2],
      text: stripTags(match[3]),
      level: Number(match[1].substring(1)),
    });
  }
  return items;
}

/**
 * Full article render (breadcrumbs, H1, TOC, hero image, body, related
 * articles). Shared by the canonical /{categorySlug}/{articleSlug} route and
 * the legacy flat /article/{slug} route (which falls back to rendering this
 * directly for articles with no category, instead of a URL it can't build)
 * so the two never visually drift apart.
 */
export async function ArticleView({ article, slug }: { article: any; slug: string }) {
  const category = article.category;
  const authorName: string = (typeof article.author === 'string' ? article.author : article.author?.name) || 'Law Elite Editorial';
  const [matchedAuthor, seriesInfo] = await Promise.all([
    getMergedAuthorByName(authorName),
    resolveSeriesInfo(article),
  ]);
  // No hardcoded fallback date here: if a record genuinely has no real
  // timestamp, ArticleMetaHeader omits the Published/Last Updated chips
  // rather than show a fabricated date. Neither the bundled data nor the
  // live CMS delivery API track a distinct "first published" timestamp
  // separate from "last updated" today (see ArticleMetaHeader.tsx's doc
  // comment) -- both chips show the same real date rather than inventing a
  // second one.
  const updatedAt = formatArticleDate(article.updatedAt || article.updated_at);
  const processedContent = injectHeadingIds(article.content || '');
  // Real word count from the full rendered body (before Key Takeaways/FAQ are
  // split out below) drives both ad placement and reading time -- not the
  // stored `readingTime` field, which the admin UI defaults to a flat guess
  // (see ArticleEditorModal.tsx) rather than anything measured.
  const wordCount = countWords(processedContent);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const { items: keyTakeaways, html: contentWithoutKeyTakeaways } = extractKeyTakeaways(processedContent);
  const { pairs: faqPairs, html: bodyHtml } = extractFaqSection(contentWithoutKeyTakeaways);
  // TOC built from the final body so every anchor it lists still exists on
  // the page -- the Key Takeaways/FAQ headings removed above get their own
  // dedicated sections instead, not a sidebar anchor.
  const toc = extractToc(bodyHtml);

  const relatedArticles = await fetchRelatedArticles(slug, category?.slug, category?.name, article.subcategory?.slug);
  const canonicalUrl = `${SITE}${articleUrl({ slug, category })}`;

  const tagPills = [
    category?.name ? { label: category.name, href: category.slug ? `/${category.slug}` : undefined } : null,
    article.subcategory?.name ? { label: article.subcategory.name } : null,
    article.country ? { label: article.country } : null,
  ].filter((p): p is { label: string; href?: string } => !!p);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <ReadingProgressBar />
      <StickyShareBar url={canonicalUrl} title={article.title} />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <Breadcrumbs
            category={category}
            subcategory={article.subcategory}
            articleTitle={article.title}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

            <aside className="hidden lg:block lg:col-span-2 sticky top-32 max-h-[calc(100vh-160px)] pr-4">
              <ArticleTOC items={toc} />
            </aside>

            <article className="lg:col-span-7 space-y-8">

              <header className="space-y-6">
                <ArticleTagPills pills={tagPills} />

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tighter leading-[0.98]">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                <ArticleMetaHeader
                  jurisdiction={article.country}
                  practiceArea={category?.name}
                  published={updatedAt}
                  updated={updatedAt}
                  readingTimeMinutes={readingTimeMinutes}
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <ArticleAuthorByline authorName={authorName} matchedAuthor={matchedAuthor} />
                    {updatedAt && <p className="text-[12.5px] text-slate-400">Updated {updatedAt}</p>}
                  </div>
                  <ArticleShareBar url={canonicalUrl} title={article.title} />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <ArticleTrustBadge />
                </div>

                <SeriesNotice series={seriesInfo ?? null} />

                <figure className="pt-6">
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-50 rounded-2xl border border-slate-100 shadow-xl group">
                    <Image
                      src={resolveArticleImage(article)}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  </div>
                </figure>
              </header>

              <ArticleAdWrapper wordCount={wordCount} enableAds={true}>
                <div
                  className="prose-legal max-w-none pt-8"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </ArticleAdWrapper>

              <KeyTakeaways items={keyTakeaways} />

              <ImportantNotice />

              <PrimarySources sources={article.primarySources} />

              <FrequentlyAskedQuestions pairs={faqPairs} />

              <ArticleFeedback slug={slug} />

              <ArticleComments slug={slug} />
            </article>

            <div className="hidden lg:block lg:col-span-3">
              <ArticleSidebar categorySlug={category?.slug} categoryLabel={category?.name || 'Law Elite Network'} excludeSlug={slug} />
            </div>

          </div>

          {/* Ad sits before Related Articles, not right above PublicFooter's
              nav-heavy footer -- Google's placement guidance discourages an
              ad immediately adjacent to a site's persistent navigation. */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-start-3 lg:col-span-7 pt-8 border-t border-slate-100">
              <AdSlot slotId={AD_SLOT_ID} format="horizontal" placement="article-footer" fullWidthResponsive minHeight="100px" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-start-3 lg:col-span-7">
              <RelatedArticles articles={relatedArticles} />

              <ReportAnError title={article.title} url={canonicalUrl} />
            </div>
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
      <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
        <BookOpen className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Guide Not Found</h2>
      <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
        We couldn't find the guide you're looking for. It may have been moved, retitled, or isn't published yet.
      </p>
      <Link href="/">
        <button className="bg-slate-900 text-white px-10 h-14 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all interactive-lift">
          Return to Homepage
        </button>
      </Link>
    </div>
  );
}
