import React from 'react';
import { EntertainmentCard } from './EntertainmentCard';
import type { EntertainmentEntity } from '@/types/entertainment';

/** Shared grid for a single-type entertainment hub (/movies, /tv, /music) -- same card as the full /entertainment directory, just pre-scoped to one or more `type`s so each pillar gets its own clean URL without duplicating markup. */
export function EntertainmentTypeHub({ entities }: { entities: EntertainmentEntity[] }) {
  if (entities.length === 0) {
    return <p className="text-slate-500 text-sm">No entries in this section yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {entities.map((entity) => (
        <EntertainmentCard key={entity.slug} entity={entity} />
      ))}
    </div>
  );
}
