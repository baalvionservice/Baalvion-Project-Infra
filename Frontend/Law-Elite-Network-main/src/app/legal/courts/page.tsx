import React from 'react';
import Link from 'next/link';
import { Landmark } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { courtUrl } from '@/lib/legal-case-url';
import { countryNameByCode } from '@/lib/countries';
import { getMergedCourts } from '@/lib/legal-server';

export const revalidate = 86400;

export default async function CourtsPage() {
  const courts = await getMergedCourts();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              Courts
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Courts referenced across Law Elite Network's legal case coverage.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <Link key={court.slug} href={courtUrl(court.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                <span className="kicker mb-2 inline-flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> {court.level}</span>
                <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{court.name}</h3>
                {court.countryCode && <p className="mt-1 text-[13px] text-slate-500 font-medium">{countryNameByCode(court.countryCode)}</p>}
              </Link>
            ))}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
