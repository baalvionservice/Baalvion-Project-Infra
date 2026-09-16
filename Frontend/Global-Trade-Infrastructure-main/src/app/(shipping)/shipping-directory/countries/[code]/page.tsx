/**
 * @file countries/[code]/page.tsx
 * @description One country's shipping sector.
 *
 * This page exists for two reasons. For a reader it answers a question the index cannot —
 * not "how many operators does Greece have" but "which ones, and what do they sail". For
 * a crawler it is the hub that makes the country dimension traversable: without it, a
 * country is a query string, and query strings are where a directory's link graph goes to
 * die.
 *
 * Keyed on the ISO country code rather than the country name so "Korea, Republic of" and
 * "South Korea" cannot become two pages competing for the same query.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCountry, num, typeLabel } from '@/lib/shipping-directory/api';
import { href, canonical, commonsImage } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { SectionHead, Eyebrow, BarRow, TableShell, Th, FleetNumbersNote } from '../../_components/ui';
import { Logo } from '../../_components/media';

/**
 * Revalidation policy: this record changes only when the ingest re-runs, which is monthly
 * at most — NOT every five minutes. The original 300 here was multiplied across ~99,700
 * ISR-backed URLs, and on a metered host every regeneration is a billable ISR write. Seven
 * days, refreshed on demand after an ingest, is what the data actually warrants.
 */
export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const profile = await getCountry(code);
  if (!profile) return { title: 'Country not found', robots: { index: false, follow: true } };

  const s = profile.summary;
  const path = `countries/${code.toLowerCase()}`;
  return {
    title: `Shipping companies in ${s.country}`,
    description: `${num(s.companies)} shipping companies registered in ${s.country}${s.ranked_companies ? `, ${s.ranked_companies} of them ranked container lines` : ''}, holding ${num(s.registry_vessels)} vessels on record. Fleet composition, largest ships and every operator listed.`,
    alternates: { canonical: canonical(path) },
    openGraph: {
      type: 'website',
      title: `Shipping companies in ${s.country} · World Shipping Directory`,
      url: canonical(path),
    },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCountry(code);
  if (!profile) notFound();

  const { summary: s, companies, fleetByType, topShips } = profile;
  const path = `countries/${code.toLowerCase()}`;
  const maxType = Math.max(...fleetByType.map((r) => r.n), 0);

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Countries', path: 'countries' },
        { label: s.country, path },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        companies.map((c) => ({ name: c.name, path: `companies/${c.slug}` })),
        { name: `Shipping companies registered in ${s.country}` },
      ))} />

      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] text-white/55">
              <li><Link href={href()} className="underline-offset-4 hover:text-white hover:underline">Directory</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={href('countries')} className="underline-offset-4 hover:text-white hover:underline">Countries</Link></li>
              <li aria-hidden>/</li>
              <li className="text-white/85" aria-current="page">{s.country}</li>
            </ol>
          </nav>

          <Eyebrow className="!text-white/60">Country of registration · {s.country_code}</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[54px]">
            Shipping companies in {s.country}
          </h1>

          <dl className="mt-10 grid gap-px bg-white/20 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: 'Companies registered', v: num(s.companies), n: 'Commercial operators' },
              { k: 'Ranked container lines', v: s.ranked_companies ? num(s.ranked_companies) : null, n: 'With a published capacity rank' },
              { k: 'Ships on record here', v: num(s.registry_vessels) ?? '0', n: 'Individually attributed vessels' },
              { k: 'Oldest company founded', v: s.oldest_founded ? String(s.oldest_founded) : null, n: 'Earliest founding year on record' },
            ].map((f) => (
              <div key={f.k} className="wsd-ink-field p-5">
                <dt className="wsd-eyebrow !text-white/55">{f.k}</dt>
                <dd>
                  <span data-figure className="mt-2 block text-[30px] font-extrabold leading-none tracking-[-0.03em]">
                    {f.v ?? <span className="text-white/30">—</span>}
                  </span>
                  <span className="mt-2 block text-[12px] text-white/55">{f.n}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        {fleetByType.length ? (
          <section>
            <SectionHead
              eyebrow="Fleet profile"
              title={`What ${s.country}'s operators sail`}
              note={`Composition of the ${num(s.registry_vessels)} vessels attributed to companies registered in ${s.country}. Proportions are of that set, not of the country's full merchant fleet.`}
            />
            <div className="grid gap-x-10 md:grid-cols-2">
              {fleetByType.slice(0, 14).map((r) => (
                <BarRow
                  key={r.vessel_type}
                  label={typeLabel(r.vessel_type)}
                  value={r.n}
                  max={maxType}
                  accent
                  href={href(`ships/type/${r.vessel_type}`)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-20">
          <SectionHead
            eyebrow="Operators"
            title={`All ${num(s.companies)} companies registered in ${s.country}`}
            aside={<Link href={`${href('companies')}?country=${s.country_code}`} className="wsd-link">Open in the company index →</Link>}
          />
          <ul className="border-t border-wsd-ink">
            {companies.map((c) => (
              <li key={c.slug} className="wsd-row">
                <Link href={href(`companies/${c.slug}`)} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5 pl-4">
                  <Logo src={c.logo_url} name={c.name} size="sm" />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-x-3">
                      <span className="text-[16.5px] font-bold text-wsd-ink">{c.name}</span>
                      {c.capacity_rank ? (
                        <span className="bg-wsd-violet px-1.5 py-0.5 text-[11px] font-bold text-white">#{c.capacity_rank}</span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[13px] text-wsd-muted">
                      {[c.industry, c.headquarters, c.founded_year ? `founded ${c.founded_year}` : null]
                        .filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <dl className="flex flex-wrap gap-x-5 gap-y-2 pr-4 sm:shrink-0 sm:gap-x-8">
                    {[
                      { k: 'In registry', v: num(c.registry_vessel_count) ?? '0' },
                      { k: 'Reported fleet', v: num(c.reported_fleet_size) },
                      { k: 'TEU', v: num(c.reported_teu) },
                    ].map((f) => (
                      <div key={f.k} className="w-20 text-right sm:w-24">
                        <dt className="wsd-eyebrow">{f.k}</dt>
                        <dd data-figure className="mt-1 text-[16px] font-bold text-wsd-ink">
                          {f.v ?? <span className="font-normal text-wsd-line">—</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
          <FleetNumbersNote className="mt-6 max-w-3xl" />
        </section>

        {topShips.length ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Largest hulls"
              title={`Biggest ships operated from ${s.country}`}
              note="Ranked by gross tonnage among vessels attributed to companies registered here."
            />
            <TableShell minWidth={860}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th>Type</Th>
                  <Th>Operator</Th>
                  <Th>Flag</Th>
                  <Th align="right">Built</Th>
                  <Th align="right">Gross tonnage</Th>
                </tr>
              </thead>
              <tbody>
                {topShips.map((v) => (
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
                    <td className="px-4 py-2.5 text-wsd-body">{typeLabel(v.vessel_type)}</td>
                    <td className="px-4 py-2.5 text-wsd-body">
                      {v.carrier_slug ? (
                        <Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">{v.carrier_name}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">{v.flag_country ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </section>
        ) : null}
      </div>
    </>
  );
}
