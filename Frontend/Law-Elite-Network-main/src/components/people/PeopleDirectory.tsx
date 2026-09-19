"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PersonCard } from './PersonCard';
import { PERSON_CATEGORIES } from '@/types/person';
import type { Person, PersonCategorySlug } from '@/types/person';

/**
 * Filter over the full people list. Used two ways: client-side tab
 * switching on `/people` (no `initialCategory`, all filtering is in-page),
 * and as the display for a real `/people/{category}` directory route (see
 * `[slug]/page.tsx`'s isPersonCategorySlug branch), where the tabs are real
 * links so each category has its own crawlable, bookmarkable URL.
 */
export function PeopleDirectory({ people, initialCategory }: { people: Person[]; initialCategory?: PersonCategorySlug }) {
  const [active, setActive] = useState<PersonCategorySlug | 'all'>(initialCategory ?? 'all');
  const linked = !!initialCategory;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    people.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [people]);

  const visible = active === 'all' ? people : people.filter((p) => p.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter by category">
        {linked ? (
          <Link
            href="/people"
            aria-current={active === 'all' ? 'page' : undefined}
            className="px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            All
          </Link>
        ) : (
          <button
            onClick={() => setActive('all')}
            aria-pressed={active === 'all'}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
              active === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({people.length})
          </button>
        )}
        {PERSON_CATEGORIES.map((cat) => {
          const count = counts.get(cat.slug) || 0;
          if (!count) return null;
          const isActive = active === cat.slug;
          if (linked) {
            return (
              <Link
                key={cat.slug}
                href={`/people/${cat.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.plural} ({count})
              </Link>
            );
          }
          return (
            <button
              key={cat.slug}
              onClick={() => setActive(cat.slug)}
              aria-pressed={isActive}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.plural} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-slate-500 text-sm">No profiles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
          {visible.map((person) => (
            <PersonCard key={person.slug} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
