import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function CountryNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center pt-[96px]">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
        <SearchX className="w-10 h-10" />
      </div>
      <h2 className="font-headline text-3xl font-extrabold text-slate-900 mb-3">Country not found</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
        We don&rsquo;t have this country in our directory yet.
      </p>
      <Link href="/countries">
        <button className="bg-[#0B1F3A] text-white px-8 h-12 rounded-md font-bold text-sm hover:bg-blue-800 transition-colors">
          Browse All Countries
        </button>
      </Link>
    </div>
  );
}
