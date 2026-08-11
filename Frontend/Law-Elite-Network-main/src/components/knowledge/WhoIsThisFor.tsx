import React from 'react';
import { GraduationCap, Scale, Briefcase, Globe2, Search } from 'lucide-react';

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'Students & researchers',
    body: 'Studying a legal topic or system and looking for a clear starting point.',
  },
  {
    icon: Scale,
    title: 'People researching their rights',
    body: 'Trying to understand a legal right, process, or procedure before taking action.',
  },
  {
    icon: Briefcase,
    title: 'Business owners & professionals',
    body: 'Getting oriented on regulatory, contractual, or compliance concepts that affect their work.',
  },
  {
    icon: Globe2,
    title: "Anyone learning another country's legal system",
    body: 'Comparing how a legal concept works across different jurisdictions.',
  },
  {
    icon: Search,
    title: 'General legal information seekers',
    body: 'Anyone who wants a plain-language explanation before deciding on next steps.',
  },
];

/**
 * Homepage audience section. Deliberately stops short of implying the site
 * replaces professional legal advice -- see PlatformIntro for that
 * distinction, which this section assumes rather than repeats.
 */
export function WhoIsThisFor() {
  return (
    <section className="py-14 border-t border-slate-200">
      <div className="max-w-2xl mb-8">
        <span className="kicker">Audience</span>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Who Is Law Elite Network For?
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mt-2">
          Our guides are written for a general audience, not for a specific case or client.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
        {AUDIENCES.map((a) => (
          <div key={a.title} className="flex gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <a.icon className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">{a.title}</h3>
              <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
