import React from 'react';
import Link from 'next/link';

// The methodology we actually follow (mirrors /editorial-standards) --
// only principles the site's real practices back up, no invented claims.
const PRINCIPLES = [
  {
    title: 'Plain language',
    body: 'Complex legal concepts are explained for ordinary readers, not for other lawyers.',
  },
  {
    title: 'Jurisdiction first',
    body: 'Legal rules are connected to the jurisdiction in which they apply, not treated as universal.',
  },
  {
    title: 'Editorial independence',
    body: 'Educational content is kept separate from advertising and sponsorship decisions.',
  },
  {
    title: 'Source-conscious',
    body: 'Legal claims are checked against authoritative sources where appropriate.',
  },
  {
    title: 'Corrections matter',
    body: 'Material errors are acknowledged and corrected transparently, not quietly edited away.',
  },
  {
    title: 'Education, not representation',
    body: "We provide general legal education. We don't replace qualified legal counsel.",
  },
];

/**
 * @fileOverview TrustSection
 * The homepage's editorial-standard statement -- six methodology principles,
 * laid out as a ruled charter/table rather than an icon-card grid, since
 * this is the single highest-trust section on the page and should read like
 * a printed masthead standard, not a marketing feature list.
 */
export function TrustSection() {
  return (
    <div className="py-20 border-t border-slate-100">
      <div className="max-w-2xl mx-auto text-center space-y-2 mb-14">
        <span className="kicker justify-center">Editorial Standards</span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Editorial Standard</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Six principles govern everything we publish.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 border-t border-l border-slate-200">
        {PRINCIPLES.map((p, i) => (
          <div key={p.title} className="border-b border-r border-slate-200 p-6 md:p-8">
            <span className="font-serif text-2xl italic text-news-600" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="font-headline text-base font-bold text-slate-900 mt-2">{p.title}</h3>
            <p className="text-[13.5px] text-slate-500 leading-relaxed mt-1.5">{p.body}</p>
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
