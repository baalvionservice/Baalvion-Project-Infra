"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { LawAuthor } from '@/data/authors';

interface Section {
  slug: string;
  label: string;
}

interface AuthorsDirectoryProps {
  authors: LawAuthor[];
  counts: Record<string, number>;
  sectionsByAuthor: Record<string, string[]>;
  sections: Section[];
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AuthorsDirectory({ authors, counts, sectionsByAuthor, sections }: AuthorsDirectoryProps) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const labelOf = useMemo(() => new Map(sections.map((s) => [s.slug, s.label])), [sections]);

  const perSection = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of authors) for (const s of sectionsByAuthor[a.slug] || []) m.set(s, (m.get(s) || 0) + 1);
    return m;
  }, [authors, sectionsByAuthor]);

  // A section with nobody in it never shows up as a tab.
  const tabs = [{ slug: 'all', label: 'All', n: authors.length }].concat(
    sections.filter((s) => perSection.get(s.slug)).map((s) => ({ slug: s.slug, label: s.label, n: perSection.get(s.slug)! })),
  );

  const shown = authors.filter((a) => {
    if (section !== 'all' && !(sectionsByAuthor[a.slug] || []).includes(section)) return false;
    const q = query.trim().toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q);
  });

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-slate-300 pb-3">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
          {tabs.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => setSection(t.slug)}
                aria-pressed={section === t.slug}
                className={`border-b-2 pb-1 transition-colors ${
                  section === t.slug ? 'border-[#E13131] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label} <span className="text-slate-400">{t.n}</span>
              </button>
            </li>
          ))}
        </ul>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          aria-label="Search authors by name"
          className="w-48 border-b border-slate-400 bg-transparent py-1 text-sm placeholder:text-slate-400 focus:border-[#0F2440] focus:outline-none"
        />
      </div>

      {shown.length === 0 ? (
        <p className="py-16 font-serif italic text-slate-500">No authors match.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => {
            const n = counts[a.slug] || 0;
            const labels = (sectionsByAuthor[a.slug] || []).map((s) => labelOf.get(s)).filter(Boolean);
            return (
              <li key={a.slug}>
                <Link href={`/author/${a.slug}`} className="group block border-t-2 border-[#0F2440] pt-4">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#ece6d8]">
                    {a.avatarUrl ? (
                      <Image
                        src={a.avatarUrl}
                        alt={`Portrait of ${a.name}`}
                        fill
                        sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                        className="object-cover object-top grayscale transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-black tracking-tight text-[#0F2440]/25">
                        {initialsOf(a.name)}
                      </span>
                    )}
                  </div>
                  {labels.length > 0 && (
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E13131]">{labels.slice(0, 2).join(' · ')}{labels.length > 2 ? ` · +${labels.length - 2}` : ''}</p>
                  )}
                  <h2 className="mt-1 font-serif text-2xl font-black leading-tight text-[#0F2440] group-hover:underline decoration-[#E13131] decoration-2 underline-offset-4">
                    {a.name}
                  </h2>
                  <p className="mt-1 font-serif text-[15px] italic text-slate-600">{a.title}</p>
                  <p className="mt-2 text-[12px] font-medium uppercase tracking-wider text-slate-500">
                    {n} {n === 1 ? 'piece' : 'pieces'}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
