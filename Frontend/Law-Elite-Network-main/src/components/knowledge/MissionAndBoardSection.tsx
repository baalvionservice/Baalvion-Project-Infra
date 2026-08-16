import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { resolvePersonImage } from '@/lib/article-art';
import type { LawAuthor } from '@/data/authors';

interface HomeStats {
  guides: number;
  practiceAreas: number;
  jurisdictions: number;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-headline text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/**
 * Mirrors Investopedia's "Our Mission" + "Advisor Council" pairing. Every
 * number is computed live from the same data the rest of the homepage
 * renders from (article/category/country counts) -- no invented readership
 * or tenure figures. The "council" is the network's real, named editorial
 * team (see /authors), not a fabricated advisory board.
 */
export function MissionAndBoardSection({ stats, authors }: { stats: HomeStats; authors: LawAuthor[] }) {
  return (
    <section className="py-16 border-t border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <span className="kicker">Our Mission</span>
          <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-5">
            Making the Law Understandable
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-600 mb-8">
            <p>
              Law Elite Network was founded on March 11, 2025 to translate complex legal topics into
              plain, accurate, and genuinely useful explanations — so anyone, regardless of
              background, can make better-informed decisions about when and how to seek professional
              advice.
            </p>
            <p>
              We are an educational publisher, not a law firm. Our purpose is to inform and orient,
              never to replace the judgment of a licensed attorney who knows the facts of your
              situation.{' '}
              <Link href="/about-us" className="text-blue-600 hover:underline">
                Read our full mission →
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-md">
            <Stat value={`${stats.guides}+`} label="Published Guides" />
            <Stat value={String(stats.practiceAreas)} label="Practice Areas" />
            <Stat value={String(stats.jurisdictions)} label="Jurisdictions Covered" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 border-b-2 border-slate-900 pb-2 mb-5">
            Editorial Board
          </h3>
          <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
            Law Elite Network&rsquo;s guides are written and reviewed by an editorial team with named,
            published profiles.
          </p>
          <div className="space-y-4">
            {authors.map((a) => (
              <Link key={a.slug} href={`/author/${a.slug}`} className="group flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  <Image src={resolvePersonImage(a)} alt={a.name} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 group-hover:text-news-600 transition-colors">
                    {a.name}
                  </p>
                  <p className="text-[12px] text-slate-500 truncate">{a.title}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/authors"
            className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors"
          >
            Meet the Editorial Team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
