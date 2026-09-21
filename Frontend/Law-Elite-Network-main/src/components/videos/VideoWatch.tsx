import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Story } from '@/components/videos/VideoBits';
import { embedUrl } from '@/lib/media-url';
import { showUrl, type HubShow, type HubVideo } from '@/lib/videos-hub';
import { formatArticleDate } from '@/lib/format-date';

export function VideoWatch({ video, show, more }: { video: HubVideo; show?: HubShow; more: HubVideo[] }) {
  const embed = embedUrl(video.url);
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <article>
            <Link href={show ? showUrl(show.slug) : '/videos'} className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 hover:underline">{show ? show.name : 'Video'}</Link>
            <h1 className="mt-1 font-headline text-3xl font-black leading-tight text-black md:text-4xl">{video.title}</h1>
            <p className="mt-2 text-[13px] text-slate-500">
              {[video.source, video.publishedAt ? formatArticleDate(video.publishedAt) : null, video.scope === 'international' ? 'International' : video.countryCode].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-5">
              {embed ? (
                <div className="relative aspect-video w-full bg-black">
                  <iframe src={embed} title={video.title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allowFullScreen className="absolute inset-0 h-full w-full" />
                </div>
              ) : (
                <a href={video.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-11 items-center gap-2 bg-black px-5 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-neutral-700">
                  Watch on {video.source || 'the original site'} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
            {video.description && <p className="mt-5 max-w-3xl whitespace-pre-line text-[16px] leading-relaxed text-slate-700">{video.description}</p>}
          </article>
          {more.length > 0 && (
            <aside aria-label="More videos">
              <h2 className="mb-4 border-b-[3px] border-black pb-2 font-headline text-[18px] font-black uppercase">{show ? `More from ${show.name}` : 'Up next'}</h2>
              <div className="grid gap-6">{more.map((v) => <Story key={v.slug} v={v} />)}</div>
            </aside>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
