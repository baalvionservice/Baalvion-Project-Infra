
"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

interface BreadcrumbsProps {
  category?: { name: string; slug: string };
  /** article.subcategory -- links to the real ?sub= deep link the mega-menu already uses, not a fabricated URL. */
  subcategory?: { name: string; slug: string };
  articleTitle?: string;
}

/**
 * @fileOverview Breadcrumbs
 * Precision SEO navigation component for the Law Elite Network:
 * Home -> Practice Area -> Subcategory -> Article title.
 * Subcategory is optional and only renders when the article actually
 * carries real data for it -- never fabricated.
 */
export function Breadcrumbs({ category, subcategory, articleTitle }: BreadcrumbsProps) {
  // A CMS article's category slug isn't guaranteed to be one of the site's 8
  // real category pages (e.g. a narrow one-off like `criminal-law-dui-defense`
  // instead of `criminal-law`) -- articleUrl() already falls back to the flat
  // /article/{slug} URL for those (see article-url.ts), so this crumb must
  // apply the same check or it links straight into a 404.
  const hasRealCategory =
    !!category && (CURRENT_CATEGORY_SLUGS as readonly string[]).includes(category.slug);
  // The 10px trail below stays as SEO/orientation, but it's too low-contrast
  // to be the ONLY way back once a reader has scrolled past a long article --
  // this is the same high-visibility "go up one level" link every category
  // page (see [categorySlug]/page.tsx's "All Topics" link) and dashboard
  // detail page already gives users; the article view was missing it.
  const backHref = hasRealCategory && category
    ? `/${category.slug}${subcategory?.slug ? `?sub=${subcategory.slug}` : ''}`
    : '/';
  const backLabel = hasRealCategory && category ? category.name : 'Home';

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-left-2 duration-700">
      <Link
        href={backHref}
        className="flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors group mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to {backLabel}
      </Link>

      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-wrap">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
          <Home className="w-3 h-3" /> Home
        </Link>

        {hasRealCategory && category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-200" />
            <Link href={`/${category.slug}`} className="hover:text-blue-600 transition-colors">
              {category.name}
            </Link>
          </>
        )}

        {hasRealCategory && category && subcategory?.slug && subcategory?.name && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-200" />
            <Link href={`/${category.slug}?sub=${subcategory.slug}`} className="hover:text-blue-600 transition-colors">
              {subcategory.name}
            </Link>
          </>
        )}

        {articleTitle && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-200" />
            <span className="text-slate-900 truncate max-w-[200px]">{articleTitle}</span>
          </>
        )}
      </nav>
    </div>
  );
}
