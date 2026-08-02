import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

/**
 * Segment-scoped not-found — renders for any unrecognized top-level slug
 * (bad category, typo, stray backlink, crawler probe). Gives a real 404 HTTP
 * status (via notFound() in page.tsx) while keeping the themed empty state
 * instead of falling through to the generic site-wide 404.
 */
export default function CategoryNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center pt-[96px]">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
        <SearchX className="w-10 h-10" />
      </div>
      <h2 className="font-headline text-3xl font-extrabold text-slate-900 mb-3">Topic not found</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
        We couldn&rsquo;t find this practice area. It may have moved or been renamed.
      </p>
      <Link href="/">
        <button className="bg-[#0B1F3A] text-white px-8 h-12 rounded-md font-bold text-sm hover:bg-blue-800 transition-colors">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
