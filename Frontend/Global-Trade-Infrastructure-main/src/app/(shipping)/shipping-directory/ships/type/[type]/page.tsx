/**
 * @file ships/type/[type]/page.tsx
 * @description Every vessel of one type — a real page, not a query string.
 *
 * /ships?type=container and /ships/type/container return the same rows, and that is
 * deliberate: the query string is the working filter, this is the addressable page. A
 * crawler will not treat a parameterised permutation of a search page as a destination,
 * so the twenty-five vessel types would otherwise be invisible as topics no matter how
 * many ships sat behind them. This page is indexed, the filtered search view is not.
 *
 * The type is validated against the known label map rather than passed through, so an
 * arbitrary path segment produces a 404 instead of an empty page that a crawler would
 * happily index by the thousand.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  listVessels, getStats, num, dec, typeLabel, VESSEL_TYPE_LABELS,
} from '@/lib/shipping-directory/api';
import { href, canonical, commonsImage } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { SectionHead, Eyebrow, TableShell, Th, Pagination, EmptyState } from '../../../_components/ui';

/**
 * Revalidation policy: this record changes only when the ingest re-runs, which is monthly
 * at most — NOT every five minutes. The original 300 here was multiplied across ~99,700
 * ISR-backed URLs, and on a metered host every regeneration is a billable ISR write. Seven
 * days, refreshed on demand after an ingest, is what the data actually warrants.
 */
export const revalidate = 604800;

const PAGE_SIZE = 60;
type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Only types the directory actually classifies. Anything else is a 404, not an empty list. */
const isKnownType = (t: string) => Object.prototype.hasOwnProperty.call(VESSEL_TYPE_LABELS, t);

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  if (!isKnownType(type)) return { title: 'Unknown vessel type', robots: { index: false, follow: false } };

  const label = typeLabel(type);
  const stats = await getStats();
  const n = stats?.byType.find((t) => t.vessel_type === type)?.n;

  return {
    title: `${label}s`,
    description: `${n ? `${num(n)} ` : ''}${label.toLowerCase()}s on record, with IMO number, operator, flag state, builder, tonnage and dimensions for each.`,
    alternates: { canonical: canonical(`ships/type/${type}`) },
  };
}

export default async function VesselTypePage({
  params, searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<SP>;
}) {
  const { type } = await params;
  if (!isKnownType(type)) notFound();

  const sp = await searchParams;
  const sort = first(sp.sort) ?? 'tonnage';
  const offset = Number(first(sp.offset) ?? 0) || 0;

  const [result, stats] = await Promise.all([
    listVessels({ type, sort, limit: PAGE_SIZE, offset }),
    getStats(),
  ]);

  if (!result || result.total === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState
          title={`No ${typeLabel(type).toLowerCase()}s on record`}
          detail="This vessel type is one the directory classifies, but no vessel in the registry currently carries it."
          action={<Link href={href('ships')} className="wsd-link">Search the whole registry</Link>}
        />
      </div>
    );
  }

  const label = typeLabel(type);
  const totalVessels = stats?.totals.vessels ?? 0;
  const share = totalVessels > 0 ? (result.total / totalVessels) * 100 : 0;
  const siblings = (stats?.byType ?? []).filter((t) => t.vessel_type !== type).slice(0, 14);

  const pageHref = (o: number) => {
    const params = new URLSearchParams();
    if (sort !== 'tonnage') params.set('sort', sort);
    if (o) params.set('offset', String(o));
    const qs = params.toString();
    return `${href(`ships/type/${type}`)}${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Ships', path: 'ships' },
        { label: `${label}s`, path: `ships/type/${type}` },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        result.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: `${label}s on record`, offset },
      ))} />

      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] text-white/55">
              <li><Link href={href()} className="underline-offset-4 hover:text-white hover:underline">Directory</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={href('ships')} className="underline-offset-4 hover:text-white hover:underline">Ships</Link></li>
              <li aria-hidden>/</li>
              <li className="text-white/85" aria-current="page">{label}s</li>
            </ol>
          </nav>

          <Eyebrow className="!text-white/60">Vessel type</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[54px]">{label}s</h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/80">
            {num(result.total)} {label.toLowerCase()}s on record — {share < 0.1 ? 'under 0.1' : share.toFixed(1)}% of the{' '}
            {num(totalVessels)} vessels in this registry. Classification follows the ship classes stated
            in the source; a hull whose class says only &ldquo;ship&rdquo; is left unclassified rather
            than assigned a type by inference.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-10">
        <SectionHead
          eyebrow="Largest first"
          title={`${num(result.total)} ${label.toLowerCase()}s`}
          aside={<Link href={`${href('ships')}?type=${type}`} className="wsd-link">Refine this list →</Link>}
        />

        <TableShell minWidth={1000}>
          <thead>
            <tr className="border-b border-wsd-ink">
              <Th>Ship</Th>
              <Th>IMO</Th>
              <Th>Operator</Th>
              <Th>Flag</Th>
              <Th align="right">Built</Th>
              <Th align="right">Gross tonnage</Th>
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
                      <img src={commonsImage(v.image_url, 140) ?? ''} alt="" loading="lazy" className="h-10 w-16 shrink-0 border border-wsd-line-soft object-cover" />
                    ) : (
                      <span aria-hidden className="h-10 w-16 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
                    )}
                    <Link href={href(`ships/${v.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">{v.name}</Link>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-wsd-body">{v.imo_number ?? '—'}</td>
                <td className="px-4 py-2.5 text-wsd-body">
                  {v.carrier_slug ? (
                    <Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">{v.carrier_name}</Link>
                  ) : (v.operator_name ?? v.owner_name ?? '—')}
                </td>
                <td className="px-4 py-2.5 text-wsd-body">{v.flag_country ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-wsd-body">{v.length_m ? `${dec(v.length_m)} m` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>

        <Pagination offset={offset} pageSize={PAGE_SIZE} total={result.total} hrefFor={pageHref} />

        {siblings.length ? (
          <section className="mt-16">
            <SectionHead eyebrow="Other types" title="Browse a different class of ship" />
            <div className="flex flex-wrap gap-2">
              {siblings.map((t) => (
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
