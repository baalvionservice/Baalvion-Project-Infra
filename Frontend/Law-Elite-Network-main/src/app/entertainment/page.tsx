import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { EntertainmentDirectory } from '@/components/entertainment/EntertainmentDirectory';
import { getMergedEntertainmentEntities } from '@/lib/entertainment-server';

export const revalidate = 86400;

export default async function EntertainmentHubPage() {
  const entities = await getMergedEntertainmentEntities();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              Entertainment
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Reference entries for movies, TV shows, streaming shows, music releases, albums, songs,
              awards, and entertainment events covered across the network — including the people
              involved in each one.
            </p>
          </header>

          <EntertainmentDirectory entities={entities} />

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
