import Link from 'next/link';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Story } from '@/components/videos/VideoBits';
import { formatArticleDate } from '@/lib/format-date';
import type { EntityPhotoInfo } from '@/lib/photos-api';
import { personUrl, seasonUrl, showUrl, type HubPerson, type HubShow, type HubVideo } from '@/lib/videos-hub';

const CHIP: Record<string, string> = { Winner: 'bg-black text-white', 'Runner-up': 'border border-black text-black' };

export function PersonView({ show, person, photos, videos, costars }: { show: HubShow; person: HubPerson; photos: EntityPhotoInfo[]; videos: HubVideo[]; costars: { season: number; people: HubPerson[] }[] }) {
  const paras = person.overview.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const [main, ...more] = photos;
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[12px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/videos" className="hover:underline">Video</Link> <span aria-hidden="true">/</span> <Link href={showUrl(show.slug)} className="hover:underline">{show.name}</Link>
        </nav>
        <div className="mt-3 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            <h1 className="font-headline text-[38px] font-black leading-[1.05] text-black md:text-[52px]">{person.name}</h1>
            {person.knownFor && <p className="mt-2 text-[17px] text-neutral-600">{person.knownFor}</p>}
            <p className="mt-3 flex flex-wrap gap-2">
              {person.appearances.map((a) => (
                <Link key={a.season} href={seasonUrl(show.slug, a.season)} className="border border-black px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white">
                  {show.name} {a.season}{a.year ? ` (${a.year})` : ''}{a.result ? ` · ${a.result}` : ''}
                </Link>
              ))}
            </p>
            {main && (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={main.url} alt={main.alt} loading="eager" decoding="async" className="max-h-[440px] w-full bg-neutral-100 object-contain" />
                <figcaption className="mt-1.5 text-[12px] text-neutral-500">{main.credit} · {main.licenseUrl ? <a href={main.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{main.license}</a> : main.license}{main.sourceUrl && <> · <a href={main.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a></>}</figcaption>
              </figure>
            )}

            {paras.length > 0 ? (
              <div className="mt-6 space-y-5 text-[18px] leading-[1.65] text-neutral-800">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
            ) : (
              <p className="mt-6 border border-neutral-200 p-5 text-neutral-600">
                {person.name} took part in {person.appearances.map((a) => `${show.name} ${a.season}${a.result ? ` (${a.result.toLowerCase()})` : ''}`).join(' and ')}. A full profile is being written.
              </p>
            )}

            {videos.length > 0 && (
              <section className="mt-10" aria-label="Videos">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Watch</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">{videos.map((v) => <Story key={v.slug} v={v} />)}</div>
              </section>
            )}

            {more.length > 0 && (
              <section className="mt-10" aria-label="Photos">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Photos</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {more.map((ph) => (
                    <figure key={ph.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt={ph.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      <figcaption className="mt-1.5 text-[12px] text-neutral-500">{ph.credit} · {ph.license}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {person.faq.length > 0 && (
              <section className="mt-10" aria-label="Quick answers">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Quick answers</h2>
                <dl>{person.faq.map((f) => <div key={f.q} className="border-b border-neutral-300 py-4"><dt className="font-headline text-[18px] font-bold text-black">{f.q}</dt><dd className="mt-1 text-[16px] leading-relaxed text-neutral-700">{f.a}</dd></div>)}</dl>
              </section>
            )}

            {costars.map((c) => c.people.length > 0 && (
              <section key={c.season} className="mt-10" aria-label={`Also in season ${c.season}`}>
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Also in {show.name} {c.season}</h2>
                <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                  {c.people.map((p) => <li key={p.slug}>{p.hasProfile ? <Link href={personUrl(show.slug, p.slug)} className="underline">{p.name}</Link> : <span className="text-neutral-700">{p.name}</span>}</li>)}
                </ul>
                <p className="mt-3 text-[13px]"><Link href={seasonUrl(show.slug, c.season)} className="font-bold underline">See the full season {c.season} page →</Link></p>
              </section>
            ))}

            {person.sources.length > 0 && (
              <section className="mt-10" aria-label="Sources">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Sources and further reading</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px]">{person.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label}</a></li>)}</ul>
              </section>
            )}
            {person.reviewedAt && <p className="mt-8 text-[12px] text-neutral-500">Last reviewed {formatArticleDate(person.reviewedAt)}. Spotted something wrong? <Link href="/corrections" className="underline">Tell us</Link>.</p>}
          </article>

          <aside aria-label="At a glance" className="md:border-l md:border-neutral-300 md:pl-6">
            <h2 className="border-b-[3px] border-black pb-2 font-headline text-[16px] font-black uppercase text-black">At a glance</h2>
            <dl>
              <div className="border-b border-neutral-300 py-2.5"><dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Show</dt><dd className="mt-0.5 text-[15px] font-semibold text-black"><Link href={showUrl(show.slug)} className="underline">{show.name}</Link></dd></div>
              <div className="border-b border-neutral-300 py-2.5"><dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Seasons</dt><dd className="mt-1 space-y-1 text-[15px] font-semibold text-black">
                {person.appearances.map((a) => <div key={a.season} className="flex items-center gap-2"><Link href={seasonUrl(show.slug, a.season)} className="underline">Season {a.season}{a.year ? ` (${a.year})` : ''}</Link>{a.result && <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CHIP[a.result] ?? ''}`}>{a.result}</span>}</div>)}
              </dd></div>
              {person.facts.map((f) => <div key={f.label} className="border-b border-neutral-300 py-2.5"><dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{f.label}</dt><dd className="mt-0.5 text-[15px] font-semibold text-black">{f.value}</dd></div>)}
            </dl>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
