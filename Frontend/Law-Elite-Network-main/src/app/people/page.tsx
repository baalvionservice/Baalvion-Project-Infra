import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PeopleDirectory } from '@/components/people/PeopleDirectory';
import { PersonDisclaimer } from '@/components/people/PersonDisclaimer';
import { getMergedPeople } from '@/lib/people-server';

// Same rationale as /authors: cached and refreshed in the background rather
// than re-rendered per visitor.
export const revalidate = 86400;

export default async function PeoplePage() {
  const people = await getMergedPeople();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              People
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Reference profiles for notable actors, musicians, directors, producers, TV personalities,
              influencers, creators, athletes, lawyers, judges, and other public figures covered across
              the network.
            </p>
          </header>

          <div className="mb-10">
            <PersonDisclaimer />
          </div>

          <PeopleDirectory people={people} />

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
