/**
 * Shared rendering for the two cohort hubs — one shipbuilder, one flag state.
 *
 * WHY THESE PAGES EXIST. build-context.js computes statistics for 1,165 yards and 212
 * registries, and until now none of them had a page: a builder was reachable only as
 * `/ships?q=Hyundai` and a flag as `/ships?flag=Panama`. Both are filtered search views
 * that carry noindex, and a crawler treats them as permutations of one page rather than
 * as destinations. That left ~1,380 entity pages with genuine list intent behind them
 * ("Panama flagged ships", "ships built by Hyundai Heavy Industries") unbuilt on data
 * already in the database.
 *
 * One component, two routes, because the pages are structurally identical and the only
 * differences are the noun and which column the vessels were grouped by. Splitting them
 * into two near-copies would guarantee they drift.
 */
import Link from 'next/link';
import { num, typeLabel, type CohortHub } from '@/lib/shipping-directory/api';
import { href, commonsImage } from '@/lib/shipping-directory/site';
import {
  SectionHead, Eyebrow, BarRow, TableShell, Th, Pagination, Chip, Breadcrumbs,
} from './ui';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${num(n)}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function CohortHubPage({
  hub, dimension, pageHref,
}: {
  hub: CohortHub;
  dimension: 'builder' | 'flag' | 'flag_type';
  pageHref: (offset: number) => string;
}) {
  const { cohort, rank, vessels, byType, topOperators } = hub;
  const isBuilder = dimension === 'builder';
  /**
   * The flag x type cross-cut. Same page shape, but the fixed dimension is now two values
   * rather than one, so the sidebar breaks down by BUILDER (the type is already fixed) and
   * the heading names both.
   */
  const isCross = dimension === 'flag_type';
  const crossFlag = (cohort as { flag?: string }).flag ?? '';
  const crossType = (cohort as { vesselType?: string }).vesselType ?? '';
  const noun = isBuilder ? 'shipbuilder' : (isCross ? 'flag and type combination' : 'flag state');
  const maxType = Math.max(...byType.map((t) => t.n), 0);
  const span = cohort.oldest_year && cohort.newest_year && cohort.oldest_year !== cohort.newest_year
    ? `${cohort.oldest_year}–${cohort.newest_year}`
    : (cohort.oldest_year ? String(cohort.oldest_year) : null);

  return (
    <>
      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] text-white/55">
              <li><Link href={href()} className="underline-offset-4 hover:text-white hover:underline">Directory</Link></li>
              <li aria-hidden>/</li>
              <li>
                <Link href={href(isBuilder ? 'builders' : 'flags')} className="underline-offset-4 hover:text-white hover:underline">
                  {isBuilder ? 'Shipbuilders' : 'Flag states'}
                </Link>
              </li>
              <li aria-hidden>/</li>
              {isCross ? (
                <>
                  <li>
                    <Link href={href(`flags/${cohort.slug.split('/')[0]}`)} className="underline-offset-4 hover:text-white hover:underline">
                      {crossFlag}
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li className="text-white/85" aria-current="page">{typeLabel(crossType)}</li>
                </>
              ) : (
                <li className="text-white/85" aria-current="page">{cohort.cohort_key}</li>
              )}
            </ol>
          </nav>

          <Eyebrow className="!text-white/60">
            {isBuilder ? 'Shipbuilder' : (isCross ? `Flag state · ${typeLabel(crossType)}` : 'Flag state')}
          </Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[54px]">
            {isBuilder
              ? `Ships built by ${cohort.cohort_key}`
              : (isCross
                ? `${crossFlag}-flagged ${typeLabel(crossType).toLowerCase()}s`
                : `Ships flagged ${cohort.cohort_key}`)}
          </h1>

          <p className="mt-5 max-w-3xl text-[16.5px] leading-relaxed text-white/80">
            This registry holds <strong>{num(cohort.n)} vessels</strong>{' '}
            {isBuilder
              ? `built by ${cohort.cohort_key}`
              : (isCross
                ? `of this type registered under the flag of ${crossFlag}`
                : `registered under the flag of ${cohort.cohort_key}`)}
            {span ? <>, delivered between {span}</> : null}
            {rank ? (
              <> — making it the {ordinal(rank.rank)} most numerous of the {num(rank.peers)}{' '}
                {noun}s on record here</>
            ) : null}
            .{' '}
            {isCross && cohort.top_builder ? (
              <>The yard appearing most often against them is {cohort.top_builder}
                ({num(cohort.top_builder_n)} hulls).</>
            ) : (!isCross && cohort.top_type ? (
              <>
                The most common class is {typeLabel(cohort.top_type).toLowerCase()}s
                ({num(cohort.top_type_n)} ships).
              </>
            ) : null)}
          </p>

          <dl className="mt-10 grid gap-px bg-white/20 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: 'Ships on record', v: num(cohort.n), n: `Of ${num(rank?.peers ?? 0)} ${noun}s here` },
              { k: 'Median tonnage', v: cohort.median_gt ? `${num(cohort.median_gt)} GT` : null, n: `Across ${num(cohort.with_gt)} reporting a tonnage` },
              { k: 'Largest', v: cohort.max_gt ? `${num(cohort.max_gt)} GT` : null, n: 'Biggest hull on record' },
              { k: 'Delivery span', v: span, n: 'Earliest to latest build year' },
            ].map((f) => (
              <div key={f.k} className="wsd-ink-field p-5">
                <dt className="wsd-eyebrow !text-white/55">{f.k}</dt>
                <dd>
                  <span data-figure className="mt-2 block text-[26px] font-extrabold leading-none tracking-[-0.03em]">
                    {f.v ?? <span className="text-white/30">—</span>}
                  </span>
                  <span className="mt-2 block text-[12px] leading-snug text-white/55">{f.n}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <SectionHead
              eyebrow="Largest first"
              title={`${num(vessels.total)} vessels`}
              aside={isCross
                ? <Link href={href(`ships/type/${crossType}`)} className="wsd-link">All {typeLabel(crossType).toLowerCase()}s →</Link>
                : (isBuilder
                  ? <Link href={`${href('ships')}?q=${encodeURIComponent(cohort.cohort_key)}`} className="wsd-link">Refine →</Link>
                  : <Link href={`${href('ships')}?flag=${encodeURIComponent(cohort.cohort_key)}`} className="wsd-link">Refine →</Link>)}
            />
            <TableShell minWidth={980}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th>IMO</Th>
                  <Th>Type</Th>
                  <Th>{isBuilder ? 'Flag' : 'Builder'}</Th>
                  <Th>Operator</Th>
                  <Th align="right">Built</Th>
                  <Th align="right">Gross tonnage</Th>
                </tr>
              </thead>
              <tbody>
                {vessels.data.map((v) => (
                  <tr key={v.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {v.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={commonsImage(v.image_url, 140) ?? ''} alt="" loading="lazy" className="h-10 w-16 shrink-0 border border-wsd-line-soft object-cover" />
                        ) : (
                          <span aria-hidden className="h-10 w-16 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
                        )}
                        <Link href={href(`ships/${v.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">{v.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">{v.imo_number ?? '—'}</td>
                    <td className="px-4 py-2.5 text-wsd-body">{typeLabel(v.vessel_type)}</td>
                    <td className="px-4 py-2.5 text-wsd-body">
                      {isBuilder ? (v.flag_country ?? '—') : (v.builder_name ?? '—')}
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">
                      {v.carrier_slug ? (
                        <Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">{v.carrier_name}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <Pagination offset={vessels.offset} pageSize={vessels.limit} total={vessels.total} hrefFor={pageHref} />
          </div>

          <aside className="space-y-10">
            {byType.length ? (
              <div>
                <Eyebrow className="mb-3">{isCross ? 'By shipbuilder' : 'By vessel type'}</Eyebrow>
                {byType.slice(0, 12).map((t) => (
                  <BarRow
                    key={t.vessel_type}
                    label={isCross ? t.vessel_type : typeLabel(t.vessel_type)}
                    value={t.n}
                    max={maxType}
                    accent
                    href={isCross
                      ? (t.slug ? href(`builders/${t.slug}`) : undefined)
                      : href(`ships/type/${t.vessel_type}`)}
                  />
                ))}
              </div>
            ) : null}

            {topOperators.length ? (
              <div>
                <Eyebrow className="mb-3">Operators with the most of these</Eyebrow>
                <ul className="space-y-1">
                  {topOperators.map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={href(`companies/${o.slug}`)}
                        className="flex items-baseline justify-between gap-3 border-b border-wsd-line-soft py-2 text-[14.5px] transition-colors hover:text-wsd-violet"
                      >
                        <span className="truncate text-wsd-body">{o.name}</span>
                        <span data-figure className="shrink-0 font-semibold text-wsd-ink">{num(o.n)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <Eyebrow className="mb-3">Browse</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {isCross ? (
                  <>
                    <Chip href={href(`flags/${cohort.slug.split('/')[0]}`)}>All {crossFlag} ships</Chip>
                    <Chip href={href(`ships/type/${crossType}`)}>All {typeLabel(crossType).toLowerCase()}s</Chip>
                  </>
                ) : null}
                <Chip href={href(isBuilder ? 'builders' : 'flags')}>
                  All {isBuilder ? 'shipbuilders' : 'flag states'}
                </Chip>
                <Chip href={href('ships')}>Search all ships</Chip>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/**
 * The index of every builder or flag state, ranked by hulls on record.
 *
 * PAGINATED, because 1,514 shipbuilders rendered in one document came to 3.11 MB — slow to
 * download, slow to parse, and a poor LCP on a page whose whole purpose is to be crawled.
 * (A headless browser could not finish parsing it inside 120s, which is how it was found.)
 * Nothing is lost by splitting it: every builder page is listed individually in the
 * sitemap, so discovery never depended on this page showing all of them at once.
 */
const INDEX_PAGE_SIZE = 200;

export function CohortIndexPage({
  rows, dimension, offset = 0, pageHref,
}: {
  rows: { slug: string; cohort_key: string; n: number; median_gt: string | number | null; oldest_year: number | null; newest_year: number | null; top_type: string | null }[];
  dimension: 'builder' | 'flag';
  offset?: number;
  pageHref?: (offset: number) => string;
}) {
  const isBuilder = dimension === 'builder';
  // The bar scale comes from the WHOLE set, not the visible page, or bars would rescale
  // between pages and imply page 2's leader is as large as page 1's.
  const max = Math.max(...rows.map((r) => r.n), 0);
  const total = rows.reduce((s, r) => s + r.n, 0);
  const visible = rows.slice(offset, offset + INDEX_PAGE_SIZE);

  return (
    <>
      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          {/* Visible trail to match the BreadcrumbList this page declares — structured
              data has to reflect what is actually on the page. */}
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={[
              { label: 'Directory', href: href() },
              { label: isBuilder ? 'Shipbuilders' : 'Flag states' },
            ]} />
          </div>
          <Eyebrow className="!text-white/60">{isBuilder ? 'By yard' : 'By registry'}</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
            {isBuilder ? 'Shipbuilders' : 'Flag states'}
          </h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/80">
            {num(rows.length)} {isBuilder ? 'yards' : 'countries of registry'} appear against the{' '}
            {num(total)} vessels this registry can attribute to one. Ranked by hulls on record
            {rows.length > INDEX_PAGE_SIZE ? <>, {num(INDEX_PAGE_SIZE)} at a time</> : null}.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        <SectionHead
          eyebrow="Ranked"
          title={isBuilder ? 'Every yard on record' : 'Every flag state on record'}
          note={isBuilder
            ? 'A yard is credited with a hull where the source names it as builder. Vessels with no builder recorded appear under none of these.'
            : 'The flag a ship flies is its country of registry, which frequently differs from where its operator is registered — company country is shown separately.'}
        />
        <ol className="border-t border-wsd-ink">
          {visible.map((r, i) => (
            <li key={r.slug} className="wsd-row">
              <Link
                href={href(`${isBuilder ? 'builders' : 'flags'}/${r.slug}`)}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 pl-4"
              >
                <span data-figure className="w-10 shrink-0 text-[15px] font-bold text-wsd-line">{offset + i + 1}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="text-[16.5px] font-bold text-wsd-ink">{r.cohort_key}</p>
                  <p className="mt-0.5 text-[12.5px] text-wsd-muted">
                    {[
                      r.top_type ? `mostly ${typeLabel(r.top_type).toLowerCase()}s` : null,
                      r.oldest_year && r.newest_year ? `${r.oldest_year}–${r.newest_year}` : null,
                      r.median_gt ? `median ${num(r.median_gt)} GT` : null,
                    ].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="w-40 shrink-0 pr-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="wsd-eyebrow">Ships</span>
                    <span data-figure className="text-[16px] font-bold text-wsd-ink">{num(r.n)}</span>
                  </div>
                  <div className="wsd-bar-track mt-1">
                    <div className="wsd-bar-fill" data-accent="violet" style={{ width: `${max > 0 ? (r.n / max) * 100 : 0}%` }} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        {pageHref ? (
          <Pagination offset={offset} pageSize={INDEX_PAGE_SIZE} total={rows.length} hrefFor={pageHref} />
        ) : null}
      </div>
    </>
  );
}
