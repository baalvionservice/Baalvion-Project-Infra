import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Secondary links shown as a ruled list beside the primary CTA -- no "find a
// lawyer directory" entry here on purpose: the practitioner directory has no
// real, verified attorney data yet (see src/app/lawyer/[id]/page.tsx and
// robots.ts), so promising directory search to professionals would be a
// false claim.
const SECONDARY_LINKS = [
  {
    title: 'Advertise With Us',
    body: 'Reach readers researching your practice areas through sponsorship.',
    href: '/advertise',
  },
  {
    title: 'Practice Areas',
    body: 'See every legal topic the network currently covers.',
    href: '#legal-guides',
  },
  {
    title: 'Editorial Standards',
    body: 'How our guides are researched, written, and reviewed.',
    href: '/editorial-standards',
  },
];

/**
 * Dark, full-bleed masthead band -- deliberately breaks the light card-grid
 * rhythm every other homepage section uses, the way a real front page runs
 * one inverted "pull-out" module rather than repeating the same card shape
 * top to bottom. Every link resolves to a real, publicly reachable route
 * (registration is public; the dashboard pages behind it are not linked
 * from here).
 */
export function ForProfessionalsSection() {
  return (
    <section className="py-16 border-t border-slate-200">
      <div className="bg-slate-900 text-white px-6 py-14 md:px-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <span className="kicker !text-red-400">For Legal Professionals</span>
            <h2 className="font-headline text-3xl md:text-4xl font-extrabold mt-3 leading-[1.1] tracking-tight">
              Law Elite Network for Attorneys
            </h2>
            <p className="text-slate-400 mt-4 max-w-md leading-relaxed">
              Resources for practitioners who want to reach readers researching their practice
              areas, or simply want to see how the network operates.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 px-6 h-12 bg-white text-slate-900 text-[13px] font-bold tracking-wide hover:bg-slate-100 transition-colors"
            >
              Join Our Network <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="lg:col-span-5 lg:border-l lg:border-white/10 lg:pl-10">
            <div className="divide-y divide-white/10">
              {SECONDARY_LINKS.map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="group flex items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-white group-hover:text-red-400 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-[12.5px] text-slate-400 mt-0.5">{c.body}</p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
