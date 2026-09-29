import { Metadata } from 'next';
import Link from 'next/link';
import { talentService } from '@/services/talent.service';
import { AppConfig } from '@/config/app.config';
import { PUBLIC_PAGE_SIZE } from '@/config/listing';
import { JobSearchBar } from '@/modules/talent-acquisition/components/JobSearchBar';
import { JobFilterSidebar, type FilterGroup } from '@/modules/talent-acquisition/components/JobFilterSidebar';
import { JobResultRow } from '@/modules/talent-acquisition/components/JobResultRow';
import { JobSortSelect } from '@/modules/talent-acquisition/components/JobSortSelect';
import { RecentlyViewedJobs } from '@/modules/jobs/components/RecentlyViewedJobs';
import {
  generateJobListStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/structured-data';

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.searchParams;
  const page = Math.max(Number(params.page) || 1, 1);

  // Page 2 onwards must canonicalise to ITSELF. Pointing every page at page 1 told
  // Google to disregard them — and with twelve roles to a page, that discarded the only
  // internal links to some four hundred jobs. A filtered or searched view is a
  // different matter: those are infinite combinations of the same roles, so they
  // canonicalise to the clean listing and are kept out of the index.
  const filtered = Boolean(
    params.q || params.where || params.department || params.country ||
    params.employmentType || params.level || params.remote || params.metro,
  );
  const base = `${AppConfig.baseUrl}/careers/open-positions`;
  const canonical = filtered ? base : page > 1 ? `${base}?page=${page}` : base;

  const suffix = page > 1 ? ` — Page ${page}` : '';

  return {
    title: `Search Open Positions${suffix}`,
    description:
      'Search every open role at Baalvion by keyword and location — engineering, mining, media, operations and more, across India and worldwide.',
    alternates: { canonical },
    // A filtered view is one of countless permutations; it should be followed for the
    // links it exposes but never indexed in its own right.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Search Open Positions${suffix}`,
      description: 'Search every open role at Baalvion by keyword and location.',
      url: canonical,
    },
  };
}

// Results are the page's whole substance, and they change constantly — fetched per
// request and rendered on the server so a crawler sees the roles, not an empty shell.
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function OpenPositionsPage(props: Props) {
  const params = await props.searchParams;
  const page = Math.max(Number(params.page) || 1, 1);

  const [countries, departments, facets, results] = await Promise.all([
    talentService.getCountries({ isActive: true }).catch(() => [] as any[]),
    talentService.getDepartments({}).catch(() => [] as any[]),
    talentService.getJobFacets().catch(() => null),
    talentService
      .getJobs({
        status: 'published',
        page,
        limit: PUBLIC_PAGE_SIZE,
        search: params.q,
        city: params.where,
        metro: params.metro,
        departmentId: params.department,
        countryId: params.country,
        job_type: params.employmentType,
        experience_level: params.level,
        remote_allowed: params.remote,
        sort: params.sort,
      })
      .catch(() => ({ data: [], total: 0, page: 1, limit: PUBLIC_PAGE_SIZE, totalPages: 0 })),
  ]);

  const departmentName = (id: string) =>
    (departments as any[]).find((d) => d.id === id)?.name;
  const countryName = (id: string) =>
    (countries as any[]).find((c) => c.id === id)?.name;

  const groups: FilterGroup[] = facets
    ? [
        { key: 'department', label: 'Team', options: facets.department },
        { key: 'metro', label: 'Location', options: facets.metro },
        { key: 'employmentType', label: 'Employment type', options: facets.employmentType },
        { key: 'level', label: 'Experience level', options: facets.level },
        { key: 'country', label: 'Country', options: facets.country },
        { key: 'remote', label: 'Remote', options: facets.remote },
      ]
    : [];

  const itemList = generateJobListStructuredData(
    results.data as any[],
    countries as any[],
    AppConfig.baseUrl,
    'Open positions at Baalvion',
  );
  const breadcrumbs = generateBreadcrumbStructuredData(
    [
      { name: 'Careers', path: '/' },
      { name: 'Open Positions', path: '/careers/open-positions' },
    ],
    AppConfig.baseUrl,
  );

  // Keep every filter except `page` when paging.
  const pageHref = (n: number) => ({
    pathname: '/careers/open-positions',
    query: { ...params, page: n },
  });

  const isFiltered = Boolean(
    params.q || params.where || params.department || params.country ||
    params.employmentType || params.level || params.remote || params.metro,
  );

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {itemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      {/* Search first, small. The reference gives its page no marketing headline at
          all — the H1 is the result count, below. */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <JobSearchBar defaultKeyword={params.q ?? ''} defaultLocation={params.where ?? ''} />
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <JobFilterSidebar groups={groups} />

          <section aria-label="Search results">
            {/*
              The count IS the H1 on the reference page, carrying a thick orange-red rule:
                .section3__search-results-heading { font-size:1.5rem; letter-spacing:-.5px;
                  padding-bottom:19px; margin-bottom:64px; border-bottom:12px solid #ff4713 }
              It reads as the page's subject rather than as a small status line.
            */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b-[12px] border-brand-orange pb-[19px]">
              <h1 className="text-2xl font-bold leading-[1.33] tracking-[-0.5px]">
                <span className="tabular-nums">{results.total}</span>{' '}
                {results.total === 1 ? 'job' : 'jobs'} found
                {isFiltered && <span className="font-normal text-muted-foreground"> · filtered</span>}
              </h1>
              <JobSortSelect value={params.sort ?? 'date'} />
            </div>

            {results.data.length > 0 ? (
              <ul className="mt-16 flex flex-col gap-[15px]">
                {(results.data as any[]).map((job) => (
                  <JobResultRow
                    key={job.id}
                    job={job}
                    departmentName={departmentName(job.departmentId)}
                    countryName={countryName(job.countryId)}
                    countries={countries as any[]}
                  />
                ))}
              </ul>
            ) : (
              <div className="mt-16 border border-black py-16 text-center">
                <h3 className="text-lg font-semibold">No roles match that search</h3>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  Try a broader location — searching a town also covers the region around it —
                  or{' '}
                  <Link href="/careers/open-positions" className="underline underline-offset-4">
                    clear the filters
                  </Link>{' '}
                  to see everything open.
                </p>
              </div>
            )}

            {results.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Pagination">
                <span className="text-muted-foreground">
                  Page {results.page} of {results.totalPages}
                </span>
                <div className="flex gap-2">
                  {results.page > 1 && (
                    <Link href={pageHref(results.page - 1)} className="border border-black px-4 py-2 font-bold transition-colors hover:bg-black hover:text-white">
                      Previous
                    </Link>
                  )}
                  {results.page < results.totalPages && (
                    <Link href={pageHref(results.page + 1)} className="border border-black px-4 py-2 font-bold transition-colors hover:bg-black hover:text-white">
                      Next
                    </Link>
                  )}
                </div>
              </nav>
            )}

            <div className="mt-12">
              <RecentlyViewedJobs />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
