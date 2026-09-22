import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { countryName, podcastUrl, type HubPodcast } from '@/lib/podcasts-hub';
import { embedUrl } from '@/lib/media-url';
import type { EntityPhotoInfo } from '@/lib/photos-api';
import { formatArticleDate } from '@/lib/format-date';

const PLACE: Record<string, string> = { US: 'the USA', GB: 'the UK', IN: 'India' };

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="border-b border-neutral-300 py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-black">{value}</dd>
    </div>
  );
}

export interface ProfileArticle { slug: string; title: string; excerpt?: string; href: string }

const isOfficial = (l: { label: string }) => !/^find on/i.test(l.label);

const ytThumb = (raw: string) => {
  const m = embedUrl(raw)?.match(/youtube-nocookie\.com\/embed\/([\w-]{11})/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg` : undefined;
};

function Credit({ p }: { p: EntityPhotoInfo }) {
  return (
    <figcaption className="mt-1.5 text-[12px] leading-snug text-neutral-500">
      {p.credit} · {p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{p.license}</a> : p.license}
      {p.sourceUrl && <> · <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a></>}
    </figcaption>
  );
}

export function PodcastProfile({ show, related, articles = [], linkedPeople = {}, photos = [] }: { show: HubPodcast; related: HubPodcast[]; articles?: ProfileArticle[]; linkedPeople?: Record<string, string>; photos?: EntityPhotoInfo[] }) {
  const [mainPhoto, ...morePhotos] = photos;
  const links = show.listenLinks.length ? show.listenLinks : [show.listenUrl, show.websiteUrl].filter(Boolean).map((u) => ({ label: 'Listen', url: u as string }));
  const official = links.filter(isOfficial);
  const search = links.filter((l) => !isOfficial(l));
  const paras = show.overview.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const place = show.countryCode ? PLACE[show.countryCode] ?? countryName(show.countryCode) : undefined;
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[12px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/podcasts" className="hover:underline">Podcasts</Link>
          {show.category && <> <span aria-hidden="true">/</span> {show.category}</>}
        </nav>
        <div className="mt-3 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            {show.rank && place && <p className="text-[13px] font-black uppercase tracking-wider text-black">No. {show.rank} in our Top 10 for {place}</p>}
            <h1 className="mt-1 font-headline text-[38px] font-black leading-[1.05] text-black md:text-[52px]">{show.title}</h1>
            {show.host && <p className="mt-2 text-[17px] text-neutral-600">with {show.host}</p>}
            {mainPhoto && (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainPhoto.url} alt={mainPhoto.alt} loading="eager" decoding="async" className="max-h-[440px] w-full bg-neutral-100 object-contain" />
                <Credit p={mainPhoto} />
              </figure>
            )}
            <div className="mt-6 space-y-5 text-[18px] leading-[1.65] text-neutral-800">
              {paras.map((t, i) => <p key={i}>{t}</p>)}
            </div>

            {show.episodes.length > 0 && (
              <section className="mt-10" aria-label="Start here">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Start here</h2>
                <ol className="divide-y divide-neutral-300">
                  {show.episodes.map((e, i) => (
                    <li key={e.url} className="flex gap-4 py-4">
                      <span className="font-headline text-[28px] font-black leading-none text-neutral-300">{i + 1}</span>
                      <div className="min-w-0">
                        <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="font-headline text-[19px] font-bold text-black hover:underline">{e.title}</a>
                        {e.publishedAt && <span className="ml-2 text-[12px] text-neutral-500">{formatArticleDate(e.publishedAt)}</span>}
                        {e.note && <p className="mt-1 text-[15px] leading-snug text-neutral-700">{e.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {show.videos.length > 0 && (
              <section className="mt-10" aria-label="Videos">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Watch</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {show.videos.map((v) => {
                    const embed = embedUrl(v.url);
                    const thumb = v.thumbnailUrl ?? ytThumb(v.url);
                    return (
                      <figure key={v.url}>
                        {embed ? (
                          <div className="relative aspect-video w-full bg-black">
                            <iframe src={embed} title={v.title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin"
                              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allowFullScreen className="absolute inset-0 h-full w-full" />
                          </div>
                        ) : (
                          <a href={v.url} target="_blank" rel="noopener noreferrer nofollow" className="relative block aspect-video w-full overflow-hidden bg-neutral-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {thumb && <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                            <span className="absolute bottom-2 left-2 bg-black px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Watch ↗</span>
                          </a>
                        )}
                        <figcaption className="mt-2 font-headline text-[16px] font-bold leading-snug text-black">{v.title}</figcaption>
                        {v.description && <p className="text-[14px] leading-snug text-neutral-600">{v.description}</p>}
                      </figure>
                    );
                  })}
                </div>
              </section>
            )}

            {morePhotos.length > 0 && (
              <section className="mt-10" aria-label="Photos">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Photos</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {morePhotos.map((ph) => (
                    <figure key={ph.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt={ph.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                      <Credit p={ph} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {show.hosts.length > 0 && (
              <section className="mt-10" aria-label="About the hosts">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">{show.hosts.length > 1 ? 'About the hosts' : 'About the host'}</h2>
                <div className="divide-y divide-neutral-300">
                  {show.hosts.map((h) => (
                    <div key={h.name} className="py-4">
                      <h3 className="font-headline text-[20px] font-bold text-black">
                        {h.personSlug && linkedPeople[h.personSlug] ? <Link href={linkedPeople[h.personSlug]} className="underline">{h.name}</Link> : h.name}
                      </h3>
                      {h.bio && <p className="mt-1 text-[16px] leading-relaxed text-neutral-700">{h.bio}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section className="mt-10" aria-label="Related articles">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">Read more on Law Elite Network</h2>
                <ul className="divide-y divide-neutral-300">
                  {articles.map((a) => (
                    <li key={a.slug} className="py-4">
                      <Link href={a.href} className="font-headline text-[19px] font-bold text-black hover:underline">{a.title}</Link>
                      {a.excerpt && <p className="mt-1 line-clamp-2 text-[15px] text-neutral-600">{a.excerpt}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {show.faq.length > 0 && (
              <section className="mt-10" aria-label="Questions">
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
              <section className="mt-10" aria-label="Sources">
                <h2 className="border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase text-black">Sources and further reading</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px]">
                  {show.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a></li>)}
                </ul>
              </section>
            )}
            {show.reviewedAt && <p className="mt-8 text-[12px] text-neutral-500">Last reviewed {formatArticleDate(show.reviewedAt)}. Spotted something wrong? <Link href="/corrections" className="underline">Tell us</Link>.</p>}
          </article>

          <aside aria-label="At a glance" className="md:border-l md:border-neutral-300 md:pl-6">
            <h2 className="border-b-[3px] border-black pb-2 font-headline text-[16px] font-black uppercase text-black">At a glance</h2>
            <dl>
              <Fact label="Host" value={show.host} />
              <Fact label="Produced by" value={show.publisher} />
              <Fact label="Country" value={countryName(show.countryCode)} />
              <Fact label="Language" value={show.language} />
              <Fact label="Started" value={show.firstAired} />
              <Fact label="New episodes" value={show.frequency} />
              <Fact label="Format" value={show.format} />
              <Fact label="Best for" value={show.bestFor} />
            </dl>
            {links.length > 0 && (
              <div className="mt-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Where to listen</h3>
                <ul className="mt-2 grid gap-2">
                  {official.map((l) => (
                    <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-black px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-neutral-700">{l.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></li>
                  ))}
                  {search.map((l) => (
                    <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-between border border-black px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white">{l.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></li>
                  ))}
                </ul>
                {search.length > 0 && <p className="mt-2 text-[11px] leading-snug text-neutral-500">“Find on” links open a search for the show, so you can pick the app you already use.</p>}
              </div>
            )}
          </aside>
        </div>

        <p className="mt-10 border-t border-neutral-300 pt-4 text-[14px] text-neutral-600">
          Browse all <Link href="/podcasts" className="font-bold underline">Top 10 podcast lists</Link> or <Link href="/videos" className="font-bold underline">watch video</Link>.
        </p>

        {related.length > 0 && (
          <section className="mt-14" aria-label="Related podcasts">
            <h2 className="mb-2 border-b-[3px] border-black pb-2 font-headline text-[20px] font-black uppercase text-black">More podcasts like this</h2>
            <ul className="divide-y divide-neutral-300">
              {related.map((r) => (
                <li key={r.slug} className="py-3">
                  <Link href={podcastUrl(r.slug)} className="group block">
                    <span className="font-headline text-[19px] font-black text-black group-hover:underline">{r.title}</span>
                    <span className="block text-[13px] text-neutral-600">{[r.host && `with ${r.host}`, r.category].filter(Boolean).join(' · ')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
