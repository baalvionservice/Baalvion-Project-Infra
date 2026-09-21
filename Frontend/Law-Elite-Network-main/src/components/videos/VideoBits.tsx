import Link from 'next/link';
import { Play } from 'lucide-react';
import { formatDuration, showUrl, type HubShow, type HubVideo } from '@/lib/videos-hub';
import { formatArticleDate as formatDate } from '@/lib/format-date';

/** Photo with a small play badge in the corner, not a big centred button. */
export function Thumb({ v, className = '', eager = false, ratio = 'aspect-video' }: { v: HubVideo; className?: string; eager?: boolean; ratio?: string }) {
  const dur = formatDuration(v.durationSeconds);
  return (
    <div className={`relative ${ratio} w-full overflow-hidden bg-neutral-200 ${className}`}>
      {v.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.thumbnailUrl} alt={v.title} loading={eager ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black px-2 py-1 text-white">
        <Play className="h-3 w-3 fill-white" aria-hidden="true" />
        {dur && <span className="text-[11px] font-bold tabular-nums leading-none">{dur}</span>}
      </span>
    </div>
  );
}

/** Headline-first card: photo, then a bold serif headline. */
export function Story({ v, size = 'sm', flag }: { v: HubVideo; size?: 'sm' | 'lg'; flag?: string }) {
  return (
    <Link href={`/videos/${v.slug}`} className="group block">
      <Thumb v={v} eager={size === 'lg'} />
      {flag && <span className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">{flag}</span>}
      <h3 className={`${flag ? 'mt-1' : 'mt-3'} font-headline font-bold leading-[1.15] text-black group-hover:underline ${size === 'lg' ? 'text-[26px]' : 'text-[17px]'}`}>{v.title}</h3>
      {size === 'lg' && v.description && <p className="mt-2 line-clamp-3 text-[15px] leading-snug text-neutral-600">{v.description}</p>}
    </Link>
  );
}

/** Small row: thumbnail left, headline right. Used in lists and the sidebar. */
export function Row({ v, flag }: { v: HubVideo; flag?: string }) {
  return (
    <Link href={`/videos/${v.slug}`} className="group flex gap-3">
      <div className="w-[38%] max-w-[190px] shrink-0"><Thumb v={v} /></div>
      <div className="min-w-0">
        {flag && <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">{flag}</span>}
        <h3 className="line-clamp-4 font-headline text-[16px] font-bold leading-[1.2] text-black group-hover:underline">{v.title}</h3>
        {v.publishedAt && <span className="mt-1 block text-[12px] text-neutral-500">{formatDate(v.publishedAt)}</span>}
      </div>
    </Link>
  );
}

/** Show heading with a rule either side, as on the playlist modules. */
export function LinedHeading({ title, href }: { title: string; href?: string }) {
  const h = <span className="px-4 font-headline text-[22px] font-black uppercase tracking-tight text-black">{title}</span>;
  return (
    <header className="mb-5 flex items-center" >
      <span className="h-[3px] flex-1 bg-black" />
      <h2>{href ? <Link href={href} className="hover:underline">{h}</Link> : h}</h2>
      <span className="h-[3px] flex-1 bg-black" />
    </header>
  );
}

export function MoreLink({ show }: { show: HubShow }) {
  return (
    <div className="mt-5 flex justify-center">
      <Link href={showUrl(show.slug)} className="inline-flex items-center gap-2 border border-black px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white">
        More {show.name} <span aria-hidden="true">›</span>
      </Link>
    </div>
  );
}
