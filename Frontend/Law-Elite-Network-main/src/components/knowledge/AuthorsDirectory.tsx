"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { classifyPracticeArea, isEditorRole, type LawAuthor } from '@/data/authors';
import { resolvePersonImage } from '@/lib/article-art';

interface AuthorsDirectoryProps {
  authors: LawAuthor[];
  counts: Record<string, number>;
}

// Search + practice-area filter -- needed once the roster passed ~100
// profiles; a flat grid at that size has no way to find one specialist.
export function AuthorsDirectory({ authors, counts }: AuthorsDirectoryProps) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<string>('All');

  const withArea = useMemo(
    () => authors.map((a) => ({ author: a, area: classifyPracticeArea(a) })),
    [authors]
  );

  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { area: a } of withArea) counts.set(a, (counts.get(a) || 0) + 1);
    return counts;
  }, [withArea]);

  // Only real, populated buckets appear -- never a filter pill with 0 results.
  const areaOptions = useMemo(
    () => ['All', ...Array.from(areaCounts.keys()).sort((a, b) => (areaCounts.get(b)! - areaCounts.get(a)!))],
    [areaCounts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withArea
      .filter(({ area: a }) => area === 'All' || a === area)
      .filter(({ author }) => {
        if (!q) return true;
        return (
          author.name.toLowerCase().includes(q) ||
          author.title.toLowerCase().includes(q) ||
          author.credentials.toLowerCase().includes(q)
        );
      })
      .map(({ author }) => author);
  }, [withArea, area, query]);

  const editors = filtered.filter((a) => isEditorRole(a.title));
  const contributors = filtered.filter((a) => !isEditorRole(a.title));

  return (
    <div>
      <div className="mb-10 space-y-5">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contributors by name or firm"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {areaOptions.map((opt) => {
            const count = opt === 'All' ? authors.length : areaCounts.get(opt) || 0;
            const active = opt === area;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setArea(opt)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt}
                <span className={active ? 'text-blue-100' : 'text-slate-400'}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {editors.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 border-b-2 border-slate-900 pb-2 mb-8">
            Editors
          </h2>
          <AuthorGrid authors={editors} counts={counts} />
        </section>
      )}

      {contributors.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 border-b-2 border-slate-900 pb-2 mb-8">
            Contributors
          </h2>
          <AuthorGrid authors={contributors} counts={counts} />
        </section>
      )}

      {editors.length === 0 && contributors.length === 0 && (
        <div className="py-24 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
          <p className="text-sm text-slate-500">No contributors match "{query}" in {area === 'All' ? 'any practice area' : area}.</p>
        </div>
      )}
    </div>
  );
}

function AuthorGrid({ authors, counts }: { authors: LawAuthor[]; counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {authors.map((author) => {
        const count = counts[author.slug] || 0;
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
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {author.name}
                  </h3>
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
  );
}
