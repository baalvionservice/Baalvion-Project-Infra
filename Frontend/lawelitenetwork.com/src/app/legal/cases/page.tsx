import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CasesDirectory } from '@/components/legal/CasesDirectory';
import { getMergedLegalCases, getMergedCourts } from '@/lib/legal-server';

export const revalidate = 86400;

export default async function LegalCasesPage() {
  const cases = await getMergedLegalCases();
  const courtNames = Object.fromEntries((await getMergedCourts()).map((c) => [c.slug, c.name]));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              Legal Cases
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Reference profiles for notable legal cases — courts, parties, lawyers, judges, and
              timelines — factual and source-based.
            </p>
          </header>

          <CasesDirectory cases={cases} courtNames={courtNames} />

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
