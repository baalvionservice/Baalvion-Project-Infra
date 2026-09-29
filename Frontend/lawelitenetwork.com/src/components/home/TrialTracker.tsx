"use client";

import React from 'react';
import Link from 'next/link';
import { Gavel, Calendar, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export interface TrialTrackerItem {
  id: string;
  caseName: string;
  caseSlug: string;
  court: string;
  judge: string;
  status: 'PRE-TRIAL' | 'ORAL ARGUMENTS' | 'EVIDENTIARY HEARINGS' | 'VERDICT PENDING';
  nextDate: string;
  keyIssue: string;
  featuredPeople: { name: string; slug: string }[];
}

const TRIALS_DATA: TrialTrackerItem[] = [
  {
    id: 'trial-1',
    caseName: 'Trump v. United States (Immunity Remand)',
    caseSlug: 'donald-trump-constitutional-immunity-ruling-analysis',
    court: 'U.S. District Court, D.C. Circuit',
    judge: 'Hon. Tanya Chutkan',
    status: 'EVIDENTIARY HEARINGS',
    nextDate: 'OCT 14, 2026',
    keyIssue: 'Evidentiary determination of official vs. unofficial presidential acts under Supreme Court immunity framework.',
    featuredPeople: [
      { name: 'Donald Trump', slug: 'donald-trump' },
      { name: 'Jack Smith', slug: 'jack-smith' },
    ],
  },
  {
    id: 'trial-2',
    caseName: 'Tornetta v. Musk (Delaware Chancery Compensation Appeal)',
    caseSlug: 'elon-musk-delaware-corporate-governance-chancery-court',
    court: 'Delaware Supreme Court',
    judge: 'Chief Justice Collins J. Seitz Jr.',
    status: 'ORAL ARGUMENTS',
    nextDate: 'OCT 28, 2026',
    keyIssue: 'Review of Chancery Court rescission of Tesla executive compensation package and MFW fiduciary compliance.',
    featuredPeople: [
      { name: 'Elon Musk', slug: 'elon-musk' },
    ],
  },
  {
    id: 'trial-3',
    caseName: 'State of Georgia v. Donald Trump et al. (RICO Proceedings)',
    caseSlug: 'fani-willis-racketeering-statute-jurisprudence-analysis',
    court: 'Fulton County Superior Court',
    judge: 'Hon. Scott McAfee',
    status: 'PRE-TRIAL',
    nextDate: 'NOV 12, 2026',
    keyIssue: 'Interlocutory appellate review of disqualification motions and multi-defendant severance applications.',
    featuredPeople: [
      { name: 'Donald Trump', slug: 'donald-trump' },
      { name: 'Fani Willis', slug: 'fani-willis' },
    ],
  },
];

export function TrialTracker() {
  return (
    <section className="py-8 bg-slate-950 border-y-4 border-[#E13131] text-white p-6 sm:p-8 rounded-sm shadow-xl my-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-[#E13131] text-white p-2 rounded-sm shadow-md">
            <Gavel className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E13131] block">
              2026 HIGH-PROFILE DOCKETS
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none mt-1">
              TRIAL &amp; COURT DOCKET TRACKER
            </h2>
          </div>
        </div>
        <Link
          href="/legal/cases"
          className="text-[11px] font-black uppercase tracking-wider text-white bg-[#E13131] hover:bg-red-700 px-4 py-2 rounded-sm transition-colors flex items-center gap-1"
        >
          All Legal Cases <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TRIALS_DATA.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 hover:border-[#E13131] p-5 rounded-sm flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-[#E13131] text-white text-[9.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-xs">
                  <AlertCircle className="w-3 h-3" /> {item.status}
                </span>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#E13131]" /> {item.nextDate}
                </span>
              </div>

              <h3 className="font-serif text-lg font-black text-white group-hover:text-[#E13131] transition-colors leading-snug">
                {item.caseName}
              </h3>

              <p className="text-[11.5px] font-semibold text-slate-400 mt-2">
                <strong className="text-slate-300">Court:</strong> {item.court}
              </p>
              <p className="text-[11.5px] font-semibold text-slate-400">
                <strong className="text-slate-300">Presiding:</strong> {item.judge}
              </p>

              <p className="text-[13px] text-slate-300 font-serif leading-relaxed mt-3 border-t border-slate-800 pt-3">
                {item.keyIssue}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {item.featuredPeople.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/people/${p.slug}`}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-800 hover:bg-[#E13131] hover:text-white px-2 py-0.5 rounded-xs transition-colors"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
              <Link
                href={`/article/${item.caseSlug}`}
                className="text-[11px] font-black uppercase tracking-wider text-[#E13131] group-hover:text-white transition-colors"
              >
                Docket Analysis →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
