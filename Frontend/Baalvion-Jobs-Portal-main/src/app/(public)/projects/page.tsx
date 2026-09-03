import { Metadata } from 'next';
import Link from 'next/link';
import { AppConfig } from '@/config/app.config';
import { marketplaceService } from '@/services/marketplace.service';
import { MarketplaceProjectCard } from '@/modules/projects/components/MarketplaceProjectCard';
import { MarketplaceFilters } from '@/modules/projects/components/MarketplaceFilters';
import { generateBreadcrumbStructuredData } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Project Marketplace',
  description:
    'Paid project work you can take on alone or with a team you bring. Browse open briefs, see the budget up front, and pitch directly.',
  alternates: { canonical: `${AppConfig.baseUrl}/projects` },
  openGraph: {
    title: 'Project Marketplace',
    description: 'Paid project work you can take on alone or with a team you bring.',
    url: `${AppConfig.baseUrl}/projects`,
  },
};

// Briefs open and close continuously, and the list is the page's whole substance —
// it is fetched per request and rendered on the server so a crawler sees the work.
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ category?: string; skill?: string; mode?: string; q?: string; page?: string }>;
};

export default async function ProjectsPage(props: Props) {
  const params = await props.searchParams;
  const page = Number(params.page) || 1;

  const [result, facets] = await Promise.all([
    marketplaceService.listProjects({
      page,
      limit: 12,
      category: params.category,
      skill: params.skill,
      mode: params.mode,
      search: params.q,
    }),
    marketplaceService.getFacets(),
  ]);

  const breadcrumbs = generateBreadcrumbStructuredData(
    [
      { name: 'Home', path: '/' },
      { name: 'Project Marketplace', path: '/projects' },
    ],
    AppConfig.baseUrl,
  );

  // ItemList of the briefs actually on this page, pointing at their own URLs.
  const itemList = result.items.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Open projects at Baalvion',
        numberOfItems: result.items.length,
        itemListElement: result.items.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.title,
          url: `${AppConfig.baseUrl}/projects/${p.slug ?? p.id}`,
        })),
      }
    : null;

  const isFiltered = Boolean(params.category || params.skill || params.mode || params.q);

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {itemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      <section className="border-b bg-muted/30 py-16 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Project marketplace</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Scoped, paid briefs with the budget stated up front. Take one on your own, or
            bring a team — each brief says which it wants.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-12">
        <MarketplaceFilters
          categories={facets.categories}
          skills={facets.skills}
          current={{
            category: params.category ?? 'All',
            skill: params.skill ?? 'All',
            mode: params.mode ?? 'All',
            q: params.q ?? '',
          }}
        />

        <p className="mb-6 mt-8 text-sm text-muted-foreground">
          {result.total} open {result.total === 1 ? 'brief' : 'briefs'}
          {isFiltered ? ' matching your filters' : ''}
        </p>

        {result.items.length > 0 ? (
          <div className="space-y-4">
            {result.items.map((project) => (
              <MarketplaceProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="border p-12 text-center">
            <h2 className="text-lg font-semibold">
              {isFiltered ? 'Nothing matches those filters' : 'No briefs are open right now'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isFiltered ? (
                <>
                  Try widening them, or{' '}
                  <Link href="/projects" className="underline underline-offset-4">see everything open</Link>.
                </>
              ) : (
                <>
                  New work is posted regularly —{' '}
                  <Link href="/careers/open-positions" className="underline underline-offset-4">
                    the open roles
                  </Link>{' '}
                  are worth a look meanwhile.
                </>
              )}
            </p>
          </div>
        )}

        {result.totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-between border-t pt-6 text-sm" aria-label="Pagination">
            <span className="text-muted-foreground">Page {result.page} of {result.totalPages}</span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link
                  href={{ pathname: '/projects', query: { ...params, page: result.page - 1 } }}
                  className="border px-3 py-1.5 transition-colors hover:bg-muted"
                >
                  Previous
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={{ pathname: '/projects', query: { ...params, page: result.page + 1 } }}
                  className="border px-3 py-1.5 transition-colors hover:bg-muted"
                >
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
