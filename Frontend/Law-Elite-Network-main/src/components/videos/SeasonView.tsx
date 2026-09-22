import Link from 'next/link';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Story } from '@/components/videos/VideoBits';
import { personUrl, seasonUrl, showUrl, type HubPerson, type HubSeason, type HubShow, type HubVideo } from '@/lib/videos-hub';

const CHIP: Record<string, string> = { Winner: 'bg-black text-white', 'Runner-up': 'border border-black text-black' };

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="border-b border-neutral-300 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-black">{value}</dd>
    </div>
  );
}

export function SeasonView({ show, season, all, people, videos }: { show: HubShow; season: HubSeason; all: HubSeason[]; people: HubPerson[]; videos: HubVideo[] }) {
  const prev = all.find((s) => s.number === season.number - 1);
  const next = all.find((s) => s.number === season.number + 1);
  const bySlug = new Map(people.map((p) => [p.name.toLowerCase(), p]));
  const showName = (id?: string) => (id ? bySlug.get(id.toLowerCase()) : undefined);
  const named = (n?: string) => {
    if (!n) return null;
    const p = showName(n);
    return p?.hasProfile ? <Link href={personUrl(show.slug, p.slug)} className="underline">{n}</Link> : n;
  };
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[12px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/videos" className="hover:underline">Video</Link> <span aria-hidden="true">/</span> <Link href={showUrl(show.slug)} className="hover:underline">{show.name}</Link>
        </nav>
        <h1 className="mt-2 font-headline text-[40px] font-black leading-none tracking-tight text-black md:text-[56px]">{show.name} {season.number}</h1>
        <p className="mt-2 text-[16px] text-neutral-600">{[season.year, season.host && `hosted by ${season.host}`, season.network].filter(Boolean).join(' · ')}</p>

        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            {season.notes && <p className="text-[18px] leading-relaxed text-neutral-800">{season.notes}</p>}
            {season.winner && (
              <p className="mt-4 text-[18px] leading-relaxed text-neutral-800">
                <strong className="font-black">{named(season.winner)}</strong> won season {season.number}{season.runnerUp ? <>, with <strong className="font-black">{named(season.runnerUp)}</strong> as runner-up</> : ''}.
              </p>
            )}
            {!season.winner && season.year && season.year >= new Date().getFullYear() && <p className="mt-4 text-[18px] leading-relaxed text-neutral-800">This season is on air now, so there is no winner yet.</p>}

            {season.participants.length > 0 && (
              <section className="mt-10" aria-label="Housemates">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Housemates</h2>
                <p className="mt-2 text-[13px] text-neutral-500">In the order they entered. Names with an underline have their own profile.</p>
                <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {season.participants.map((p, i) => {
                    const person = bySlug.get(p.name.toLowerCase());
                    return (
                      <li key={`${p.name}-${i}`} className="flex items-baseline gap-2 text-[16px] text-neutral-800">
                        <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-neutral-400">{i + 1}</span>
                        {person?.hasProfile ? <Link href={personUrl(show.slug, person.slug)} className="font-semibold underline">{p.name}</Link> : <span>{p.name}</span>}
                        {p.result && <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CHIP[p.result] ?? 'text-neutral-500'}`}>{p.result}</span>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {videos.length > 0 && (
              <section className="mt-10" aria-label="Videos">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Watch: season {season.number}</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">{videos.map((v) => <Story key={v.slug} v={v} />)}</div>
              </section>
            )}

            <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-neutral-300 pt-4 text-[14px] font-bold uppercase tracking-wider">
              {prev ? <Link href={seasonUrl(show.slug, prev.number)} className="underline">← {show.name} {prev.number}</Link> : <span />}
              <Link href={showUrl(show.slug)} className="underline">All seasons</Link>
              {next ? <Link href={seasonUrl(show.slug, next.number)} className="underline">{show.name} {next.number} →</Link> : <span />}
            </div>
            {season.source && <p className="mt-4 text-[12px] text-neutral-500">Compiled from public reference pages: <a href={season.source} target="_blank" rel="noopener noreferrer" className="underline">season {season.number} reference</a>. Spotted a mistake? <Link href="/corrections" className="underline">Tell us</Link>.</p>}
          </div>

          <aside aria-label="At a glance" className="md:border-l md:border-neutral-300 md:pl-6">
            <h2 className="border-b-[3px] border-black pb-2 font-headline text-[16px] font-black uppercase text-black">At a glance</h2>
            <dl>
              <Fact label="Season" value={season.number} />
              <Fact label="Year" value={season.year} />
              <Fact label="Premiere" value={season.firstAired} />
              <Fact label="Host" value={season.host} />
              <Fact label="Channel" value={season.network} />
              <Fact label="Length" value={season.days ? `${season.days} days` : undefined} />
              <Fact label="Housemates" value={season.housemates ?? (season.participants.length || undefined)} />
              <Fact label="Winner" value={season.winner} />
              <Fact label="Runner-up" value={season.runnerUp} />
            </dl>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
