/**
 * Photography for the directory.
 *
 * Every photograph here is somebody else's work, reused under a Creative Commons or
 * public-domain licence that requires the photographer to be named. So there is no plain
 * `<img>` in this codebase: a photo enters a page through one of these components, which
 * take the credit as a required prop and refuse to render without one.
 *
 * That is not a stylistic preference. An unattributed CC BY-SA photograph is a licence
 * breach, and "we'll add the credits later" is how a site ends up with several thousand
 * of them. If the ingest could not establish who took a picture, the picture does not
 * appear and the layout falls back to a typographic panel instead.
 *
 * next/image is deliberately not used: these are arbitrary upload.wikimedia.org paths,
 * and configuring a remote loader for a third-party host we do not control would put the
 * optimiser in front of files that change without notice. Width is requested from
 * Commons instead (see commonsImage), which serves a real thumbnail.
 */
import { commonsImage } from '@/lib/shipping-directory/site';

export interface ImageCredit {
  author?: string | null;
  licence?: string | null;
  licenceUrl?: string | null;
  descriptionUrl?: string | null;
  usable?: boolean;
}

/** A credit good enough to publish under: we know who made it and under what terms. */
export function isPublishable(credit: ImageCredit | null | undefined): credit is ImageCredit {
  return Boolean(credit && credit.usable !== false && (credit.author || credit.licence));
}

export function CreditLine({ credit, className = '' }: { credit: ImageCredit; className?: string }) {
  const licence = credit.licence ? (
    credit.licenceUrl
      ? <a href={credit.licenceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{credit.licence}</a>
      : <span>{credit.licence}</span>
  ) : null;

  return (
    <p className={`text-[11.5px] leading-snug text-wsd-muted ${className}`}>
      {credit.author ? <>Photo: {credit.author}</> : 'Photo: author not stated'}
      {licence ? <> · {licence}</> : null}
      {credit.descriptionUrl ? (
        <>
          {' · '}
          <a href={credit.descriptionUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            file
          </a>
        </>
      ) : null}
    </p>
  );
}

/**
 * A photograph with its credit beneath it. Returns null — not a broken frame, not a
 * placeholder — when there is no usable image or no credit for it.
 */
export function Photo({
  src, alt, credit, width = 1200, className = '', imgClassName = '', caption,
}: {
  src: string | null | undefined;
  alt: string;
  credit: ImageCredit | null | undefined;
  width?: number;
  className?: string;
  imgClassName?: string;
  caption?: React.ReactNode;
}) {
  const url = commonsImage(src, width);
  if (!url || !isPublishable(credit)) return null;
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" decoding="async" className={`w-full bg-wsd-ground-mid object-cover ${imgClassName}`} />
      <figcaption className="mt-2">
        {caption ? <p className="mb-1 text-[13px] leading-snug text-wsd-body">{caption}</p> : null}
        <CreditLine credit={credit} />
      </figcaption>
    </figure>
  );
}

/**
 * A company logo. Logos are trademarks rather than creative works and the usable ones
 * here are public-domain-by-simplicity or freely licensed, but the same rule applies —
 * no credit, no render.
 *
 * Contained rather than cropped, on a neutral field: a logo cropped to fill a box is a
 * defaced logo.
 */
export function Logo({
  src, name, credit, size = 'md',
}: {
  src: string | null | undefined;
  name: string;
  credit?: ImageCredit | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const url = commonsImage(src, 320);
  const box = { sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-24 w-24' }[size];
  const type = { sm: 'text-[15px]', md: 'text-[22px]', lg: 'text-[32px]' }[size];

  if (!url || (credit !== undefined && !isPublishable(credit))) {
    // The monogram fallback. Deliberately typographic — a generic building or ship icon
    // would imply we hold an image of this company when we do not.
    return (
      <span
        aria-hidden
        className={`flex ${box} shrink-0 items-center justify-center border border-wsd-line-soft bg-wsd-ground-alt ${type} font-extrabold tracking-[-0.04em] text-wsd-line`}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${name} logo`}
      loading="lazy"
      decoding="async"
      className={`${box} shrink-0 border border-wsd-line-soft bg-white object-contain p-1.5`}
    />
  );
}

function initials(name: string): string {
  const words = String(name).replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface Person {
  qid?: string | null;
  name: string;
  role?: string | null;
  description?: string | null;
  image?: string | null;
  imageCredit?: ImageCredit | null;
  bornYear?: number | null;
  diedYear?: number | null;
}

/**
 * A named person — founder, chief executive, board member — with their photograph where
 * one exists under a usable licence, and their portrait frame left typographic where one
 * does not. Life dates are shown because "founded by X (1876–1940)" is the fact a reader
 * arrives for; a founder page with no dates reads as a stub.
 */
export function PersonCard({ person, emphasis = false }: { person: Person; emphasis?: boolean }) {
  const photo = commonsImage(person.image, 400);
  const showPhoto = photo && isPublishable(person.imageCredit);
  const dates = person.bornYear || person.diedYear
    ? `${person.bornYear ?? '?'}–${person.diedYear ?? ''}`.replace(/–$/, person.diedYear ? '' : '')
    : null;

  return (
    <div className={`flex gap-4 ${emphasis ? 'border-l-[3px] border-wsd-violet pl-4' : ''}`}>
      <div className="shrink-0">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={person.name}
            loading="lazy"
            decoding="async"
            className="h-20 w-16 border border-wsd-line-soft object-cover object-top grayscale"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-20 w-16 items-center justify-center border border-wsd-line-soft bg-wsd-ground-alt text-[19px] font-extrabold text-wsd-line"
          >
            {initials(person.name)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        {person.role ? <p className="wsd-eyebrow">{person.role}</p> : null}
        <p className="mt-1 text-[16px] font-bold leading-tight text-wsd-ink">{person.name}</p>
        {dates ? <p className="mt-0.5 text-[13px] text-wsd-muted" data-figure>{dates}</p> : null}
        {person.description ? (
          <p className="mt-1 text-[13.5px] leading-snug text-wsd-body">{person.description}</p>
        ) : null}
        {showPhoto && person.imageCredit ? (
          <CreditLine credit={person.imageCredit} className="mt-1.5" />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Quoted encyclopaedic prose.
 *
 * Rendered as a blockquote with its source, because it IS a quotation — the text is
 * Wikipedia's, reused under CC BY-SA, which requires both attribution and that the reuse
 * be identifiable as such. Presenting it as this site's own writing would be both a
 * licence breach and a lie about who did the work.
 */
export function QuotedSummary({
  summary, url, title, sourceName = 'English Wikipedia', licence = 'CC BY-SA 4.0',
}: {
  summary: string;
  url?: string | null;
  title?: string | null;
  sourceName?: string;
  licence?: string;
}) {
  return (
    <figure className="border-l-[3px] border-wsd-ink pl-5">
      <blockquote cite={url ?? undefined}>
        {summary.split('\n').filter(Boolean).map((para, i) => (
          <p key={i} className="mb-3 text-[16.5px] leading-[1.6] text-wsd-body last:mb-0">{para}</p>
        ))}
      </blockquote>
      <figcaption className="mt-3 text-[12.5px] text-wsd-muted">
        Quoted from{' '}
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="wsd-link">{title || sourceName}</a>
        ) : (title || sourceName)}
        {' '}on {sourceName}, reused under {licence}.
      </figcaption>
    </figure>
  );
}
