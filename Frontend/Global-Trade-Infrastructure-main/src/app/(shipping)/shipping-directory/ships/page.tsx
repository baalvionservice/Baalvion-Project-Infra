/**
 * @file ships/page.tsx
 * @description Vessel search across the whole registry — by name, IMO number, call sign,
 * type, flag state and build year.
 *
 * Deliberately laid out differently from the company index. A reader browsing companies
 * is scanning for a name; a reader browsing ships is comparing hulls, so this is a dense
 * table with a photograph in the first column and every measurement aligned down its own
 * column. The filters sit in a bar across the top rather than a rail, because they are
 * fields to fill in rather than a taxonomy to walk.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { listVessels, getStats, num, dec, typeLabel } from '@/lib/shipping-directory/api';
import { href, canonical, commonsImage } from '@/lib/shipping-directory/site';
import { itemListJsonLd, breadcrumbJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { EmptyState, SectionHead, Eyebrow, TableShell, Th, Pagination, TypeChip, Breadcrumbs } from '../_components/ui';

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

const PAGE_SIZE = 60;
type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function buildHref(sp: SP, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) { const val = first(v); if (val) params.set(k, val); }
  for (const [k, v] of Object.entries(patch)) { if (!v) params.delete(k); else params.set(k, v); }
  if (!('offset' in patch)) params.delete('offset');
  const qs = params.toString();
  return `${href('ships')}${qs ? `?${qs}` : ''}`;
}

const SORTS = [
  { key: 'tonnage', label: 'Largest' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'length', label: 'Longest' },
  { key: 'name', label: 'Name' },
  { key: 'imo', label: 'IMO' },
];

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  /**
   * ANY parameter makes this a permutation of the index, not a page of its own.
   *
   * `scope` and `sort` were missing here, so /companies?scope=all returned index,follow
   * while robots.txt simultaneously told Google not to crawl it — the combination that
   * gets a URL indexed with no content, because a disallowed page's noindex is never read.
   * The robots.txt Disallow for scope/sort has been dropped in favour of this: these are a
   * small, internally-linked set, so letting Google crawl them and read noindex,follow is
   * cleaner than blocking them and hoping.
   */
  const filtered = Boolean(
    first(sp.q) || first(sp.type) || first(sp.flag) || first(sp.offset) || first(sp.sort),
  );
  return {
    title: 'Ships',
    description:
      'Search the vessel registry by name, IMO number, call sign, type, flag state and build year. Full particulars, dimensions, tonnage, builder and operator for every ship on record.',
    alternates: { canonical: canonical('ships') },
    // Filtered permutations stay out of the index; the type landing pages are the
    // indexable, linkable form of the same cut.
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ShipsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = first(sp.q) ?? '';
  const type = first(sp.type) ?? '';
  const flag = first(sp.flag) ?? '';
  const sort = first(sp.sort) ?? 'tonnage';
  const offset = Number(first(sp.offset) ?? 0) || 0;

  const [result, stats] = await Promise.all([
    listVessels({ q, type, flag, sort, limit: PAGE_SIZE, offset }),
    getStats(),
  ]);

  if (!result) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState title="The registry is unavailable" detail="The directory service could not be reached, so no vessel records are shown." />
      </div>
    );
  }

  const types = stats?.byType ?? [];
  const flags = stats?.byFlag ?? [];
  const activeFilters = [
    type ? { label: typeLabel(type), clear: buildHref(sp, { type: undefined }) } : null,
    flag ? { label: flag, clear: buildHref(sp, { flag: undefined }) } : null,
    q ? { label: `“${q}”`, clear: buildHref(sp, { q: undefined }) } : null,
  ].filter(Boolean) as { label: string; clear: string }[];

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Ships', path: 'ships' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        result.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: 'Merchant vessels', offset },
      ))} />

      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={[{ label: 'Directory', href: href() }, { label: 'Ships' }]} />
          </div>
          <Eyebrow className="!text-white/60">Vessel registry</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">Ships</h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/80">
            {num(stats?.totals.vessels)} merchant and state-operated vessels keyed on their IMO number.
            Search by name, IMO, call sign or builder, then narrow by type, flag state and size.
          </p>

          {/* Filters as a bar. GET form, so every result set is a shareable URL. */}
          <form action={href('ships')} className="mt-8 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input type="hidden" name="sort" value={sort} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Ship name, IMO number, call sign or builder…"
              aria-label="Search vessels"
              className="border-2 border-white bg-white px-4 py-3 text-[15px] text-wsd-ink outline-none placeholder:text-wsd-muted"
            />
            <select
              name="type"
              defaultValue={type}
              aria-label="Vessel type"
              className="border-2 border-white bg-white px-3 py-3 text-[15px] text-wsd-ink outline-none"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t.vessel_type} value={t.vessel_type}>{typeLabel(t.vessel_type)} ({t.n})</option>
              ))}
            </select>
            <select
              name="flag"
              defaultValue={flag}
              aria-label="Flag state"
              className="border-2 border-white bg-white px-3 py-3 text-[15px] text-wsd-ink outline-none"
            >
              <option value="">All flags</option>
              {flags.map((f) => (
                <option key={f.flag_country} value={f.flag_country}>{f.flag_country} ({f.n})</option>
              ))}
            </select>
            <button type="submit" className="bg-wsd-violet px-7 py-3 text-[15px] font-bold transition-colors hover:bg-wsd-violet-deep">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow>Sort</Eyebrow>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={buildHref(sp, { sort: s.key })}
                className={`px-2 py-1 text-[13.5px] transition-colors ${
                  sort === s.key ? 'bg-wsd-ink font-bold text-white' : 'text-wsd-body hover:text-wsd-violet'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
          {activeFilters.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>Filtered by</Eyebrow>
              {activeFilters.map((f) => (
                <Link
                  key={f.label}
                  href={f.clear}
                  className="inline-flex items-center gap-1.5 border border-wsd-ink px-2.5 py-1 text-[12.5px] font-semibold transition-colors hover:bg-wsd-ink hover:text-white"
                >
                  {f.label} <span aria-hidden>×</span>
                </Link>
              ))}
              <Link href={href('ships')} className="text-[12.5px] font-semibold text-wsd-violet hover:underline">Clear all</Link>
            </div>
          ) : null}
        </div>

        <SectionHead
          eyebrow="Results"
          title={`${num(result.total)} ${result.total === 1 ? 'vessel' : 'vessels'}`}
          aside={type ? <Link href={href(`ships/type/${type}`)} className="wsd-link">About {typeLabel(type).toLowerCase()}s →</Link> : null}
        />

        {result.data.length === 0 ? (
          <EmptyState
            title="No ships match"
            detail="Try a different name, IMO number or filter combination. IMO numbers are seven digits and can be entered with or without the 'IMO' prefix."
          />
        ) : (
          <>
            <TableShell minWidth={1100}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th>IMO</Th>
                  <Th>Type</Th>
                  <Th>Operator</Th>
                  <Th>Flag</Th>
                  <Th align="right">Built</Th>
                  <Th align="right">Gross tonnage</Th>
                  <Th align="right">Deadweight</Th>
                  <Th align="right">Length</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((v) => (
                  <tr key={v.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {v.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={commonsImage(v.image_url, 140) ?? ''}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-10 w-16 shrink-0 border border-wsd-line-soft object-cover"
                          />
                        ) : (
                          <span aria-hidden className="h-10 w-16 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
                        )}
                        <Link href={href(`ships/${v.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">
                          {v.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">{v.imo_number ?? '—'}</td>
                    <td className="px-4 py-2.5"><TypeChip type={v.vessel_type} link /></td>
                    <td className="px-4 py-2.5 text-wsd-body">
                      {v.carrier_slug ? (
                        <Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">{v.carrier_name}</Link>
                      ) : (v.operator_name ?? v.owner_name ?? '—')}
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">{v.flag_country ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-wsd-body">{num(v.deadweight_tons) ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-wsd-body">{v.length_m ? `${dec(v.length_m)} m` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <Pagination
              offset={offset}
              pageSize={PAGE_SIZE}
              total={result.total}
              hrefFor={(o) => buildHref(sp, { offset: String(o) })}
            />
          </>
        )}

        {/* Type landing pages are the crawlable form of the type filter. */}
        {types.length ? (
          <section className="mt-16">
            <SectionHead eyebrow="Browse" title="By vessel type" />
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <Link
                  key={t.vessel_type}
                  href={href(`ships/type/${t.vessel_type}`)}
                  className="inline-flex items-baseline gap-2 border border-wsd-line-soft px-3 py-1.5 text-[13.5px] font-semibold text-wsd-body transition-colors hover:border-wsd-violet hover:text-wsd-violet"
                >
                  {typeLabel(t.vessel_type)}
                  <span data-figure className="text-[12px] text-wsd-muted">{num(t.n)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
