import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { talentService } from '@/services/talent.service';
import { AppConfig } from '@/config/app.config';
import { JobHeader } from '@/modules/talent-acquisition/components/job-detail/JobHeader';
import { JobMetaSidebar } from '@/modules/talent-acquisition/components/job-detail/JobMetaSidebar';
import { JobSection } from '@/modules/talent-acquisition/components/job-detail/JobSection';
import { JobCompensationSection } from '@/modules/talent-acquisition/components/job-detail/JobCompensationSection';
import { JobComplianceSection } from '@/modules/talent-acquisition/components/job-detail/JobComplianceSection';
import { Separator } from '@/components/ui/separator';
import { TrackViewedJob } from '@/modules/jobs/components/TrackViewedJob';
import { generateJobPostingStructuredData } from '@/lib/structured-data';
import { jobPath } from '@/lib/job-url';

type Props = {
  params: Promise<{ slug: string; jobId: string }>;
};

export async function generateStaticParams() {
  try {
    const jobsResponse = await talentService.getJobs({
      status: 'published',
      limit: 1000,
    });
    const jobs = jobsResponse.data;
    const countries = await talentService.getCountries({ isActive: true });

    return jobs
      .map((job) => {
        const country = countries.find((c) => c.id === job.countryId);
        return {
          slug: country?.slug || '',
          jobId: job.id,
        };
      })
      .filter((p) => p.slug);
  } catch (error) {
    console.error('Failed to generate static params for jobs:', error);
    return [];
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug, jobId } = params;
  const job = await talentService.getJobById(jobId);
  const country = await talentService.getCountryBySlug(slug);

  if (!job || !country || job.countryId !== country.id) {
    return { title: 'Job Not Found' };
  }

  // This route is superseded by /careers/jobs/<place>/<role-slug>-<id>, which middleware
  // 308s to. It stays as a fallback for when the backend is unreachable and middleware
  // can't resolve the redirect — but it points its canonical at the new URL, so the two
  // never compete for the same role.
  const canonicalUrl = `${AppConfig.baseUrl}${jobPath(job as any, [country as any])}`;

  // The root layout appends "| TalentOS by Baalvion", so "| Baalvion Careers" here made
  // every job title run past the ~60 characters a SERP shows — cutting off the very words
  // (the role and the place) someone searched for. City first, since that's what people
  // type: "product designer bengaluru".
  const place = job.city && job.city !== 'Remote' ? job.city : country.name;
  const title = `${job.title} — ${place}`;

  // Cut on a word boundary rather than mid-word, and only add the ellipsis when text was
  // actually dropped.
  const description = (() => {
    const text = (job.description ?? '').replace(/\s+/g, ' ').trim();
    if (text.length <= 155) return text;
    return `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`;
  })();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: job.createdAt,
    },
  };
}

export default async function JobDetailPage(props: Props) {
  const params = await props.params;
  const { slug, jobId } = params;
  const job = await talentService.getJobById(jobId);
  const country = await talentService.getCountryBySlug(slug);

  // Validation
  if (
    !job ||
    !country ||
    job.countryId !== country.id ||
    job.status !== 'published' ||
    (job.publishEndDate && new Date(job.publishEndDate) < new Date())
  ) {
    notFound();
  }

  const department = (await talentService.getDepartments({})).find(
    (d) => d.id === job.departmentId,
  );
  const complianceProfile = await talentService.getComplianceProfile(
    country.complianceProfileId,
  );
  const applyUrl = `/careers/application/${country.slug}?jobId=${job.id}`;

  // Generate JobPosting structured data using our utility, passing the real
  // resolved country so we don't fall back to the hard-coded country map.
  const structuredData = generateJobPostingStructuredData(job, AppConfig.baseUrl, {
    country: {
      isoCode: country.isoCode,
      slug: country.slug,
      name: country.name,
    },
  });

  // Breadcrumb structured data (Home › Careers › Country › Job)
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: AppConfig.baseUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Careers',
        item: `${AppConfig.baseUrl}/careers/open-positions`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Jobs in ${country.name}`,
        item: `${AppConfig.baseUrl}/careers/countries/${country.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: job.title,
      },
    ],
  };

  return (
    <>
      <TrackViewedJob jobId={job.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <main className="bg-background">
        <JobHeader
          job={job}
          country={country}
          departmentName={department?.name}
          applyUrl={applyUrl}
          placeSlug={(job as any).placeSlug ?? null}
        />

        <div className="container mx-auto py-16 lg:py-24 max-w-6xl">
          <div className="grid lg:grid-cols-4 gap-12 items-start">
            <div className="lg:col-span-3 space-y-12">
              <JobSection title="About this role">
                <div className="space-y-4 whitespace-pre-line text-muted-foreground">
                  {job.description}
                </div>
              </JobSection>

              {/* A heading with an empty list under it reads as a broken page. Sections
                  render only when the posting actually has that content. */}
              {job.responsibilities.length > 0 && (
                <JobSection title="Key responsibilities">
                  <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    {job.responsibilities.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </JobSection>
              )}

              {job.qualifications.length > 0 && (
                <JobSection title="Qualifications">
                  <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    {job.qualifications.map((item, i) => (
                      <li key={i} className="whitespace-pre-line">{item}</li>
                    ))}
                  </ul>
                </JobSection>
              )}

              <Separator />

              <JobCompensationSection job={job} />

              {complianceProfile && (
                <JobComplianceSection compliance={complianceProfile} />
              )}
            </div>
            <aside className="lg:col-span-1 lg:sticky top-24">
              <JobMetaSidebar
                job={job}
                departmentName={department?.name}
                countryName={country.name}
                applyUrl={applyUrl}
              />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
