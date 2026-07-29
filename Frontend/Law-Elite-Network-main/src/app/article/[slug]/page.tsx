import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { RelatedArticles } from '@/components/knowledge/RelatedArticles';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { ArticleTOC } from './ArticleTOC';
import { ArticleAuthorByline } from './ArticleAuthorByline';
import seedData from '../../../../docs/seed-data.json';
import { getArticleBySlug } from '@/data/law-content';
import { getAuthorByName } from '@/data/authors';
import { resolveArticleImage } from '@/lib/article-art';
import { cmsGetArticleBySlug, cmsGetPreviewContent } from '@/lib/cms';
import { articlesPublicApi } from '@/lib/api/client';
import { formatArticleDate } from '@/lib/format-date';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Source-of-truth order for the rendered article, mirroring generateMetadata
 * in layout.tsx: CMS (preview-aware) -> law-service -> bundled editorial
 * library -> static seed. Runs server-side so the article body (title, byline,
 * hero image, full text) is present in the first response instead of only
 * appearing after a client-side fetch — crawlers and AdSense's content review
 * previously saw an empty shell here.
 */
async function fetchArticle(slug: string, previewToken?: string, previewExp?: string): Promise<any | null> {
  if (previewToken && previewExp) {
    const preview = await cmsGetPreviewContent(slug, previewExp, previewToken);
    if (preview) return preview;
  }

  const cms = await cmsGetArticleBySlug(slug);
  if (cms) return cms;

  try {
    const res = await articlesPublicApi.get(slug);
    if (res.data?.data) return res.data.data;
  } catch {
    /* ignore, fall through to bundled/seed */
  }

  const bundled = getArticleBySlug(slug);
  if (bundled) return bundled;

  const seedMatch = (seedData as any).articles?.find((a: any) => a.slug === slug && a.content);
  return seedMatch ? { ...seedMatch, updatedAt: 'February 12, 2025' } : null;
}

/** Mirrors the previous client-side heading-id injection so in-page TOC anchors keep working. */
function injectHeadingIds(html: string): string {
  return html.replace(/<(h[1-3])>(.*?)<\/h[1-3]>/gi, (_match: string, tag: string, text: string) => {
    const id = text.toLowerCase().replace(/\W/g, '-');
    return `<${tag} id="${id}" class="scroll-mt-32">${text}</${tag}>`;
  });
}

function extractToc(html: string): TOCItem[] {
  const headingRe = /<(h[1-3]) id="([^"]+)"[^>]*>(.*?)<\/h[1-3]>/gi;
  const items: TOCItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(html))) {
    items.push({
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ''),
      level: Number(match[1].substring(1)),
    });
  }
  return items;
}

export default async function ArticleDeepDivePage(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ previewToken?: string; previewExp?: string }>;
  },
) {
  const { slug } = await params;
  const { previewToken, previewExp } = await searchParams;
  const article = await fetchArticle(slug, previewToken, previewExp);

  if (!article) return <ArticleNotFound />;

  const category = article.category;
  const subcategory = article.subcategory;
  const authorName: string = (typeof article.author === 'string' ? article.author : article.author?.name) || 'Law Elite Editorial';
  const matchedAuthor = getAuthorByName(authorName);
  const updatedAt = formatArticleDate(article.updatedAt || article.updated_at) || 'February 12, 2025';
  const processedContent = injectHeadingIds(article.content || '');
  const toc = extractToc(processedContent);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <Breadcrumbs
            category={category}
            subcategory={subcategory}
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

              <RelatedArticles
                currentSlug={slug}
                categorySlug={category?.slug}
                categoryName={category?.name}
              />
            </article>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
        <BookOpen className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4 italic">Intelligence Record Missing</h2>
      <p className="text-slate-500 italic mb-10 max-w-sm mx-auto leading-relaxed">
        The requested strategic dossier could not be synchronized with our global knowledge ledger.
      </p>
      <Link href="/">
        <button className="bg-slate-900 text-white px-10 h-14 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all interactive-lift">
          Return to Discovery Hub
        </button>
      </Link>
    </div>
  );
}
