import React from 'react';
import Link from 'next/link';
import { BookOpen, Globe2, Tag, Newspaper, Library, ArrowUpRight } from 'lucide-react';

// Every card links to a section or route that already exists on the site --
// no glossary/"research resources" page exists yet, so this deliberately
// ships 5 items rather than inventing a 6th destination.
const ITEMS = [
  {
    icon: BookOpen,
    title: 'Legal Guides',
    body: 'Practical explanations of legal concepts, procedures, rights, and obligations.',
    href: '#legal-guides',
  },
  {
    icon: Globe2,
    title: 'Jurisdiction-Based Information',
    body: 'Explore legal information according to the country or jurisdiction where the law applies.',
    href: '/countries',
  },
  {
    icon: Tag,
    title: 'Legal Topics',
    body: 'Browse different areas of law and discover relevant educational resources.',
    href: '#practice-areas',
  },
  {
    icon: Newspaper,
    title: 'Legal News & Developments',
    body: 'Follow important legal and regulatory developments.',
    href: '/news',
  },
  {
    icon: Library,
    title: 'Sourcing & Editorial Standards',
    body: 'See how information is sourced, reviewed, and kept current on the network.',
    href: '/editorial-disclosure-policy',
  },
];

/**
 * Homepage orientation grid -- answers "what can I find here" in one glance,
 * right below the hero. Every href resolves to a real route or in-page
 * section; none of these are placeholder destinations.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ITEMS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex flex-col gap-3 p-5 rounded-lg border border-slate-200 hover:border-news-600 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <item.icon className="w-[18px] h-[18px] text-blue-600" aria-hidden="true" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-news-600 transition-colors" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-[13.5px] text-slate-500 leading-relaxed">{item.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
