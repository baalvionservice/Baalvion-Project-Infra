import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { authorNameToSlug } from '@/data/authors';
import { getMergedAuthors } from '@/lib/authors-server';
import { mergeArticles } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { resolvePersonImage } from '@/lib/article-art';

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
  const articles = mergeArticles(cmsArticles);

  const countFor = (slug: string) =>
    articles.filter((a) => authorNameToSlug(a.author) === slug).length;

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
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {authors.map((author) => {
              const count = countFor(author.slug);
              return (
                <Link key={author.slug} href={`/author/${author.slug}`} className="group block h-full">
                  <article className="p-7 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:shadow-xl transition-all h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                        <Image
                          src={resolvePersonImage({ avatarUrl: author.avatarUrl, name: author.name, avatarSeed: author.avatarSeed })}
                          alt={author.name}
                          fill
                          className="object-cover"
                          data-ai-hint="professional portrait"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {author.name}
                        </h2>
                        <p className="text-[13px] font-semibold text-blue-600">{author.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 mb-5 flex-1">
                      {author.bio.split('\n')[0]}
                    </p>
                    <p className="text-[12px] font-medium text-slate-400 mt-auto">
                      {author.credentials} · {count} {count === 1 ? 'guide' : 'guides'}
                    </p>
                  </article>
                </Link>
              );
            })}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
