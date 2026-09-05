/**
 * Shared presentational kit for the directory.
 *
 * Two rules run through all of it:
 *
 *  1. A missing value renders as an explicit em-dash, never as a zero, a placeholder or a
 *     silently omitted row. "—" tells the reader we do not know; "0" tells them we do.
 *  2. Any figure a reader might quote carries what it is a count OF, and where it came
 *     from, in the same block. That is why `Figure` has no source-less variant.
 */
import Link from 'next/link';
import { num, typeLabel } from '@/lib/shipping-directory/api';
import { href } from '@/lib/shipping-directory/site';

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`wsd-eyebrow ${className}`}>{children}</p>;
}

/** Section opener: a rule, an eyebrow, a heading, and optionally something right-aligned. */
export function SectionHead({
  eyebrow, title, aside, note, id,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  note?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="wsd-rule-top mb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={id} className="mt-2 text-[26px] leading-[1.15] text-wsd-ink sm:text-[30px]">{title}</h2>
        </div>
        {aside ? <div className="shrink-0 text-[13px] text-wsd-muted">{aside}</div> : null}
      </div>
      {note ? <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-wsd-body">{note}</p> : null}
    </div>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-wsd-muted">
        {trail.map((t, i) => (
          <li key={`${t.label}-${i}`} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden className="text-wsd-line">/</span> : null}
            {t.href ? (
              <Link href={t.href} className="wsd-link">{t.label}</Link>
            ) : (
              <span className="text-wsd-body" aria-current="page">{t.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * A headline number the reader must be able to attribute.
 *
 * `basis` says what the number counts and is not optional — the whole point of this
 * component is that "1,000 ships" and "36 ships" can both be true of MSC and the page has
 * to say which question each one answers.
 */
export function Figure({
  label, value, basis, source, sourceUrl, asOf, tone = 'plain',
}: {
  label: string;
  value: string | number | null;
  basis: string;
  source?: string | null;
  sourceUrl?: string | null;
  asOf?: string | null;
  tone?: 'plain' | 'ink' | 'violet';
}) {
  const empty = value === null || value === undefined || value === '';
  const surface =
    tone === 'violet' ? 'wsd-violet-field text-white'
      : tone === 'ink' ? 'bg-wsd-ink text-white'
        : 'bg-white text-wsd-ink border border-wsd-line-soft';
  const dim = tone === 'plain' ? 'text-wsd-muted' : 'text-white/70';

  return (
    <div className={`flex h-full flex-col p-5 ${surface}`}>
      <p className={`wsd-eyebrow ${tone === 'plain' ? '' : '!text-white/70'}`}>{label}</p>
      <p data-figure className="mt-3 text-[38px] font-extrabold leading-none tracking-[-0.03em]">
        {empty ? <span className={tone === 'plain' ? 'text-wsd-line' : 'text-white/35'}>—</span> : value}
      </p>
      <p className={`mt-auto pt-3 text-[12.5px] leading-snug ${dim}`}>
        <span className="font-semibold">{basis}</span>
        {source ? (
          <>
            {' · '}
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{source}</a>
            ) : source}
          </>
        ) : null}
        {asOf ? ` · as of ${String(asOf).slice(0, 10)}` : null}
      </p>
    </div>
  );
}

/** Label/value row inside a definition list. Renders nothing when there is nothing to say. */
export function Field({
  label, children, hideEmpty = false,
}: {
  label: string;
  children: React.ReactNode;
  hideEmpty?: boolean;
}) {
  const empty = children === null || children === undefined || children === '' || children === false;
  if (empty && hideEmpty) return null;
  return (
    <div className="flex justify-between gap-6 border-b border-wsd-line-soft py-2.5 text-[14.5px] last:border-0">
      <dt className="shrink-0 text-wsd-muted">{label}</dt>
      <dd className="text-right font-semibold text-wsd-ink">
        {empty ? <span className="font-normal text-wsd-line">—</span> : children}
      </dd>
    </div>
  );
}

export function Chip({
  children, href: to, tone = 'plain',
}: {
  children: React.ReactNode;
  href?: string;
  tone?: 'plain' | 'violet' | 'ink' | 'outline';
}) {
  const styles = {
    plain: 'border-wsd-line-soft bg-wsd-ground-alt text-wsd-body',
    outline: 'border-wsd-ink text-wsd-ink',
    violet: 'border-wsd-violet bg-wsd-violet text-white',
    ink: 'border-wsd-ink bg-wsd-ink text-white',
  }[tone];
  const cls = `inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-[12.5px] font-semibold ${styles}`;
  return to ? (
    <Link href={to} className={`${cls} transition-colors hover:border-wsd-violet hover:text-wsd-violet`}>{children}</Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

export function TypeChip({ type, link = false }: { type: string; link?: boolean }) {
  const label = typeLabel(type);
  return link
    ? <Chip href={href(`ships/type/${type}`)}>{label}</Chip>
    : <Chip>{label}</Chip>;
}

/** Horizontal magnitude bar. Widths are true proportions of `max`. */
export function BarRow({
  label, value, max, href: to, suffix, accent = false,
}: {
  label: string;
  value: number;
  max: number;
  href?: string;
  suffix?: string;
  accent?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[14.5px] text-wsd-body">{label}</span>
        <span data-figure className="shrink-0 text-[14.5px] font-bold text-wsd-ink">
          {num(value)}{suffix ? <span className="ml-1 font-normal text-wsd-muted">{suffix}</span> : null}
        </span>
      </div>
      <div className="wsd-bar-track mt-1.5">
        {/* A zero really is a zero-width bar. A minimum width would flatter it. */}
        <div className="wsd-bar-fill" data-accent={accent ? 'violet' : undefined} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
  return (
    <div className="border-b border-wsd-line-soft py-2.5 last:border-0">
      {to ? <Link href={to} className="block transition-opacity hover:opacity-70">{body}</Link> : body}
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-wsd-line bg-wsd-ground-alt px-8 py-14 text-center">
      <p className="text-[17px] font-bold text-wsd-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-wsd-body">{detail}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Horizontally scrollable table shell — wide fleet tables must not scroll the page body. */
export function TableShell({ children, minWidth = 900 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto border-y border-wsd-ink">
      <table className="w-full text-[14.5px]" style={{ minWidth }}>{children}</table>
    </div>
  );
}

export function Th({
  children, align = 'left', className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 font-bold ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      <span className="wsd-eyebrow !text-wsd-ink">{children}</span>
    </th>
  );
}

export function Pagination({
  offset, pageSize, total, hrefFor,
}: {
  offset: number;
  pageSize: number;
  total: number;
  hrefFor: (offset: number) => string;
}) {
  if (total <= pageSize) return null;
  const page = Math.floor(offset / pageSize) + 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const btn = 'rounded-[2px] border border-wsd-ink px-4 py-2 text-[14px] font-semibold transition-colors hover:bg-wsd-ink hover:text-white';
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-[14px] text-wsd-muted">
        Showing <span className="font-semibold text-wsd-ink">{num(offset + 1)}–{num(Math.min(offset + pageSize, total))}</span>
        {' '}of {num(total)} · page {num(page)} of {num(pages)}
      </p>
      <div className="flex gap-2">
        {offset > 0 ? <Link href={hrefFor(Math.max(0, offset - pageSize))} className={btn}>← Previous</Link> : null}
        {offset + pageSize < total ? <Link href={hrefFor(offset + pageSize)} className={btn}>Next →</Link> : null}
      </div>
    </div>
  );
}

/**
 * The standing note about the two fleet measurements. It appears on every surface that
 * shows both, so it is written once — a page that quietly drops it is a page where a
 * reader can mistake one number for the other.
 */
export function FleetNumbersNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[13px] leading-relaxed text-wsd-muted ${className}`}>
      <strong className="font-semibold text-wsd-body">Ships in registry</strong> counts individual
      vessel records attributed to the company here.{' '}
      <strong className="font-semibold text-wsd-body">Reported fleet</strong> is the company&rsquo;s
      published total. They measure different things and are shown separately on purpose.
    </p>
  );
}
