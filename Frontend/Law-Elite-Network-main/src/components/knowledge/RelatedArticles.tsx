"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getArticlesByCategorySlug } from '@/data/law-content';

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  slug: string;
}

interface RelatedArticlesProps {
  /** Slug of the article currently being read — excluded from its own related list. */
  currentSlug: string;
  categorySlug?: string;
  categoryName?: string;
}

/**
 * Same-category interlinking, sourced from the CMS first (real published
 * articles) with the bundled editorial library as an always-present fallback.
 * Never shows placeholder/unrelated content — an empty result renders nothing.
 */
export function RelatedArticles({ currentSlug, categorySlug, categoryName }: RelatedArticlesProps) {
  const [related, setRelated] = useState<RelatedArticle[]>([]);

  useEffect(() => {
    if (!categorySlug) {
      setRelated([]);
      return;
    }
    let cancelled = false;

    const bundled: RelatedArticle[] = getArticlesByCategorySlug(categorySlug)
      .filter((a) => a.slug !== currentSlug)
      .map((a) => ({ id: a.id, title: a.title, category: a.category.name, author: a.author, slug: a.slug }));

    fetch(`/api/cms/articles?category=${encodeURIComponent(categorySlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const cmsArticles: RelatedArticle[] = Array.isArray(j?.data)
          ? j.data
              .filter((a: any) => a.slug && a.slug !== currentSlug)
              .map((a: any) => ({
                id: a.id,
                title: a.title,
                category: a.category?.name || categoryName || 'Legal Guide',
                author: 'Law Elite Editorial',
                slug: a.slug,
              }))
          : [];
        const bySlug = new Map<string, RelatedArticle>();
        for (const a of [...cmsArticles, ...bundled]) bySlug.set(a.slug, a);
        setRelated(Array.from(bySlug.values()).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated(bundled.slice(0, 4));
      });

    return () => {
      cancelled = true;
    };
  }, [currentSlug, categorySlug, categoryName]);

  if (related.length === 0) return null;

  return (
    <section className="pt-2 border-t-4 border-blue-600 mt-20 mb-24">
      <div className="container mx-auto px-0">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 pt-4 px-2">Related Articles</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-2">
          {related.map((art) => (
            <Link key={art.id} href={`/article/${art.slug}`} className="group block h-full">
              <div className="bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                  <Image
                    src={`https://picsum.photos/seed/${art.id}/400/260`}
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
