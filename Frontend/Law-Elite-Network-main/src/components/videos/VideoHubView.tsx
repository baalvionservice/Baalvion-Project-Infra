'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Story, Row, LinedHeading, MoreLink } from '@/components/videos/VideoBits';
import { NewsBlock } from '@/components/videos/NewsBlock';
import { ShowDetails, ShowIntro } from '@/components/videos/ShowProfile';
import { showUrl, type HubPerson, type HubShow, type VideoHub, type VideoScope } from '@/lib/videos-hub';

type Tab = 'all' | VideoScope;
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'national', label: 'National' },
  { key: 'international', label: 'International' },
];

export function VideoHubView({ hub, show, title = 'Video', people = [], news = [] }: { hub: VideoHub; show?: HubShow; title?: string; people?: HubPerson[]; news?: any[] }) {
  const [tab, setTab] = useState<Tab>('all');
  const ok = (s: VideoScope) => tab === 'all' || tab === s;
  const videos = useMemo(() => hub.videos.filter((v) => ok(v.scope) && (!show || v.showSlug === show.slug)), [hub.videos, tab, show]); // eslint-disable-line react-hooks/exhaustive-deps
  const shows = useMemo(() => hub.shows.filter((s) => ok(s.scope)), [hub.shows, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const nameOf = (slug?: string) => hub.shows.find((s) => s.slug === slug)?.name;

  const hero = videos.find((v) => v.featured) ?? videos[0];
  const trio = videos.filter((v) => v !== hero).slice(0, 3);
  const used = new Set([hero, ...trio]);

  // One module per show, in the admin's order; videos with no show fall under their section name.
  const modules = useMemo(() => {
    if (show) return [];
    const out: { key: string; title: string; show?: HubShow; items: typeof videos }[] = [];
    shows.forEach((s) => { const items = videos.filter((v) => v.showSlug === s.slug); if (items.length) out.push({ key: s.slug, title: s.name, show: s, items }); });
    const cats = new Map<string, typeof videos>();
    videos.filter((v) => !v.showSlug && v.category).forEach((v) => cats.set(v.category!, [...(cats.get(v.category!) ?? []), v]));
    cats.forEach((items, c) => out.push({ key: `c-${c}`, title: c, items }));
    return out;
  }, [shows, videos, show]);

  const more = videos.filter((v) => !used.has(v));
  const latest = [...videos].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '')).slice(0, 6);

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-black pb-2">
          <div>
            {show && <Link href="/videos" className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 hover:underline">← Video</Link>}
            <h1 className="font-headline text-[44px] font-black leading-none tracking-tight text-black md:text-[56px]">{show ? show.name : title}</h1>
          </div>
          <nav aria-label="Region" className="flex gap-4 pb-1">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
                className={`border-b-2 pb-0.5 text-[13px] font-bold uppercase tracking-wider ${tab === t.key ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'}`}>{t.label}</button>
            ))}
          </nav>
        </div>
        {show?.description && <p className="mt-3 max-w-2xl text-neutral-600">{show.description}</p>}
        {show && <ShowIntro show={show} />}

        {videos.length === 0 ? (
          <p className="mt-10 border border-neutral-200 p-8 text-neutral-500">{hub.videos.length === 0 ? 'No videos have been published yet. They appear here as soon as one is.' : 'No videos in this region yet.'}</p>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <section aria-label="Top video" className="border-b border-neutral-300 pb-8">
                <Link href={`/videos/${hero.slug}`} className="group block text-center">
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-200">
                    {hero.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.thumbnailUrl} alt={hero.title} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center bg-black"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span>
                  </div>
                  <h2 className="mx-auto mt-4 max-w-3xl font-headline text-[30px] font-black leading-[1.1] text-black group-hover:underline md:text-[38px]">{hero.title}</h2>
                  {hero.description && <p className="mx-auto mt-2 line-clamp-2 max-w-2xl text-[16px] leading-snug text-neutral-600">{hero.description}</p>}
                </Link>
                {trio.length > 0 && (
                  <div className="mt-8 grid gap-6 border-t border-neutral-300 pt-6 sm:grid-cols-3">
                    {trio.map((v) => <Story key={v.slug} v={v} />)}
                  </div>
                )}
              </section>

              {modules.map((m) => {
                const [lead, ...others] = m.items;
                const side = others.slice(0, 2);
                return (
                  <section key={m.key} className="border-b border-neutral-300 py-8">
                    <LinedHeading title={m.title} href={m.show ? showUrl(m.show.slug) : undefined} />
                    <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                      <Story v={lead} size="lg" />
                      {side.length > 0 && <div className="grid content-start gap-5 md:border-l md:border-neutral-300 md:pl-6">{side.map((v) => <Row key={v.slug} v={v} />)}</div>}
                    </div>
                    {m.show && <MoreLink show={m.show} />}
                  </section>
                );
              })}

              {more.length > 0 && (
                <section className="pt-8" aria-label="More videos">
                  <h2 className="mb-2 border-b-[3px] border-black pb-2 font-headline text-[20px] font-black uppercase text-black">{show ? 'All episodes' : 'More Videos'}</h2>
                  <ul className="divide-y divide-neutral-300">
                    {more.map((v) => <li key={v.slug} className="py-4"><Row v={v} flag={nameOf(v.showSlug) ?? v.category} /></li>)}
                  </ul>
                </section>
              )}
              {show && <NewsBlock articles={news} title={`Latest ${show.name} news`} />}
              {show && <ShowDetails show={show} people={people} />}
            </div>

            <aside aria-label="Latest videos" className="hidden lg:block">
              <div className="sticky top-[120px] border border-neutral-300 p-5">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Latest Videos</h2>
                <ol className="divide-y divide-neutral-300">
                  {latest.map((v) => (
                    <li key={v.slug} className="py-3">
                      <Link href={`/videos/${v.slug}`} className="group block">
                        <h3 className="font-headline text-[16px] font-bold leading-[1.2] text-black group-hover:underline">{v.title}</h3>
                        <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">{nameOf(v.showSlug) ?? v.category ?? (v.scope === 'international' ? 'International' : 'National')}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                {!show && shows.length > 0 && (
                  <>
                    <h2 className="mt-4 border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Shows</h2>
                    <ul className="divide-y divide-neutral-300">
                      {shows.map((s) => <li key={s.slug}><Link href={showUrl(s.slug)} className="block py-2.5 font-headline text-[15px] font-bold text-black hover:underline">{s.name}</Link></li>)}
                    </ul>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
