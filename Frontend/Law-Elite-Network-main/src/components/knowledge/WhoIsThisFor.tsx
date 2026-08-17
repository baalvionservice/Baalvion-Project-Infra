import React from 'react';

const AUDIENCES = [
  {
    title: 'Students & researchers',
    body: 'Studying a legal topic or system and looking for a clear starting point.',
  },
  {
    title: 'People researching their rights',
    body: 'Trying to understand a legal right, process, or procedure before taking action.',
  },
  {
    title: 'Business owners & professionals',
    body: 'Getting oriented on regulatory, contractual, or compliance concepts that affect their work.',
  },
  {
    title: "Anyone learning another country's legal system",
    body: 'Comparing how a legal concept works across different jurisdictions.',
  },
  {
    title: 'General legal information seekers',
    body: 'Anyone who wants a plain-language explanation before deciding on next steps.',
  },
];

/**
 * Homepage audience section. A pull-quote/byline treatment (serif italic
 * lead-in, ruled left edge) instead of an icon-card grid -- deliberately
 * distinct from WhatYouCanFind's numbered list just above it. Stops short of
 * implying the site replaces professional legal advice -- see PlatformIntro
 * for that distinction, which this section assumes rather than repeats.
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
        {AUDIENCES.map((a) => (
          <div
            key={a.title}
            className="border-l-2 border-slate-200 hover:border-news-600 pl-5 py-4 transition-colors"
          >
            <h3 className="font-serif italic text-lg font-semibold text-slate-900 leading-snug">{a.title}</h3>
            <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
