import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AuthorsDirectory } from '@/components/knowledge/AuthorsDirectory';
import { authorNameToSlug } from '@/data/authors';
import { getMergedAuthors } from '@/lib/authors-server';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

// AdSense-readiness retirement (see category-slugs.ts's CURRENT_CATEGORY_SLUGS
// comment): the per-author "N guides" count below feeds directly into the
// same directory that links to each author's profile, so it must match what
// that profile now actually shows (see author/[slug]/page.tsx's matching
// filter) rather than counting retired-category work nobody can click
// through to from here.
const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategoryArticle(a: { category?: { slug?: string } }): boolean {
  const rawSlug = a.category?.slug;
  return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
}

// Serve a cached page and refresh it in the background every 5 minutes,
// instead of re-rendering (and re-fetching from the CMS) on every single
// visitor/Googlebot request.
export const revalidate = 300;

export default async function AuthorsIndexPage() {
  const [authors, cmsArticles] = await Promise.all([
    getMergedAuthors(),
    cmsGetArticles().catch(() => []),
  ]);
  // CMS-authored guides (e.g. the maritime/injury desk) never lived in the
  // bundled array, so counting bundled-only silently showed "0 guides" for
  // any contributor whose real work is CMS-sourced. mergeArticles() is the
  // same CMS-wins-by-slug pool the homepage already uses.
  const articles = mergeArticles(cmsArticles).filter(isKeptCategoryArticle);

  // A plain slug -> count map, not a closure -- functions can't cross the
  // server/client component boundary as props.
  const counts: Record<string, number> = {};
  for (const a of articles) {
    const slug = authorNameToSlug(a.author);
    if (slug) counts[slug] = (counts[slug] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-16 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Editorial Team</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              Our Contributors
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Every guide on Law Elite Network is written and edited by our editorial team, following the
              research, sourcing, and fact-checking process set out in our{' '}
              <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
              Our coverage is general legal education for a worldwide audience — not jurisdiction-specific
              legal advice.
            </p>
            <p className="text-[14px] text-slate-500 leading-relaxed mt-6 max-w-2xl">
              <span className="font-bold text-slate-700">Editors</span> lead a practice-area desk and edit
              guides in that subject; <span className="font-bold text-slate-700">contributors</span> write
              guides. Neither role implies a specific guide was independently reviewed by a licensed
              attorney — where that happened, it's credited by name directly on that article (see our{' '}
              <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>).
            </p>
          </header>

          <AuthorsDirectory authors={authors} counts={counts} />

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
