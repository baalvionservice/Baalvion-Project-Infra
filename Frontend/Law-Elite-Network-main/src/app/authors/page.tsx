"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllAuthors, authorNameToSlug, type LawAuthor } from '@/data/authors';
import { getAllArticles } from '@/data/law-content';

export default function AuthorsIndexPage() {
  const [authors, setAuthors] = useState<LawAuthor[]>(getAllAuthors());
  const articles = getAllArticles();

  // Merge CMS-managed contributors over the bundled baseline (CMS wins by slug),
  // so anyone added in the admin console appears in the directory.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/cms/authors');
        if (!r.ok) return;
        const j = await r.json();
        const cms = Array.isArray(j?.data) ? j.data : [];
        if (cancelled || cms.length === 0) return;
        const mapped: LawAuthor[] = cms.map((d: Record<string, unknown>) => ({
          slug: String(d.slug),
          name: String(d.name),
          title: (d.title as string) || '',
          credentials: (d.credentials as string) || '',
          bio: (d.bio as string) || '',
          expertise: Array.isArray(d.expertise) ? (d.expertise as string[]) : [],
          avatarSeed: String(d.slug),
          avatarUrl: (d.avatarUrl as string) || undefined,
          social: (d.social as LawAuthor['social']) || undefined,
        }));
        const bySlug = new Map<string, LawAuthor>();
        getAllAuthors().forEach((a) => bySlug.set(a.slug, a));
        mapped.forEach((a) => bySlug.set(a.slug, a));
        setAuthors(Array.from(bySlug.values()));
      } catch {
        /* keep bundled */
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
              Every guide on Law Elite Network is written and reviewed by legal editors and writers with
              real subject expertise. Our coverage is general legal education for a worldwide audience —
              not jurisdiction-specific legal advice.
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
                          src={author.avatarUrl || `https://picsum.photos/seed/${author.avatarSeed}/200/200`}
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
