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
import { ReviewedBy } from '@/components/knowledge/ReviewedBy';
import { ArticleMetaHeader } from '@/components/knowledge/ArticleMetaHeader';
import { ImportantNotice } from '@/components/knowledge/ImportantNotice';
import { KeyTakeaways } from '@/components/knowledge/KeyTakeaways';
import { FrequentlyAskedQuestions } from '@/components/knowledge/FrequentlyAskedQuestions';
import { ReportAnError } from '@/components/knowledge/ReportAnError';
import { EditorialInformation } from '@/components/knowledge/EditorialInformation';
import { NextStep } from '@/components/knowledge/NextStep';
import { getMergedAuthorByName, getMergedAuthorBySlug } from '@/lib/authors-server';
import { resolveArticleImage } from '@/lib/article-art';
import { formatArticleDate, formatArticleMonthYear } from '@/lib/format-date';
import { extractKeyTakeaways } from '@/lib/seo/key-takeaways-extractor';
import { extractFaqSection } from '@/lib/seo/faq-section-extractor';
import { articleUrl } from '@/lib/article-url';
import type { ReviewedByInfo } from '@/components/knowledge/ReviewedBy';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

/**
 * Bundled LawArticle data carries a resolved `reviewedBy` object directly.
 * CMS-sourced articles instead carry a raw `reviewerSlug` (ReviewerPanel in
 * admin-platform) that must be resolved against the author directory for a
 * real name/credentials -- same pattern as the primary byline just below.
 */
async function resolveReviewedBy(article: any): Promise<ReviewedByInfo | undefined> {
  if (article.reviewedBy) return article.reviewedBy;
  if (!article.reviewerSlug || !article.reviewedAt) return undefined;
  const reviewer = await getMergedAuthorBySlug(article.reviewerSlug);
  if (!reviewer) return undefined;
  return {
    name: reviewer.name,
    jurisdiction: article.reviewerJurisdiction || undefined,
    barLicense: article.reviewerBarLicense || undefined,
    reviewDate: formatArticleMonthYear(article.reviewedAt) || article.reviewedAt,
  };
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
  const [matchedAuthor, reviewedBy] = await Promise.all([
    getMergedAuthorByName(authorName),
    resolveReviewedBy(article),
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

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <Breadcrumbs
            category={category}
            country={article.country}
            subcategory={article.subcategory}
            articleTitle={article.title}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">

            <aside className="hidden lg:block lg:col-span-3 sticky top-32 max-h-[calc(100vh-160px)] pr-8">
              <ArticleTOC items={toc} />
            </aside>

            <article className="lg:col-span-9 space-y-8">

              <header className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 tracking-tighter leading-[0.95]">
                  {article.title}
                </h1>

                <ArticleMetaHeader
                  jurisdiction={article.country}
                  practiceArea={category?.name}
                  published={updatedAt}
                  updated={updatedAt}
                  readingTimeMinutes={readingTimeMinutes}
                />

                <div className="space-y-3">
                  <ArticleAuthorByline authorName={authorName} matchedAuthor={matchedAuthor} />
                  <ReviewedBy info={reviewedBy} />
                </div>

                <ImportantNotice />

                <PrimarySources sources={article.primarySources} />

                <figure className="pt-6">
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-50 rounded-lg">
                    <Image
                      src={resolveArticleImage(article)}
                      alt={article.title}
                      fill
                      className="object-cover"
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

              <FrequentlyAskedQuestions pairs={faqPairs} />

              <NextStep category={category} country={article.country} />

              <RelatedArticles
                articles={relatedArticles}
                category={category}
                subcategory={article.subcategory}
                country={article.country}
              />

              <EditorialInformation
                authorName={authorName}
                reviewedBy={reviewedBy}
                updatedAt={updatedAt}
                sourcesCount={article.primarySources?.length || 0}
              />

              <ReportAnError title={article.title} url={`${SITE}${articleUrl({ slug, category })}`} />
            </article>

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
