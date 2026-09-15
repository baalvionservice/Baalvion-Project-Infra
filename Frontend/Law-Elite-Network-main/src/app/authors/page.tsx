import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AuthorsDirectory } from '@/components/knowledge/AuthorsDirectory';
import { getMergedAuthors, getPublishedArticleCountsByAuthorSlug } from '@/lib/authors-server';

// Serve a cached page and refresh it in the background every 5 minutes,
// instead of re-rendering (and re-fetching from the CMS) on every single
// visitor/Googlebot request.
// Raised off the 5-minute clock: /api/revalidate's revalidateTag() refreshes
// this on publish, so the window is only the no-webhook safety net.
export const revalidate = 86400;

export default async function AuthorsIndexPage() {
  const [allAuthors, countsMap] = await Promise.all([
    getMergedAuthors(),
    getPublishedArticleCountsByAuthorSlug(),
  ]);

  // AdSense second-rejection finding: 23 of 24 profiles rendered "No
  // published guides yet" -- noindexing the empty profile (author/[slug]/
  // layout.tsx) stops it being indexed, but a human reviewer (or any visitor)
  // clicking through from this directory still landed on one. Hiding them
  // from the directory itself, not just their own page, is the actual fix.
  const authors = allAuthors.filter((a) => (countsMap.get(a.slug) || 0) > 0);

  // A plain slug -> count map, not a closure -- functions can't cross the
  // server/client component boundary as props.
  const counts: Record<string, number> = Object.fromEntries(countsMap);

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
