import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// Every entry links to a section or route that already exists on the site --
// no glossary/"research resources" page exists yet, so this deliberately
// ships 5 items rather than inventing a 6th destination.
const ITEMS = [
  {
    title: 'Legal Guides',
    body: 'Practical explanations of legal concepts, procedures, rights, and obligations.',
    href: '#legal-guides',
  },
  {
    title: 'Jurisdiction-Based Information',
    body: 'Explore legal information according to the country or jurisdiction where the law applies.',
    href: '/countries',
  },
  {
    title: 'Legal Topics',
    body: 'Browse different areas of law and discover relevant educational resources.',
    href: '#practice-areas',
  },
  {
    title: 'Legal News & Developments',
    body: 'Follow important legal and regulatory developments.',
    href: '/news',
  },
  {
    title: 'Sourcing & Editorial Standards',
    body: 'See how information is sourced, reviewed, and kept current on the network.',
    href: '/editorial-disclosure-policy',
  },
];

/**
 * Homepage orientation list -- answers "what can I find here" in one glance,
 * right below the hero. A numbered contents list (masthead/table-of-contents
 * treatment) rather than an icon-card grid, so it reads as an index of the
 * publication rather than a SaaS feature grid. Every href resolves to a real
 * route or in-page section; none of these are placeholder destinations.
 */
export function WhatYouCanFind() {
  return (
    <section className="py-14 border-t border-slate-200">
      <div className="max-w-2xl mb-8">
        <span className="kicker">Start Here</span>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          What You Can Find Here
        </h2>
      </div>
      <div className="border-t border-slate-200">
        {ITEMS.map((item, i) => (
          <Link
            key={item.title}
            href={item.href}
            className="group grid grid-cols-[2.25rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] items-center gap-4 sm:gap-6 py-5 border-b border-slate-200 hover:bg-slate-50/60 transition-colors -mx-4 px-4 sm:-mx-6 sm:px-6"
          >
            <span
              className="font-serif text-2xl sm:text-4xl italic text-slate-200 group-hover:text-news-600 transition-colors tabular-nums"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="font-headline text-base sm:text-lg font-bold text-slate-900 group-hover:text-news-600 transition-colors">
                {item.title}
              </h3>
              <p className="mt-1 text-[13.5px] text-slate-500 leading-relaxed max-w-lg">{item.body}</p>
            </div>
            <ArrowUpRight
              className="w-4 h-4 text-slate-300 group-hover:text-news-600 transition-colors shrink-0 hidden sm:block"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
