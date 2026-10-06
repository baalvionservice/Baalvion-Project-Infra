import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AuthorsDirectory } from '@/components/knowledge/AuthorsDirectory';
import {
  getMergedAuthors,
  getPublishedArticleCountsByAuthorSlug,
  getPublishedSectionsByAuthorSlug,
} from '@/lib/authors-server';
import { PRIMARY_NAV } from '@/lib/site-nav';

// /api/revalidate refreshes this on publish; the window is only the no-webhook safety net.
export const revalidate = 86400;

export default async function AuthorsIndexPage() {
  const [allAuthors, countsMap, sectionsMap] = await Promise.all([
    getMergedAuthors(),
    getPublishedArticleCountsByAuthorSlug(),
    getPublishedSectionsByAuthorSlug(),
  ]);

  // Only people with published work: the directory, the sitemap and each
  // profile's own noindex logic have to agree on who counts.
  const authors = allAuthors
    .filter((a) => (countsMap.get(a.slug) || 0) > 0)
    .sort((a, b) => (countsMap.get(b.slug) || 0) - (countsMap.get(a.slug) || 0) || a.name.localeCompare(b.name));

  const counts: Record<string, number> = Object.fromEntries(countsMap);
  const sectionsByAuthor: Record<string, string[]> = Object.fromEntries(sectionsMap);
  const sections = PRIMARY_NAV.map((n) => ({ slug: n.href.replace(/^\//, ''), label: n.label }));

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-slate-900">
      <Navbar />

      <main className="pt-14 pb-24">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <header className="mt-10 border-t-[5px] border-[#0F2440] pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#E13131]">The people behind the stories</p>
            <h1 className="mt-4 font-serif text-[2.9rem] font-black leading-[0.95] tracking-tight text-[#0F2440] sm:text-7xl lg:text-[5.5rem]">
              Our Authors
            </h1>
            <p className="mt-6 max-w-2xl border-t border-slate-300 pt-4 font-serif text-lg italic text-slate-600">
              Every article carries a name. Pick a writer to read their work.
            </p>
          </header>

          <AuthorsDirectory authors={authors} counts={counts} sectionsByAuthor={sectionsByAuthor} sections={sections} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
