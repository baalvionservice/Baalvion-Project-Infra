import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { talentService } from '@/services/talent.service';
import { AppConfig } from '@/config/app.config';
import { JobHeader } from '@/modules/talent-acquisition/components/job-detail/JobHeader';
import { JobMetaSidebar } from '@/modules/talent-acquisition/components/job-detail/JobMetaSidebar';
import { JobSection } from '@/modules/talent-acquisition/components/job-detail/JobSection';
import { JobComplianceSection } from '@/modules/talent-acquisition/components/job-detail/JobComplianceSection';
import { JobJumpNav, type JumpSection } from '@/modules/talent-acquisition/components/job-detail/JobJumpNav';
import { JobBenefitsBlock } from '@/modules/talent-acquisition/components/job-detail/JobBenefitsBlock';
import { ApplyCTA } from '@/modules/talent-acquisition/components/job-detail/ApplyCTA';
import { Separator } from '@/components/ui/separator';
import { TrackViewedJob } from '@/modules/jobs/components/TrackViewedJob';
import {
  generateJobPostingStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/structured-data';
import { jobPath, jobIdFromSlug } from '@/lib/job-url';
import { buildJobArticle } from '@/content/job-article';

type Props = { params: Promise<{ place: string; role: string }> };

const JUMP_LABELS: Record<string, string> = {
  overview: 'Overview',
  responsibilities: 'Responsibilities',
  qualifications: 'Skills required',
  preferred: 'Preferred',
  'how-we-work': 'The team',
  location: 'Location',
};

/**
 * The canonical job page: /careers/jobs/<place>/<role-slug>-<id>.
 *
 * Both the place and the role are in the path, because that is what a person and a
 * crawler read before deciding to click — the old `/careers/countries/india/jobs/42`
 * said nothing about either. The trailing id is what actually resolves the record, so
 * retitling a role or moving it to another town never breaks a live link; the page just
 * redirects to the corrected path.
 */
export const dynamic = 'force-dynamic';

async function loadJob(roleSegment: string) {
  const id = jobIdFromSlug(roleSegment);
  if (!id) return null;

  const [job, countries] = await Promise.all([
    talentService.getJobById(id).catch(() => null),
    talentService.getCountries({ isActive: true }).catch(() => [] as any[]),
  ]);
  if (!job) return null;

  const list = countries as any[];
  return { job, country: list.find((c) => c.id === job.countryId), countries: list };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { role } = await props.params;
  const loaded = await loadJob(role);
  if (!loaded?.job || loaded.job.status !== 'published') {
    return { title: 'Job not found', robots: { index: false, follow: false } };
  }

  const { job, country, countries } = loaded;
  const canonicalUrl = `${AppConfig.baseUrl}${jobPath(job as any, countries)}`;

  // City first: that is what people type — "product designer bengaluru".
  const place = job.city && job.city !== 'Remote' ? job.city : country?.name ?? 'Remote';
  const title = `${job.title} — ${place}`;

  const description = (() => {
    const text = (job.description ?? '').replace(/\s+/g, ' ').trim();
    if (text.length <= 155) return text;
    return `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`;
  })();

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: job.publishStartDate ?? job.createdAt,
    },
  };
}

export default async function JobDetailPage(props: Props) {
  const { place, role } = await props.params;
  const loaded = await loadJob(role);

  if (
    !loaded?.job ||
    !loaded.country ||
    loaded.job.status !== 'published' ||
    (loaded.job.publishEndDate && new Date(loaded.job.publishEndDate) < new Date())
  ) {
    notFound();
  }

  const { country, countries } = loaded;

  // Pay is not shown on the public site. The mapper still carries it because the
  // recruiter console legitimately needs it, so drop it here — otherwise the band is
  // absent from the page but still sitting in the serialised RSC payload underneath it.
  const { salaryBand, salaryPeriod, salaryVisibility, currency, ...job } = loaded.job as any;

  // The id is authoritative; a stale slug or place is corrected by middleware with a
  // real 308 before this ever renders (`redirect()` here would only emit a meta
  // refresh). The canonical path is still computed, for the canonical tag and links.
  const canonicalPath = jobPath(job as any, countries);

  const [departments, complianceProfile] = await Promise.all([
    talentService.getDepartments({}).catch(() => [] as any[]),
    country.complianceProfileId
      ? talentService.getComplianceProfile(country.complianceProfileId).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);
  const department = (departments as any[]).find((d) => d.id === job.departmentId);

  const applyUrl = `/careers/application/${country.slug}?jobId=${job.id}`;
  const canonicalUrl = `${AppConfig.baseUrl}${canonicalPath}`;

  const structuredData = generateJobPostingStructuredData(job, AppConfig.baseUrl, {
    country: { isoCode: country.isoCode, slug: country.slug, name: country.name },
    url: canonicalUrl,
  });

  const breadcrumbData = generateBreadcrumbStructuredData(
    [
      { name: 'Careers', path: '/' },
      { name: 'Open positions', path: '/careers/open-positions' },
      { name: `Jobs in ${job.placeSlug ? job.city : country.name}`, path: `/careers/jobs/${place}` },
      { name: job.title, path: canonicalPath },
    ],
    AppConfig.baseUrl,
  );

  // The posting's own content, composed into a readable page.
  const article = buildJobArticle(job as any, {
    countryName: country.name,
    departmentName: department?.name,
  });

  // The jump nav only lists sections this posting actually has, so it never points at
  // an anchor that is not on the page.
  const sections: JumpSection[] = [
    ...article.sections.map((s) => ({ id: s.id, label: JUMP_LABELS[s.id] ?? s.heading })),
    { id: 'benefits', label: 'Benefits' },
  ];

  return (
    <>
      <TrackViewedJob jobId={job.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      <main className="bg-background">
        <JobHeader
          job={job}
          country={country}
          departmentName={department?.name}
          applyUrl={applyUrl}
          placeSlug={(job as any).placeSlug ?? null}
        />

        <JobJumpNav sections={sections} />

        <div className="container mx-auto max-w-[1100px] px-5 py-14 lg:py-16">
          <div className="space-y-14">
            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="text-2xl font-bold tracking-tight md:text-[2rem]">{section.heading}</h2>

                {section.body?.map((paragraph, i) => (
                  <p key={i} className="mt-4 max-w-3xl whitespace-pre-line text-[17px] leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 max-w-3xl list-disc space-y-2.5 pl-5 text-[17px] leading-relaxed text-muted-foreground">
                    {section.bullets.map((item, i) => (
                      <li key={i} className="whitespace-pre-line">{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {complianceProfile && (
              <>
                <Separator />
                <JobComplianceSection compliance={complianceProfile} />
              </>
            )}
          </div>
        </div>

        {/* The one heavy block on the page — it stops a long posting trailing into the
            footer, and it is where the reference puts its benefits too. */}
        <JobBenefitsBlock id="benefits" />

        {/* Apply repeated at the end: someone who has read this far should not have to
            scroll back up. */}
        <section className="border-b bg-muted/40">
          <div className="container mx-auto max-w-[1100px] px-5 py-14 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Interested in this role?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Applying takes one form. You will get a Candidate ID immediately and can follow
              every stage from your dashboard.
            </p>
            <div className="mt-7 flex justify-center">
              <ApplyCTA applyUrl={applyUrl} />
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              <Link href={`/careers/jobs/${place}`} className="underline underline-offset-4">
                See everything open in {job.placeSlug ? job.city : country.name}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
