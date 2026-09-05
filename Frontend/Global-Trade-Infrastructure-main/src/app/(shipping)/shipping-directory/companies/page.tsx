/**
 * @file companies/page.tsx
 * @description The company directory index — searchable, filterable, paginated.
 *
 * A Server Component driven entirely by URL search params: every filter is a link, not
 * client state, so every view is shareable, cacheable and crawlable. `scope` chooses
 * which population is being browsed, because "all shipping companies" genuinely means
 * different sets — every operator on record, only those we hold ships for, or only the
 * ranked container lines.
 *
 * Laid out as rows divided by hairlines rather than as a table or a grid of cards. With
 * 1,700 operators the reader is scanning for a name, and a row gives the name the full
 * measure while keeping the numbers aligned down the right.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { listCompanies, getStats, num, type Company } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { itemListJsonLd, breadcrumbJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { EmptyState, SectionHead, Eyebrow, Pagination, FleetNumbersNote, Breadcrumbs } from '../_components/ui';
import { Logo } from '../_components/media';

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

const PAGE_SIZE = 50;

const SCOPES = [
  { key: 'commercial', label: 'Commercial operators', hint: 'Companies. Excludes navies, state fleets and private owners.' },
  { key: 'with_fleet', label: 'With ships on record', hint: 'At least one vessel attributed here' },
  { key: 'ranked', label: 'Ranked container lines', hint: 'Carries a published capacity ranking' },
  { key: 'all', label: 'Everything', hint: 'Includes state fleets and private owners' },
];

const SORTS = [
  { key: 'rank', label: 'Capacity rank' },
  { key: 'fleet', label: 'Ships in registry' },
  { key: 'reported', label: 'Reported fleet size' },
  { key: 'tonnage', label: 'Gross tonnage' },
  { key: 'founded', label: 'Oldest first' },
  { key: 'name', label: 'Name (A–Z)' },
];

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function buildHref(sp: SP, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = first(v);
    if (val) params.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === '') params.delete(k);
    else params.set(k, v);
  }
  // Changing a filter always returns to page one; keeping the offset would land the
  // reader past the end of a smaller result set.
  if (!('offset' in patch)) params.delete('offset');
  const qs = params.toString();
  return `${href('companies')}${qs ? `?${qs}` : ''}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = first(sp.q) ?? '';
  const country = first(sp.country) ?? '';
  const offset = Number(first(sp.offset) ?? 0) || 0;
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
  const filtered = Boolean(q || country || offset || first(sp.scope) || first(sp.sort));

  return {
    title: 'Shipping companies',
    description:
      'Every shipping company on record — container lines, tanker and bulk operators, ferry and cruise companies — with fleet size, tonnage, country of registration and published capacity ranking.',
    // The canonical for every filtered or paged view is the unfiltered index. Those views
    // are real and useful to a reader but they are permutations of one page, and letting
    // each self-canonicalise would put thousands of near-identical URLs into the index.
    alternates: { canonical: canonical('companies') },
    robots: filtered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = first(sp.q) ?? '';
  const country = first(sp.country) ?? '';
  const scope = first(sp.scope) ?? 'commercial';
  const sort = first(sp.sort) ?? 'rank';
  const offset = Number(first(sp.offset) ?? 0) || 0;

  const [result, stats] = await Promise.all([
    listCompanies({ q, country, scope, sort, limit: PAGE_SIZE, offset }),
    getStats(),
  ]);

  if (!result) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState
          title="The registry is unavailable"
          detail="The directory service could not be reached. Rather than show approximate data, nothing is displayed."
        />
      </div>
    );
  }

  const { data, total } = result;
  const countries = stats?.topCountries ?? [];
  const activeCountry = countries.find((c) => c.country_code?.toUpperCase() === country.toUpperCase());

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Companies', path: 'companies' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        data.map((c) => ({ name: c.name, path: `companies/${c.slug}` })),
        { name: 'Shipping companies', offset },
      ))} />

      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={[{ label: 'Directory', href: href() }, { label: 'Companies' }]} />
          </div>
          <Eyebrow className="!text-white/60">Directory</Eyebrow>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
            Shipping companies
          </h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/80">
            Container lines, tanker and bulk operators, ferry and cruise companies, ship managers and
            state fleets — with the ships each one has on record here and the fleet size it publishes
            itself.
          </p>

          <form action={href('companies')} className="mt-8 flex max-w-2xl flex-wrap gap-2">
            <input type="hidden" name="scope" value={scope} />
            <input type="hidden" name="sort" value={sort} />
            {country ? <input type="hidden" name="country" value={country} /> : null}
            <input
              name="q"
              defaultValue={q}
              placeholder="Company name or country…"
              aria-label="Search shipping companies"
              className="min-w-[240px] flex-1 border-2 border-white bg-white px-4 py-3 text-[15px] text-wsd-ink outline-none placeholder:text-wsd-muted"
            />
            <button type="submit" className="bg-wsd-violet px-6 py-3 text-[15px] font-bold transition-colors hover:bg-wsd-violet-deep">
              Search
            </button>
            {q || country ? (
              <Link
                href={buildHref({ scope: sp.scope, sort: sp.sort }, {})}
                className="border border-white/40 px-5 py-3 text-[15px] font-semibold transition-colors hover:bg-white hover:text-wsd-ink"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1340px] gap-10 px-6 py-12 lg:grid-cols-[260px_1fr]">
        {/* ── Refine rail ──────────────────────────────────────────────────────── */}
        <aside className="wsd-no-print lg:sticky lg:top-[120px] lg:self-start">
          <p className="wsd-rule-top wsd-eyebrow !text-wsd-ink">Refine</p>

          <div className="mt-6">
            <Eyebrow className="mb-3">Population</Eyebrow>
            <ul className="space-y-1">
              {SCOPES.map((s) => (
                <li key={s.key}>
                  <Link
                    href={buildHref(sp, { scope: s.key })}
                    title={s.hint}
                    aria-current={scope === s.key ? 'true' : undefined}
                    className={`flex items-baseline gap-2 border-l-[3px] py-1.5 pl-3 text-[14.5px] transition-colors ${
                      scope === s.key
                        ? 'border-wsd-violet font-bold text-wsd-ink'
                        : 'border-transparent text-wsd-body hover:border-wsd-line hover:text-wsd-ink'
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 pl-3 text-[12px] leading-snug text-wsd-muted">
              {SCOPES.find((s) => s.key === scope)?.hint}
            </p>
          </div>

          <div className="mt-8">
            <Eyebrow className="mb-3">Sort by</Eyebrow>
            <ul className="space-y-1">
              {SORTS.map((s) => (
                <li key={s.key}>
                  <Link
                    href={buildHref(sp, { sort: s.key })}
                    className={`block py-1 text-[14.5px] transition-colors ${
                      sort === s.key ? 'font-bold text-wsd-violet' : 'text-wsd-body hover:text-wsd-ink'
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {countries.length ? (
            <div className="mt-8">
              <Eyebrow className="mb-3">Country of registration</Eyebrow>
              <ul className="space-y-1">
                {country ? (
                  <li>
                    <Link href={buildHref(sp, { country: undefined })} className="block py-1 text-[14.5px] font-bold text-wsd-violet">
                      ← All countries
                    </Link>
                  </li>
                ) : null}
                {countries.slice(0, 14).map((c) => (
                  <li key={c.country}>
                    <Link
                      href={buildHref(sp, { country: c.country_code ?? undefined })}
                      className={`flex items-baseline justify-between gap-2 py-1 text-[14.5px] transition-colors ${
                        c.country_code?.toUpperCase() === country.toUpperCase()
                          ? 'font-bold text-wsd-violet'
                          : 'text-wsd-body hover:text-wsd-ink'
                      }`}
                    >
                      <span className="truncate">{c.country}</span>
                      <span data-figure className="shrink-0 text-[12.5px] text-wsd-muted">{num(c.n)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={href('countries')} className="mt-3 inline-block text-[13px] font-semibold text-wsd-violet hover:underline">
                All countries →
              </Link>
            </div>
          ) : null}
        </aside>

        {/* ── Results ──────────────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <SectionHead
            eyebrow={activeCountry ? `Registered in ${activeCountry.country}` : SCOPES.find((s) => s.key === scope)?.label ?? 'Results'}
            title={`${num(total)} ${total === 1 ? 'company' : 'companies'}`}
            aside={q ? <>matching &ldquo;{q}&rdquo;</> : null}
          />

          {data.length === 0 ? (
            <EmptyState
              title="No companies match"
              detail="Try a different search term, or widen the population to include operators with no ships attributed here yet."
              action={<Link href={buildHref({}, { scope: 'all' })} className="wsd-link">Search everything</Link>}
            />
          ) : (
            <ul>
              {data.map((c: Company) => (
                <li key={c.slug} className="wsd-row">
                  <Link href={href(`companies/${c.slug}`)} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 pl-4">
                    <Logo src={c.logo_url} name={c.name} credit={c.logo_credit} size="md" />

                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[18px] font-bold tracking-[-0.015em] text-wsd-ink">{c.name}</span>
                        {c.capacity_rank ? (
                          <span className="bg-wsd-violet px-1.5 py-0.5 text-[11px] font-bold text-white">#{c.capacity_rank}</span>
                        ) : null}
                        {c.company_type === 'state' ? (
                          <span className="border border-wsd-line px-1.5 py-0.5 text-[11px] font-semibold text-wsd-muted">State fleet</span>
                        ) : null}
                        {c.company_type === 'private_owner' ? (
                          <span className="border border-wsd-line px-1.5 py-0.5 text-[11px] font-semibold text-wsd-muted">Private owner</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13.5px] text-wsd-muted">
                        {[
                          c.industry,
                          c.headquarters || c.country,
                          c.founded_year ? `founded ${c.founded_year}` : null,
                          c.alliance,
                        ].filter(Boolean).join(' · ') || '—'}
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
                          <dd data-figure className="mt-1 text-[17px] font-bold text-wsd-ink">
                            {f.v ?? <span className="font-normal text-wsd-line">—</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            offset={offset}
            pageSize={PAGE_SIZE}
            total={total}
            hrefFor={(o) => buildHref(sp, { offset: String(o) })}
          />

          <FleetNumbersNote className="mt-10 max-w-3xl" />
        </div>
      </div>
    </>
  );
}
