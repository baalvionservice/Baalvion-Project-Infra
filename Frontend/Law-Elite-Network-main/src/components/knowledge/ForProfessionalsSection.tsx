import React from 'react';
import Link from 'next/link';
import { Award, Search, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

// Mirrors "Investopedia for Advisors" -- four cards, every one pointing at a
// real, publicly reachable route (registration is public; the dashboard
// pages behind it are not linked from here).
const CARDS = [
  {
    icon: Award,
    title: 'Join Our Network',
    body: 'List your practice and get discovered by readers researching your practice areas.',
    href: '/register',
  },
  {
    icon: Search,
    title: 'Find a Lawyer',
    body: 'Search the directory by practice area and jurisdiction.',
    href: '/search',
  },
  {
    icon: BookOpen,
    title: 'Practice Areas',
    body: 'See every legal topic the network currently covers.',
    href: '#legal-guides',
  },
  {
    icon: ShieldCheck,
    title: 'Editorial Standards',
    body: 'How our guides are researched, written, and reviewed.',
    href: '/editorial-standards',
  },
];

export function ForProfessionalsSection() {
  return (
    <section className="py-16 border-t border-slate-200">
      <div className="rounded-2xl bg-slate-50/70 border border-slate-100 px-6 py-12 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="kicker justify-center">For Legal Professionals</span>
          <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            Law Elite Network for Attorneys
          </h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Resources for practitioners who want to reach readers researching their practice areas,
            or simply want to see how the network operates.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-news-600 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <c.icon className="w-[18px] h-[18px] text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{c.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{c.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-blue-700 group-hover:text-news-600 transition-colors">
                Learn more <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
