import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { AppConfig } from '@/config/app.config';
import { talentService } from '@/services/talent.service';
import { PUBLIC_PAGE_SIZE } from '@/config/listing';
import { JobResultRow } from '@/modules/talent-acquisition/components/JobResultRow';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  generateJobListStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/structured-data';

type Props = {
  params: Promise<{ place: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

/**
 * Jobs in one town.
 *
 * People search for work by the name of the place they live — "frontend developer in
 * Virar", not "in Mumbai Metropolitan Region" — and a job board that only has a page
 * for the metro never answers that query. This gives every town with a live role its
 * own indexable page, and shows the wider region underneath so the page is useful even
 * when the town itself has one opening.
 *
 * A place with nothing open 404s rather than rendering an empty page: an indexed URL
 * promising jobs that do not exist is worse than no URL at all.
 */
export const dynamic = 'force-dynamic';

async function loadPlace(slug: string, page = 1) {
  const [place, locations] = await Promise.all([
    talentService.getJobLocation(slug),
    talentService.getJobLocations().catch(() => [] as any[]),
  ]);
  if (!place) return null;

  const listed = locations.find((l: any) => l.slug === slug);
  if (!listed || listed.jobCount === 0) return null;

  // A country page filters by country; a town page filters by the town. exactCity keeps
  // the town's own list honest — it is the page's headline claim, and must not be the
  // whole metro dressed up as local.
  const isCountry = place.type === 'country';
  const [inTown, inMetro] = await Promise.all([
    isCountry
      ? talentService.getJobs({ status: 'published', countryId: place.countryId, limit: PUBLIC_PAGE_SIZE, page })
      : talentService.getJobs({ status: 'published', city: place.name, exactCity: true, limit: PUBLIC_PAGE_SIZE, page }),
    isCountry
      ? Promise.resolve({ data: [], total: 0 } as any)
      : talentService.getJobs({ status: 'published', city: place.name, limit: PUBLIC_PAGE_SIZE, page: 1 }),
  ]);

  // Roles elsewhere in the metro, excluding the ones already shown for this town.
  const townIds = new Set((inTown.data ?? []).map((j: any) => j.id));
  const nearby = (inMetro?.data ?? []).filter((j: any) => !townIds.has(j.id));

  return {
    place,
    listed,
    jobs: inTown.data ?? [],
    total: inTown.total ?? 0,
    page: inTown.page ?? page,
    totalPages: inTown.totalPages ?? 1,
    nearby,
    locations,
  };
}

export async function generateStaticParams() {
  try {
    const locations = await talentService.getJobLocations();
    return locations.map((l: any) => ({ place: l.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { place: slug } = await props.params;
  const sp = await props.searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const loaded = await loadPlace(slug, page).catch(() => null);
  if (!loaded) return { title: 'Location not found', robots: { index: false, follow: false } };

  const { place, listed } = loaded;
  const where = place.metroName ? `${place.name}, ${place.metroName}` : place.name;
  const count = listed.jobCount;

  return {
    title: `Jobs in ${where}`,
    description:
      `${count} open ${count === 1 ? 'role' : 'roles'} in ${where}` +
      `${place.state ? `, ${place.state}` : ''}. Apply directly, track every stage from one dashboard, and message the hiring team.`,
    // Each page of the list canonicalises to itself, so the roles it links to are not
    // discarded along with it.
    alternates: {
      canonical:
        page > 1
          ? `${AppConfig.baseUrl}/careers/jobs/${place.slug}?page=${page}`
          : `${AppConfig.baseUrl}/careers/jobs/${place.slug}`,
    },
    openGraph: {
      title: `Jobs in ${where}`,
      description: `${count} open ${count === 1 ? 'role' : 'roles'} in ${where}.`,
      url: `${AppConfig.baseUrl}/careers/jobs/${place.slug}`,
    },
  };
}

export default async function PlaceJobsPage(props: Props) {
  const { place: slug } = await props.params;
  const sp = await props.searchParams;
  const currentPage = Math.max(Number(sp.page) || 1, 1);
  const loaded = await loadPlace(slug, currentPage);
  if (!loaded) notFound();

  const { place, jobs, total, page, totalPages, nearby, locations } = loaded;
  const [countries, departments] = await Promise.all([
    talentService.getCountries({ isActive: true }).catch(() => []),
    talentService.getDepartments({ isActive: true }).catch(() => []),
  ]);

  const where = place.metroName ? `${place.name}, ${place.metroName}` : place.name;

  const itemList = generateJobListStructuredData(
    [...jobs, ...nearby] as any[],
    countries as any[],
    AppConfig.baseUrl,
    `Jobs in ${where}`,
  );
  const breadcrumbs = generateBreadcrumbStructuredData(
    [
      { name: 'Careers', path: '/' },
      { name: 'Open Positions', path: '/careers/open-positions' },
      { name: `Jobs in ${place.name}`, path: `/careers/jobs/${place.slug}` },
    ],
    AppConfig.baseUrl,
  );

  // Only link to sibling towns that actually have something open — a link to an empty
  // town is a dead end for a reader and a thin page for a crawler.
  const withJobs = new Set(locations.map((l: any) => l.slug));
  const siblings = (place.siblings ?? []).filter((s: any) => withJobs.has(s.slug));

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {itemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      <section className="border-b bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/careers/open-positions" className="hover:text-foreground hover:underline">
              Open positions
            </Link>
            {place.metroName && (
              <>
                {' / '}
                <Link href={`/careers/jobs/${place.metroSlug}`} className="hover:text-foreground hover:underline">
                  {place.metroName}
                </Link>
              </>
            )}
            {' / '}
            <span className="text-foreground">{place.name}</span>
          </nav>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Jobs in {place.name}
          </h1>
          {/* A div, not a p: Badge renders a div, and a div inside a p is invalid HTML —
              the browser re-parents it, the server markup and the client tree stop
              matching, and React throws a hydration error on every location page. */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-lg text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden />
            <span>
              {place.metroName ? `${place.metroName} region` : place.name}
              {place.state ? ` · ${place.state}` : ''}
            </span>
            <Badge variant="secondary" className="ml-1">
              {total} open {total === 1 ? 'role' : 'roles'} here
            </Badge>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {jobs.length > 0 ? (
          <ul>
            {jobs.map((job: any) => (
              <JobResultRow
                key={job.id}
                job={job}
                departmentName={(departments as any[]).find((d) => d.id === job.departmentId)?.name}
                countryName={(countries as any[]).find((c) => c.id === job.countryId)?.name}
                countries={countries as any[]}
              />
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nothing open in {place.name} itself at the moment — the roles below are elsewhere in the region.
            </CardContent>
          </Card>
        )}

        {/* Without this, a place like Bengaluru advertised 126 roles and linked to
            twelve, with no route to the rest — for a reader or a crawler. */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Pagination">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={page - 1 === 1 ? `/careers/jobs/${place.slug}` : `/careers/jobs/${place.slug}?page=${page - 1}`}
                  className="border border-black px-4 py-2 font-bold transition-colors hover:bg-black hover:text-white"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/careers/jobs/${place.slug}?page=${page + 1}`}
                  className="border border-black px-4 py-2 font-bold transition-colors hover:bg-black hover:text-white"
                >
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}

        {nearby.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight">
              Also hiring around {place.metroName ?? place.name}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Within commuting distance of {place.name}.
            </p>
            <ul className="mt-6">
              {nearby.map((job: any) => (
                <JobResultRow
                  key={job.id}
                  job={job}
                  departmentName={(departments as any[]).find((d) => d.id === job.departmentId)?.name}
                  countryName={(countries as any[]).find((c) => c.id === job.countryId)?.name}
                  countries={countries as any[]}
                />
              ))}
            </ul>
          </div>
        )}

        {siblings.length > 0 && (
          <nav className="mt-16 border-t pt-8" aria-label="Nearby locations">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Other places hiring nearby
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {siblings.map((s: any) => (
                <li key={s.slug}>
                  <Link
                    href={`/careers/jobs/${s.slug}`}
                    className="inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-foreground/30 hover:bg-muted"
                  >
                    Jobs in {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </main>
  );
}
