import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { talentService } from '@/services/talent.service';
import { JobCard } from '@/modules/talent-acquisition/components/JobCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppConfig } from '@/config/app.config';
import { ErrorState } from '@/components/system/ErrorState';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    // Prerender the editorial hubs. Roles can be posted in any of the ~250 countries and
    // those pages still render on demand — they just aren't worth building ahead of time.
    const countries = await talentService.getCountries({ isActive: true, hub: true });
    return countries.map((country) => ({
      slug: country.slug,
    }));
  } catch (error) {
    console.error('Failed to generate static params for countries:', error);
    return [];
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const country = await talentService.getCountryBySlug(params.slug);

  if (!country) {
    return {
      title: 'Country Not Found',
    };
  }

  const canonicalUrl = `${AppConfig.baseUrl}/careers/countries/${country.slug}`;

  const title = `Careers in ${country.name}`;
  const description = `Explore job opportunities and learn about Baalvion's presence in ${country.name}. Join our globally distributed team.`;

  // Roles can be posted in any of the ~250 active countries, so a page exists for every
  // one of them — but only a handful have any roles at a given moment. Without this
  // check every empty country was served as index,follow: 236 near-identical pages
  // carrying nothing but the nav and the footer, Antarctica and Bouvet Island included.
  // That is textbook thin content, and it drags down the pages that do have something.
  // The same rule already governs the location pages.
  const openRoles = await talentService
    .getJobs({ countryId: country.id, status: 'published', limit: 1 })
    .then((r: any) => r.total ?? (r.data?.length ?? 0))
    .catch(() => 0);

  return {
    title,
    description,
    robots: openRoles > 0 ? undefined : { index: false, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | TalentOS by Baalvion`,
      description,
      url: canonicalUrl,
    },
  };
}

export default async function CountryPage(props: Props) {
  const params = await props.params;
  let country, jobsInCountry, complianceProfile;

  try {
    country = await talentService.getCountryBySlug(params.slug);

    if (!country || !country.isActive) {
      notFound();
    }

    const [allJobs, allDepartments, allCountries] = await Promise.all([
      talentService.getJobs({ countryId: country.id, status: 'published' }),
      talentService.getDepartments({ countryId: country.id, isActive: true }),
      talentService.getCountries({ isActive: true }),
    ]);

    jobsInCountry = allJobs;
    // Only the hub countries carry a compliance profile; asking for a null id 404s.
    complianceProfile = country.complianceProfileId
      ? await talentService.getComplianceProfile(country.complianceProfileId)
      : undefined;

    return (
      <main className="bg-background text-foreground">
        <section className="py-24 sm:py-32 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Careers in {country.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              {country.type === 'headquarters'
                ? `Explore roles at our headquarters and primary talent hub in ${country.name}, the core of our global operations.`
                : `Discover strategic, remote-first opportunities as part of our selective hiring in ${country.name}.`}
            </p>
          </div>
        </section>

        <div className="container mx-auto py-16 lg:py-24 space-y-16">
          {/* Only hub countries have written overview copy. Elsewhere the open roles
              speak for themselves — an empty "Hiring in X" panel says nothing. */}
          {country.overview && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Hiring in {country.name}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                  {country.overview}
                </div>
              </CardContent>
            </Card>
          )}

          <section id="open-positions">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
              Open Roles in {country.name}
            </h2>
            {jobsInCountry.data.length > 0 ? (
              <div className="space-y-6">
                {jobsInCountry.data.map((job: any) => (
                  <JobCard
                    job={job}
                    departments={allDepartments}
                    countries={allCountries}
                    key={job.id}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-xl font-semibold">
                    No Open Positions in {country.name} Currently
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Please check our global listings for remote opportunities.
                  </p>
                  <Button variant="default" className="mt-4" asChild>
                    <Link href="/careers/open-positions">
                      View All Global Roles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {complianceProfile && (
            <section className="text-xs text-muted-foreground text-center border-t pt-8">
              <h3 className="font-semibold text-sm mb-2">
                {complianceProfile.equalOpportunityStatement}
              </h3>
              <p>{complianceProfile.hiringDisclosureText}</p>
              <p>Reference: {complianceProfile.laborLawReference}</p>
            </section>
          )}
        </div>
      </main>
    );
  } catch (error: any) {
    return (
      <main className="container mx-auto py-16 lg:py-24">
        <ErrorState
          message={error.message || 'Failed to load country page data.'}
        />
      </main>
    );
  }
}
