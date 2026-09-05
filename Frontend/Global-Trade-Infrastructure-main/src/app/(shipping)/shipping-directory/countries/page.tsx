/**
 * @file countries/page.tsx
 * @description Shipping companies grouped by the country they are registered in.
 *
 * Two orderings on one page, because the reader arrives with one of two questions.
 * "Which countries have the biggest shipping sectors?" is answered by the ranked band at
 * the top; "where is Cyprus?" is answered by the A–Z index below it. Neither is a
 * satisfactory sole answer, and picking one would make the other question a scrolling
 * exercise through 90 rows.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCountries, num } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { EmptyState, SectionHead, Eyebrow, BarRow, Breadcrumbs } from '../_components/ui';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shipping companies by country',
  description:
    'Shipping companies grouped by their country of registration, with the number of operators and the fleet each country’s companies hold on record between them.',
  alternates: { canonical: canonical('countries') },
};

export default async function CountriesPage() {
  const countries = await getCountries();

  if (!countries || countries.length === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState title="No country data available" detail="The registry could not be reached, or holds no company with a country on record." />
      </div>
    );
  }

  const totalCompanies = countries.reduce((s, c) => s + c.companies, 0);
  const totalVessels = countries.reduce((s, c) => s + (c.registry_vessels ?? 0), 0);
  const max = Math.max(...countries.map((c) => c.companies), 0);
  const leaders = countries.slice(0, 12);

  const linkFor = (c: (typeof countries)[number]) =>
    (c.country_code
      ? href(`countries/${c.country_code.toLowerCase()}`)
      : `${href('companies')}?q=${encodeURIComponent(c.country)}`);

  // A–Z, grouped by initial. Sorted by name within each group so the index behaves like
  // an index rather than like the ranked band above it.
  const alphabetical = [...countries].sort((a, b) => a.country.localeCompare(b.country));
  const groups = new Map<string, typeof countries>();
  for (const c of alphabetical) {
    const initial = c.country.charAt(0).toUpperCase();
    if (!groups.has(initial)) groups.set(initial, []);
    groups.get(initial)!.push(c);
  }

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Countries', path: 'countries' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        countries.filter((c) => c.country_code).map((c) => ({
          name: c.country, path: `countries/${c.country_code!.toLowerCase()}`,
        })),
        { name: 'Shipping companies by country of registration' },
      ))} />

      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={[{ label: 'Directory', href: href() }, { label: 'Countries' }]} />
          </div>
          <Eyebrow className="!text-white/60">By jurisdiction</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
            Shipping companies by country
          </h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/80">
            {num(totalCompanies)} commercial operators across {num(countries.length)} countries of
            registration, holding {num(totalVessels)} vessels on record between them.
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/55">
            Country here is the company&rsquo;s country of registration, not the flag its ships fly.
            The two frequently differ, and flag states are shown on each ship&rsquo;s own page.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        <section>
          <SectionHead
            eyebrow="Largest sectors"
            title="Where the operators are registered"
            note="Ranked by the number of commercial shipping companies registered in each country."
          />
          <div className="grid gap-x-10 md:grid-cols-2">
            {leaders.map((c) => (
              <BarRow
                key={`${c.country}-${c.country_code ?? ''}`}
                label={c.country}
                value={c.companies}
                max={max}
                accent
                suffix="companies"
                href={linkFor(c)}
              />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <SectionHead eyebrow="Full index" title="Every country, A–Z" aside={`${num(countries.length)} countries`} />
          <div className="space-y-10">
            {[...groups.entries()].map(([initial, group]) => (
              <div key={initial} className="grid gap-x-8 gap-y-2 md:grid-cols-[3rem_1fr]">
                <p aria-hidden className="text-[30px] font-extrabold leading-none tracking-[-0.04em] text-wsd-line">
                  {initial}
                </p>
                <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((c) => (
                    <li key={`${c.country}-${c.country_code ?? ''}`}>
                      <Link
                        href={linkFor(c)}
                        className="flex items-baseline justify-between gap-3 border-b border-wsd-line-soft py-2 transition-colors hover:text-wsd-violet"
                      >
                        <span className="truncate text-[15px] text-wsd-body">{c.country}</span>
                        <span data-figure className="shrink-0 text-[13px] font-semibold text-wsd-muted">
                          {num(c.companies)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
