import React from 'react';
import Link from 'next/link';
import { PERSON_CATEGORIES } from '@/types/person';
import type { PersonCategorySlug } from '@/types/person';

/** Category links with counts. Real links, so every category directory is crawlable and bookmarkable. */
export function PeopleTabs({ counts, active }: { counts: Record<string, number>; active?: PersonCategorySlug }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pill = (on: boolean) =>
    `px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
      on ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;
  return (
    <nav className="flex flex-wrap gap-2 mb-10" aria-label="Filter by category">
      <Link href="/people" aria-current={!active ? 'page' : undefined} className={pill(!active)}>
        All ({total})
      </Link>
      {PERSON_CATEGORIES.map((cat) =>
        counts[cat.slug] ? (
          <Link key={cat.slug} href={`/people/${cat.slug}`} aria-current={active === cat.slug ? 'page' : undefined} className={pill(active === cat.slug)}>
            {cat.plural} ({counts[cat.slug]})
          </Link>
        ) : null,
      )}
    </nav>
  );
}
