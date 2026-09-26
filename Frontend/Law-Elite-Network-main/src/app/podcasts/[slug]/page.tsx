import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { FollowButton } from '@/components/member/FollowButton';
import { getAllPodcasts, getPodcastBySlug } from '@/lib/media-server';
import { formatArticleDate } from '@/lib/format-date';
import { PodcastProfile } from '@/components/podcasts/PodcastProfile';
import { getPodcastHub, podcastUrl } from '@/lib/podcasts-hub';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { getMergedPeople } from '@/lib/people-server';
import { personUrl } from '@/lib/person-url';
import { fetchPhotosFor } from '@/lib/photos-api';

export const revalidate = 900;
export const dynamicParams = true;

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateStaticParams() {
  const hub = await getPodcastHub();
  return [...hub, ...getAllPodcasts()].map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const managed = (await getPodcastHub()).find((p) => p.slug === slug);
  if (managed) {
    const desc = managed.seoDescription || managed.overview.split(/\n{2,}/)[0]?.slice(0, 200) || managed.description;
    return {
      title: managed.seoTitle || `${managed.title}: what it is and who it's for`,
      description: desc,
      alternates: { canonical: `${SITE}${podcastUrl(managed.slug)}` },
      // No thin pages: indexed only once an editor has written it up.
      robots: { index: managed.indexable, follow: true },
      openGraph: { type: 'website', title: managed.title, description: desc },
    };
  }
  const show = getPodcastBySlug(slug);
  if (!show) return { robots: { index: false } };
  return { title: show.title, description: show.description, alternates: { canonical: `${SITE}/podcasts/${show.slug}` } };
}

export default async function PodcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const hub = await getPodcastHub();
  const managed = hub.find((p) => p.slug === slug);
  if (managed) {
    const same = hub.filter((p) => p.slug !== managed.slug && p.overview);
    const related = [...same.filter((p) => p.category && p.category === managed.category), ...same.filter((p) => p.countryCode === managed.countryCode)]
      .filter((p, i, a) => a.findIndex((x) => x.slug === p.slug) === i).slice(0, 4);
    const articles = (await Promise.all(managed.relatedArticleSlugs.slice(0, 6).map(async (a) => {
      try {
        const art = await fetchArticleForRender(a);
        return art?.title ? { slug: a, title: String(art.title), excerpt: art.excerpt || art.summary || undefined, href: articleUrl(art) } : null;
      } catch { return null; }
    }))).filter((x): x is NonNullable<typeof x> => !!x);
    const photos = await fetchPhotosFor('podcast', managed.slug);
    const wanted = new Set(managed.hosts.map((h) => h.personSlug).filter(Boolean));
    const linkedPeople: Record<string, string> = {};
    if (wanted.size) (await getMergedPeople()).forEach((p) => { if (wanted.has(p.slug)) linkedPeople[p.slug] = personUrl(p.slug); });
    const ld = {
      '@context': 'https://schema.org', '@type': 'PodcastSeries', name: managed.title, url: `${SITE}${podcastUrl(managed.slug)}`,
      ...(managed.description ? { description: managed.description } : {}), ...(managed.host ? { author: { '@type': 'Person', name: managed.host } } : {}),
      ...(managed.listenUrl ? { sameAs: managed.listenUrl } : {}), ...(photos[0] ? { image: `${SITE}${photos[0].url}` } : {}), ...(managed.language ? { inLanguage: managed.language } : {}),
    };
    const faq = managed.faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: managed.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
        <PodcastProfile show={managed} related={related} articles={articles} linkedPeople={linkedPeople} photos={photos} />
      </>
    );
  }
  const show = getPodcastBySlug(slug);
  if (!show) notFound();
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-4xl py-10">
        <Link href="/podcasts" className="kicker">Podcasts</Link>
        <h1 className="mt-2 font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">{show.title}</h1>
        {show.host && <p className="mt-2 text-slate-500">with {show.host}</p>}
        <p className="mt-5 text-lg text-slate-600 leading-relaxed">{show.description}</p>
        {show.personSlug && <div className="mt-5"><FollowButton entityType="person" slug={show.personSlug} /></div>}
        <ul className="mt-10 divide-y divide-slate-100 border-t border-slate-100">
          {show.episodes.map((ep) => (
            <li key={ep.url} className="py-5">
              <a href={ep.url} target="_blank" rel="noopener noreferrer nofollow" className="group inline-flex items-start gap-2 font-headline text-lg font-bold text-slate-900 hover:text-news-600">
                {ep.title} <ExternalLink className="w-4 h-4 mt-1.5 shrink-0 text-slate-400" aria-hidden="true" />
              </a>
              {ep.publishedAt && <p className="text-[12px] text-slate-400 mt-0.5">{formatArticleDate(ep.publishedAt)}</p>}
              {ep.description && <p className="mt-1.5 text-[14px] text-slate-500 line-clamp-3">{ep.description}</p>}
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter />
    </div>
  );
}
