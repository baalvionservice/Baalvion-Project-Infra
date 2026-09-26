"use client";

import React, { useMemo, useState } from 'react';
import { EntertainmentCard } from './EntertainmentCard';
import { ENTERTAINMENT_TYPES } from '@/types/entertainment';
import type { EntertainmentEntity, EntertainmentTypeSlug } from '@/types/entertainment';

/** Client-side type filter over the full entity list — same pattern as the other directories. */
export function EntertainmentDirectory({ entities }: { entities: EntertainmentEntity[] }) {
  const [active, setActive] = useState<EntertainmentTypeSlug | 'all'>('all');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    entities.forEach((e) => map.set(e.type, (map.get(e.type) || 0) + 1));
    return map;
  }, [entities]);

  const visible = active === 'all' ? entities : entities.filter((e) => e.type === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter by type">
        <button
          onClick={() => setActive('all')}
          aria-pressed={active === 'all'}
          className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
            active === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({entities.length})
        </button>
        {ENTERTAINMENT_TYPES.map((t) => {
          const count = counts.get(t.slug) || 0;
          if (!count) return null;
          return (
            <button
              key={t.slug}
              onClick={() => setActive(t.slug)}
              aria-pressed={active === t.slug}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                active === t.slug ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.plural} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-slate-500 text-sm">No entries in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {visible.map((entity) => (
            <EntertainmentCard key={entity.slug} entity={entity} />
          ))}
        </div>
      )}
    </div>
  );
}
