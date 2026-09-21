'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { countryName, podcastUrl, type HubPodcast } from '@/lib/podcasts-hub';

function Cover({ p }: { p: HubPodcast }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
      {p.photo || p.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo?.url ?? p.coverUrl} alt={p.photo?.alt ?? p.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-end p-3 font-headline text-[19px] font-black leading-[1.05] text-white">{p.title}</span>
      )}
      {p.rank && <span className="absolute left-0 top-0 bg-white px-2.5 py-1 font-headline text-[22px] font-black leading-none text-black">{p.rank}</span>}
    </div>
  );
}

function Result({ p }: { p: HubPodcast }) {
  const meta = [p.host && `with ${p.host}`, p.publisher, countryName(p.countryCode)].filter(Boolean).join(' · ');
  const href = p.listenUrl ?? p.websiteUrl;
  return (
    <li className="flex gap-4 border-b border-neutral-300 py-5 sm:gap-6">
      <div className="w-[34%] max-w-[190px] shrink-0"><Cover p={p} /></div>
      <div className="min-w-0">
        {p.category && <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{p.category}</span>}
        <h3 className="font-headline text-[22px] font-black leading-[1.1] text-black sm:text-[26px]">{p.overview ? <Link href={podcastUrl(p.slug)} className="hover:underline">{p.title}</Link> : p.title}</h3>
        {meta && <p className="mt-1 text-[13px] font-semibold text-neutral-600">{meta}</p>}
        {p.description && <p className="mt-2 line-clamp-4 text-[15px] leading-snug text-neutral-700">{p.description}</p>}
        {p.overview && <Link href={podcastUrl(p.slug)} className="mt-3 mr-2 inline-flex items-center border border-black bg-black px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black">Read more</Link>}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 border border-black px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white">
            Listen <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </li>
  );
}

const PLACE: Record<string, { tab: string; in: string }> = { US: { tab: 'USA', in: 'the USA' }, GB: { tab: 'UK', in: 'the UK' }, IN: { tab: 'India', in: 'India' } };
const placeTab = (c: string) => PLACE[c]?.tab ?? countryName(c) ?? c;
const placeIn = (c: string) => PLACE[c]?.in ?? countryName(c) ?? c;
const ORDER = ['US', 'GB', 'IN'];

const FILTER = 'block w-full py-1.5 text-left text-[14px]';

export function PodcastDirectory({ shows }: { shows: HubPodcast[] }) {
  const [category, setCategory] = useState('');
  const countries = useMemo(() => {
    const c = [...new Set(shows.map((s) => s.countryCode).filter(Boolean))] as string[];
    return c.sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  }, [shows]);
  const [country, setCountry] = useState(countries[0] ?? '');
  const categories = useMemo(() => [...new Set(shows.map((s) => s.category).filter(Boolean))] as string[], [shows]);
  const shown = shows.filter((s) => (!country || s.countryCode === country) && (!category || s.category === category));
  const ranked = shown.filter((s) => s.rank && s.rank <= 10).sort((a, b) => a.rank! - b.rank!);
  const others = shown.filter((s) => !ranked.includes(s));
  const note = shows.find((s) => s.rank && s.rankingNote)?.rankingNote;

  const Filter = ({ label, value, set, options, fmt = (x: string) => x }: { label: string; value: string; set: (v: string) => void; options: string[]; fmt?: (x: string) => string }) => (
    <div className="mt-5">
      <h3 className="border-b border-neutral-300 pb-1 text-[12px] font-black uppercase tracking-wider text-black">{label}</h3>
      <ul>
        {['', ...options].map((o) => (
          <li key={o || 'all'}>
            <button type="button" onClick={() => set(o)} aria-pressed={value === o} className={`${FILTER} ${value === o ? 'font-bold text-black' : 'text-neutral-600 hover:text-black hover:underline'}`}>{o ? fmt(o) : 'All'}</button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
        <header className="flex items-center gap-4">
          <h1 className="font-headline text-[32px] font-black leading-none text-black md:text-[40px]">Podcasts</h1>
          <span className="h-[3px] flex-1 bg-black" />
        </header>

        {countries.length > 1 && (
          <nav aria-label="Country" className="mt-5 flex flex-wrap gap-2">
            {countries.map((c) => (
              <button key={c} type="button" onClick={() => setCountry(c)} aria-pressed={country === c}
                className={`h-10 px-5 text-[13px] font-bold uppercase tracking-wider ${country === c ? 'bg-black text-white' : 'border border-black text-black hover:bg-neutral-100'}`}>{placeTab(c)}</button>
            ))}
          </nav>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside aria-label="Refine by" className="lg:border-r lg:border-neutral-300 lg:pr-6">
            <h2 className="font-headline text-[18px] font-black uppercase text-black">Refine By:</h2>
            {categories.length > 1 && <Filter label="Category" value={category} set={setCategory} options={categories} />}
          </aside>

          <section aria-label="Results" className="min-w-0">
            {ranked.length > 0 && (
              <>
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">{country ? `Top 10 Podcasts in ${placeIn(country)}` : 'Top 10 Podcasts'}</h2>
                {note && <p className="mt-2 text-[12px] text-neutral-500">{note}</p>}
                <ul>{ranked.map((p) => <Result key={p.slug} p={p} />)}</ul>
              </>
            )}
            {others.length > 0 && (
              <>
                <h2 className="mt-8 border-b-[3px] border-black pb-2 font-headline text-[20px] font-black uppercase text-black">{ranked.length ? 'More Podcasts' : `${others.length} Results`}</h2>
                <ul>{others.map((p) => <Result key={p.slug} p={p} />)}</ul>
              </>
            )}
            {shown.length === 0 && <p className="border border-neutral-200 p-8 text-neutral-500">No podcasts match these filters.</p>}
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
