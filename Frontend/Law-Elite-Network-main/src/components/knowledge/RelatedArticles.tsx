import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';

export interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  categorySlug?: string;
  subcategorySlug?: string;
  author: string;
  slug: string;
  featuredImage?: string;
}

/**
 * Same-category interlinking, sourced from the CMS first (real published
 * articles) with the bundled editorial library as an always-present fallback.
 * Server-side so these links and the "Related Articles" heading are present in
 * the first response -- this previously fetched client-side in a useEffect, so
 * a non-JS-executing crawler saw neither the section nor its internal links on
 * any article page.
 */
export async function fetchRelatedArticles(
  currentSlug: string,
  categorySlug?: string,
  categoryName?: string,
  subcategorySlug?: string,
): Promise<RelatedArticle[]> {
  if (!categorySlug) return [];

  const bundled: RelatedArticle[] = getArticlesByCategorySlug(categorySlug)
    .filter((a) => a.slug !== currentSlug)
    .map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category.name,
      categorySlug: a.category.slug,
      subcategorySlug: a.subcategory?.slug,
      author: a.author,
      slug: a.slug,
    }));

  try {
    const cms = await cmsGetArticles(undefined, categorySlug);
    const cmsArticles: RelatedArticle[] = cms
      .filter((a) => a.slug && a.slug !== currentSlug)
      .map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category?.name || categoryName || 'Legal Guide',
        categorySlug: a.category?.slug,
        // CMS content has no subcategory field (lib/cms.ts toArticle()) --
        // articleUrl() falls back to the flat /article/{slug} URL for these.
        author: a.author || 'Law Elite Editorial',
        slug: a.slug,
        featuredImage: (a as any).featuredImage || undefined,
      }));
    // Bundled entries are static filler with no featuredImage -- when a slug
    // exists in both sources the CMS version (real data, incl. admin-set
    // photos) must win. Same precedence as CategoryContent.tsx / search route.ts.
    const bySlug = new Map<string, RelatedArticle>();
    for (const a of [...bundled, ...cmsArticles]) bySlug.set(a.slug, a);
    return prioritizeSubcategory(Array.from(bySlug.values()), subcategorySlug).slice(0, 3);
  } catch {
    return prioritizeSubcategory(bundled, subcategorySlug).slice(0, 3);
  }
}

/**
 * Same-category candidates are otherwise taken in plain array order, so a
 * category with more than 8 articles silently hides everything past the
 * first 8 (e.g. a jurisdiction cluster added after the original bundled set
 * would never surface on its own pillar article). Move same-subcategory
 * matches first -- still capped to 8 by the caller -- so a topic cluster
 * stays mutually linked as it grows, without touching unrelated articles'
 * ordering when there's no subcategory overlap to begin with.
 */
function prioritizeSubcategory(articles: RelatedArticle[], subcategorySlug?: string): RelatedArticle[] {
  if (!subcategorySlug) return articles;
  const matched = articles.filter((a) => a.subcategorySlug === subcategorySlug);
  const rest = articles.filter((a) => a.subcategorySlug !== subcategorySlug);
  return [...matched, ...rest];
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="pt-2 border-t-4 border-blue-600 mt-20 mb-24">
      <div className="container mx-auto px-0">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 pt-4 px-2">Related Guides</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-2">
          {articles.map((art) => (
            <Link key={art.id} href={articleUrl({ slug: art.slug, category: { slug: art.categorySlug } })} className="group block h-full">
              <div className="bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                  <Image
                    src={resolveArticleImage({ featuredImage: art.featuredImage, title: art.title, category: { name: art.category }, id: art.id, slug: art.slug })}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight mb-2">
                    {art.category}
                  </span>

                  <h3 className="text-[17px] font-bold text-slate-900 leading-[1.3] mb-3 group-hover:text-blue-700 transition-colors line-clamp-3">
                    {art.title}
                  </h3>

                  <p className="mt-auto pt-2 text-[12px] font-medium text-slate-400">
                    By <span className="hover:text-slate-600 transition-colors">{art.author}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
