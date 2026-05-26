
"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  category?: { name: string; slug: string };
  subcategory?: { name: string; slug: string };
  articleTitle?: string;
}

/**
 * @fileOverview Breadcrumbs
 * Precision SEO navigation component for the Law Elite Network.
 */
export function Breadcrumbs({ category, subcategory, articleTitle }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 animate-in fade-in slide-in-from-left-2 duration-700">
      <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
        <Home className="w-3 h-3" /> Home
      </Link>
      
      {category && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-200" />
          <Link href={`/law/${category.slug}`} className="hover:text-blue-600 transition-colors">
            {category.name}
          </Link>
        </>
      )}

      {subcategory && category && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-200" />
          <Link href={`/law/${category.slug}?sub=${subcategory.slug}`} className="hover:text-blue-600 transition-colors">
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
  );
}
