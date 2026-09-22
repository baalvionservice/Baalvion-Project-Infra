import Link from 'next/link';
import { formatArticleDate } from '@/lib/format-date';
import { personUrl, seasonUrl, type HubPerson, type HubShow } from '@/lib/videos-hub';

/** Written overview and at-a-glance facts, shown above a show's videos. */
export function ShowIntro({ show }: { show: HubShow }) {
  const paras = show.overview.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  if (paras.length === 0 && show.facts.length === 0) return null;
  return (
    <section aria-label="About the show" className="mt-8 grid gap-8 border-b border-neutral-300 pb-8 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4 text-[18px] leading-[1.65] text-neutral-800">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
      {show.facts.length > 0 && (
        <aside aria-label="At a glance" className="md:border-l md:border-neutral-300 md:pl-6">
          <h2 className="border-b-[3px] border-black pb-2 font-headline text-[16px] font-black uppercase text-black">At a glance</h2>
          <dl>
            {show.facts.map((f) => (
              <div key={f.label} className="border-b border-neutral-300 py-2.5">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{f.label}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-black">{f.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </section>
  );
}

const CHIP: Record<string, string> = { Winner: 'bg-black text-white', 'Runner-up': 'border border-black text-black' };

/** Season-by-season results and housemates, and the closing questions and sources. */
export function ShowDetails({ show, people = [] }: { show: HubShow; people?: HubPerson[] }) {
  const written = new Set(people.filter((p) => p.hasProfile).map((p) => p.name.toLowerCase()));
  const slugOf = new Map(people.map((p) => [p.name.toLowerCase(), p.slug]));
  const withPeople = show.seasons.filter((s) => s.participants.length > 0);
  return (
    <>
      {show.seasons.length > 0 && (
        <section className="mt-12" aria-label="All seasons">
          <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">All seasons</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-black text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-2 pr-3">Season</th><th className="pr-3">Year</th><th className="pr-3">Host</th><th className="pr-3">Winner</th><th className="pr-3">Runner-up</th><th className="pr-3">Days</th><th>Housemates</th>
                </tr>
              </thead>
              <tbody>
                {show.seasons.map((s) => (
                  <tr key={s.number} className="border-b border-neutral-300 align-top">
                    <td className="py-2.5 pr-3 font-headline text-[16px] font-black text-black"><Link href={seasonUrl(show.slug, s.number)} className="underline">{s.number}</Link></td>
                    <td className="pr-3">{s.year ?? '—'}</td>
                    <td className="pr-3">{s.host ?? '—'}</td>
                    <td className="pr-3 font-semibold text-black">{s.winner || (s.year && s.year >= 2026 ? 'On air now' : '—')}</td>
                    <td className="pr-3">{s.runnerUp || '—'}</td>
                    <td className="pr-3">{s.days ?? '—'}</td>
                    <td>{s.housemates ?? (s.participants.length || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {withPeople.length > 0 && (
        <section className="mt-12" aria-label="Housemates by season">
          <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Housemates, season by season</h2>
          <p className="mt-2 text-[13px] text-neutral-500">Names are listed in the order the housemates entered, as compiled from public reference pages. Some entries use the name shown on the programme. Spotted a mistake? <Link href="/corrections" className="underline">Tell us</Link>.</p>
          <div className="mt-3 divide-y divide-neutral-300 border-y border-neutral-300">
            {[...withPeople].reverse().map((s) => (
              <details key={s.number} className="group py-3" open={s.number === Math.max(...withPeople.map((x) => x.number))}>
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-headline text-[20px] font-black text-black">Season {s.number}</span>
                  <span className="text-[13px] text-neutral-600">{[s.year, s.host && `hosted by ${s.host}`, `${s.participants.length} housemates listed`].filter(Boolean).join(' · ')}</span>
                  <span className="ml-auto text-[12px] font-bold uppercase tracking-wider text-neutral-500 group-open:hidden">Show ▾</span>
                  <span className="ml-auto hidden text-[12px] font-bold uppercase tracking-wider text-neutral-500 group-open:inline">Hide ▴</span>
                </summary>
                {s.notes && <p className="mt-2 text-[14px] text-neutral-700">{s.notes}</p>}
                <ol className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {s.participants.map((p, i) => (
                    <li key={`${p.name}-${i}`} className="flex items-baseline gap-2 text-[15px] text-neutral-800">
                      <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-neutral-400">{i + 1}</span>
                      {written.has(p.name.toLowerCase()) ? <Link href={personUrl(show.slug, slugOf.get(p.name.toLowerCase())!)} className="font-semibold underline">{p.name}</Link> : <span>{p.name}</span>}
                      {p.result && <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CHIP[p.result] ?? 'text-neutral-500'}`}>{p.result}</span>}
                    </li>
                  ))}
                </ol>
                {s.source && <p className="mt-3 text-[12px] text-neutral-500"><a href={s.source} target="_blank" rel="noopener noreferrer" className="underline">Season {s.number} reference page</a></p>}
              </details>
            ))}
          </div>
        </section>
      )}

      {show.faq.length > 0 && (
        <section className="mt-12" aria-label="Quick answers">
          <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Quick answers</h2>
          <dl>
            {show.faq.map((f) => (
              <div key={f.q} className="border-b border-neutral-300 py-4">
                <dt className="font-headline text-[18px] font-bold text-black">{f.q}</dt>
                <dd className="mt-1 text-[16px] leading-relaxed text-neutral-700">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {show.sources.length > 0 && (
        <section className="mt-12" aria-label="Sources">
          <h2 className="border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Sources and further reading</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px]">
            {show.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label}</a></li>)}
          </ul>
          {show.reviewedAt && <p className="mt-4 text-[12px] text-neutral-500">Last reviewed {formatArticleDate(show.reviewedAt)}.</p>}
        </section>
      )}
    </>
  );
}
