import React from 'react';
import Link from 'next/link';
import { Search, Scale, Award, ShieldCheck, ArrowUpRight } from 'lucide-react';

// Homepage hero sidebar's conversion block -- the Investopedia-style
// "find a product" module, but every link here resolves to a real,
// unauthenticated route on the network (no invented rates/products/offers).
const LINKS = [
  {
    icon: Search,
    title: 'Search the Directory',
    body: 'Find guides and listed practitioners by keyword.',
    href: '/search',
  },
  {
    icon: Scale,
    title: 'Browse Practice Areas',
    body: 'Jump to a specific area of law.',
    href: '#legal-guides',
  },
  {
    icon: Award,
    title: 'Join as a Legal Professional',
    body: 'List your practice on the network.',
    href: '/register',
  },
  {
    icon: ShieldCheck,
    title: 'How We Vet Our Content',
    body: 'Read our sourcing and review standards.',
    href: '/editorial-standards',
  },
];

export function GetLegalHelpCard() {
  return (
    <aside className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
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
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <l.icon className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
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
