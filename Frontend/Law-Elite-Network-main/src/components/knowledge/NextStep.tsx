import React from 'react';
import Link from 'next/link';
import { BookOpen, Globe2, GraduationCap, ArrowRight } from 'lucide-react';
import { countryNameToSlug } from '@/data/countries';

interface NextStepProps {
  category?: { name: string; slug: string };
  /** article.country -- when unknown, the jurisdiction option links to the general /countries index rather than guessing one. */
  country?: string;
}

/**
 * "What should you do next?" -- a reader-decision aid closing out the
 * substantive content, before Related Guides. Every destination is a real,
 * already-existing page (the article's own category hub, a real /countries
 * hub, and the real Legal Education & History section) -- never an invented
 * link. No "find a lawyer" option here: the site has no working lawyer
 * directory/referral flow for readers yet (see ForProfessionalsSection.tsx).
 */
export function NextStep({ category, country }: NextStepProps) {
  const countrySlug = country ? countryNameToSlug(country) : null;

  const options = [
    {
      icon: BookOpen,
      prompt: "I'm researching",
      action: category ? `Browse more ${category.name} guides` : 'Browse our guides',
      href: category ? `/${category.slug}` : '/',
    },
    {
      icon: Globe2,
      prompt: 'I need to understand my rights',
      action: countrySlug && country ? `Browse ${country} guides` : 'Browse guides by jurisdiction',
      href: countrySlug ? `/countries/${countrySlug}` : '/countries',
    },
    {
      icon: GraduationCap,
      prompt: "I'm a student",
      action: 'Explore Legal Education',
      href: '/legal-education-and-history',
    },
  ];

  return (
    <section className="border-t border-b border-slate-100 py-8">
      <h2 className="font-headline text-xl font-extrabold text-slate-900 mb-5">
        What should you do next?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => (
          <Link
            key={opt.prompt}
            href={opt.href}
            className="group flex items-start gap-3 rounded-lg border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
          >
            <opt.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] text-slate-500">{opt.prompt}</p>
              <p className="text-[14.5px] font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1 transition-colors">
                {opt.action}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
