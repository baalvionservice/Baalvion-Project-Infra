import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Globe2, ArrowRight } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { RelatedArticles, fetchRelatedArticles } from '@/components/knowledge/RelatedArticles';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { ArticleTOC } from '@/app/[categorySlug]/[articleSlug]/ArticleTOC';
import { ArticleAuthorByline } from '@/app/[categorySlug]/[articleSlug]/ArticleAuthorByline';
import { getMergedAuthorByName } from '@/lib/authors-server';
import { resolveArticleImage } from '@/lib/article-art';
import { formatArticleDate } from '@/lib/format-date';

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
  const matchedAuthor = await getMergedAuthorByName(authorName);
  const updatedAt = formatArticleDate(article.updatedAt || article.updated_at) || 'February 12, 2025';
  const processedContent = injectHeadingIds(article.content || '');
  const toc = extractToc(processedContent);
  const relatedArticles = await fetchRelatedArticles(slug, category?.slug, category?.name, article.subcategory?.slug);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <Breadcrumbs
            category={category}
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

                <ArticleAuthorByline authorName={authorName} updatedAt={updatedAt} matchedAuthor={matchedAuthor} />

                {/* Jurisdiction badge -- only renders once an article actually
                    carries article.country (see src/data/countries.ts); no
                    article does yet, so this is dormant capability, not a claim. */}
                {article.country && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-news-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                    <Globe2 className="w-3 h-3" aria-hidden="true" /> {article.country}
                  </span>
                )}

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

              <div
                className="prose-legal max-w-none pt-8"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              <div className="pt-6 border-t border-slate-100">
                <Link
                  href="/editorial-process"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-news-600 transition-colors"
                >
                  How we publish and review legal education <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>

              <RelatedArticles articles={relatedArticles} />
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
