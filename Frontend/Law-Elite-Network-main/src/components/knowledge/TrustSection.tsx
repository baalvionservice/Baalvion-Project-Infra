"use client";

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Languages,
  MapPin,
  BookMarked,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';

// The methodology we actually follow (mirrors /editorial-standards) --
// only principles the site's real practices back up, no invented claims.
const PRINCIPLES = [
  {
    icon: Languages,
    title: 'Plain language',
    body: 'Complex legal concepts are explained for ordinary readers, not for other lawyers.',
  },
  {
    icon: MapPin,
    title: 'Jurisdiction first',
    body: 'Legal rules are connected to the jurisdiction in which they apply, not treated as universal.',
  },
  {
    icon: ShieldCheck,
    title: 'Editorial independence',
    body: 'Educational content is kept separate from advertising and sponsorship decisions.',
  },
  {
    icon: BookMarked,
    title: 'Source-conscious',
    body: 'Legal claims are checked against authoritative sources where appropriate.',
  },
  {
    icon: RotateCcw,
    title: 'Corrections matter',
    body: 'Material errors are acknowledged and corrected transparently, not quietly edited away.',
  },
  {
    icon: GraduationCap,
    title: 'Education, not representation',
    body: "We provide general legal education. We don't replace qualified legal counsel.",
  },
];

/**
 * @fileOverview TrustSection
 * The homepage's editorial-standard statement -- six methodology principles.
 */
export function TrustSection() {
  return (
    <div className="py-20 border-t border-slate-100">
      <div className="max-w-2xl mx-auto text-center space-y-2 mb-12">
        <span className="kicker justify-center">Editorial Standards</span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Editorial Standard</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Six principles govern everything we publish.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 max-w-5xl mx-auto">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <p.icon className="w-[18px] h-[18px] text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">{p.title}</h3>
            <p className="text-[13.5px] text-slate-500 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-[12.5px] font-bold uppercase tracking-wider">
        <Link href="/editorial-standards" className="text-blue-700 hover:text-news-600 transition-colors">
          Editorial Standards
        </Link>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <Link href="/editorial-process" className="text-blue-700 hover:text-news-600 transition-colors">
          Editorial Process
        </Link>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <Link href="/corrections" className="text-blue-700 hover:text-news-600 transition-colors">
          Corrections Policy
        </Link>
      </div>
    </div>
  );
}
