"use client";

import React, { useState } from 'react';
import { PersonCard, type PersonCardData } from './PersonCard';

const PAGE_SIZE = 60;

/** One category's people, revealed 60 at a time so a directory of hundreds stays light on a phone. */
export function PeopleGrid({ people }: { people: PersonCardData[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = people.slice(0, shown);

  if (people.length === 0) return <p className="text-slate-500 text-sm">No profiles in this category yet.</p>;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
        {visible.map((person) => (
          <PersonCard key={person.slug} person={person} />
        ))}
      </div>
      {people.length > visible.length && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="h-11 px-8 border border-slate-300 text-[13px] font-bold uppercase tracking-wider text-slate-900 hover:border-slate-900 transition-colors"
          >
            Show more ({people.length - visible.length} left)
          </button>
        </div>
      )}
    </div>
  );
}
