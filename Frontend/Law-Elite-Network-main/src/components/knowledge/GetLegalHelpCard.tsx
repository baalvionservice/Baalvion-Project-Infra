import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// Homepage hero sidebar's conversion block -- a boxed "inside this issue"
// masthead directory rather than an icon-card list, every link resolving to
// a real, unauthenticated route on the network (no invented rates/products/offers).
const LINKS = [
  {
    title: 'Search Legal Guides',
    body: 'Find a guide on any legal topic by keyword.',
    href: '/search',
  },
  {
    title: 'Browse Practice Areas',
    body: 'Jump to a specific area of law.',
    href: '#legal-guides',
  },
  {
    title: 'Join as a Legal Professional',
    body: 'List your practice on the network.',
    href: '/register',
  },
  {
    title: 'How We Vet Our Content',
    body: 'Read our sourcing and review standards.',
    href: '/editorial-standards',
  },
];

export function GetLegalHelpCard() {
  return (
    <aside className="border border-slate-200">
      <div className="px-5 py-4 border-b-2 border-slate-900 bg-slate-50/60">
        <h2 className="font-headline text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 m-0">
          Get Legal Help
        </h2>
      </div>
      <div className="divide-y divide-slate-100">
        {LINKS.map((l) => (
          <Link
            key={l.title}
            href={l.href}
            className="group flex items-start gap-3 p-5 hover:bg-slate-50/60 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-news-600 mt-2 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[13.5px] font-bold text-slate-900 group-hover:text-news-600 transition-colors">
                {l.title}
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{l.body}</p>
            </div>
            <ArrowUpRight
              className="w-3.5 h-3.5 text-slate-300 group-hover:text-news-600 transition-colors shrink-0 mt-1"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}
