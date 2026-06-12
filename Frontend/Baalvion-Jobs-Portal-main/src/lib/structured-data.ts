import { Job } from '@/lib/talent-acquisition';

/**
 * Optional country context. When the caller already has the resolved Country
 * object (e.g. the job detail page), pass it through so we use the real ISO
 * code / slug / name instead of the hard-coded fallback maps below.
 */
export interface JobPostingCountryContext {
  isoCode?: string;
  slug?: string;
  name?: string;
}

export interface JobPostingOptions {
  country?: JobPostingCountryContext;
}

/**
 * Generate JSON-LD structured data for a job posting.
 *
 * Follows the schema.org JobPosting spec and Google's "Job posting" structured
 * data requirements so the listing is eligible for the Google for Jobs
 * experience. Key compliance points handled here:
 *  - `jobLocationType` is the literal string "TELECOMMUTE" for remote work
 *    (NOT a schema.org URL array — Google rejects that).
 *  - Fully remote roles omit `jobLocation` and declare
 *    `applicantLocationRequirements`; hybrid roles declare BOTH; onsite roles
 *    declare only `jobLocation`.
 *  - `validThrough` is only emitted when a real end date exists.
 */
export function generateJobPostingStructuredData(
  job: Job,
  baseUrl: string = 'https://www.jobs.baalvion.com',
  options: JobPostingOptions = {},
) {
  // Map employment types to schema.org values. Accepts both the canonical
  // enum ("Full-time") and the live backend-mapped variant ("Full-Time" /
  // "Contractor") produced by mapBackendJob.
  const employmentTypeMap: Record<string, string> = {
    'Full-time': 'FULL_TIME',
    'Full-Time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    'Part-Time': 'PART_TIME',
    Contract: 'CONTRACTOR',
    Contractor: 'CONTRACTOR',
    Internship: 'INTERN',
    Temporary: 'TEMPORARY',
  };

  // Map experience bands to approximate months of experience. Accepts both the
  // canonical bands (Entry/Mid/Senior/Lead/Principal) and the live range bands
  // ("0-2 Years" …) produced by mapBackendJob.
  const experienceMonthsMap: Record<string, number> = {
    Intern: 0,
    Entry: 0,
    Mid: 36, // 3 years
    Senior: 60, // 5 years
    Lead: 96, // 8 years
    Principal: 144, // 12 years
    '0-2 Years': 0,
    '2-5 Years': 24,
    '5-10 Years': 60,
    '10+ Years': 120,
  };

  const country = resolveCountry(job.countryId, options.country);

  // Work arrangement. The canonical seed data uses workforceType
  // (Onsite/Hybrid/Remote); live backend data hardcodes workforceType to
  // "Employee" and instead carries a `remoteAllowed` flag — so fall back to it.
  const isRemote = job.workforceType === 'Remote';
  const isHybrid =
    job.workforceType === 'Hybrid' ||
    (job.workforceType !== 'Onsite' && !isRemote && job.remoteAllowed === true);
  const allowsTelecommute = isRemote || isHybrid;

  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    identifier: {
      '@type': 'PropertyValue',
      name: 'Baalvion Job ID',
      value: job.id,
    },
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    employmentType: employmentTypeMap[job.employmentType] || job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Baalvion',
      sameAs: 'https://www.baalvion.com',
      logo: `${baseUrl}/logo.png`,
    },
    url: `${baseUrl}/careers/countries/${country.slug}/jobs/${job.id}`,
    directApply: false,
    applicationContact: {
      '@type': 'ContactPoint',
      contactType: 'HR',
      email: 'careers@baalvion.com',
    },
  };

  // validThrough — only when a real end date is present (Google penalises
  // stale/invalid dates). The page itself 404s once this date passes.
  if (job.publishEndDate) {
    structuredData['validThrough'] = job.publishEndDate;
  }

  // Location. Onsite + hybrid carry a physical jobLocation; fully remote roles
  // omit it (Google warns when a 100%-remote job declares a fixed location).
  if (!isRemote) {
    structuredData['jobLocation'] = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city,
        addressRegion: job.state || undefined,
        addressCountry: country.isoCode,
      },
    };
  }

  // Remote / hybrid → TELECOMMUTE + where applicants may be located.
  if (allowsTelecommute) {
    structuredData['jobLocationType'] = 'TELECOMMUTE';
    structuredData['applicantLocationRequirements'] = {
      '@type': 'Country',
      name: country.name,
    };
  }

  // Salary — expose whenever it is meant to be shown publicly. Accepts the
  // canonical values ("Public" / "RangeOnly") and the live backend-mapped
  // value ("range"); never exposes "Hidden" / "hidden".
  const salaryVisibility = String(job.salaryVisibility || '').toLowerCase();
  const salaryIsPublic =
    salaryVisibility === 'public' ||
    salaryVisibility === 'rangeonly' ||
    salaryVisibility === 'range';
  if (salaryIsPublic && job.salaryBand) {
    const [minSalary, maxSalary] = parseSalaryBand(job.salaryBand);
    if (minSalary && maxSalary) {
      structuredData['baseSalary'] = {
        '@type': 'MonetaryAmount',
        currency: job.currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: minSalary,
          maxValue: maxSalary,
          unitText: 'YEAR',
        },
      };
    }
  }

  // Experience level
  if (job.experienceBand && job.experienceBand in experienceMonthsMap) {
    structuredData['experienceRequirements'] = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: experienceMonthsMap[job.experienceBand],
    };
  }

  // Responsibilities / qualifications (valid JobPosting properties)
  if (job.responsibilities && job.responsibilities.length > 0) {
    structuredData['responsibilities'] = job.responsibilities.join('; ');
  }
  if (job.qualifications && job.qualifications.length > 0) {
    structuredData['qualifications'] = job.qualifications.join('; ');
  }

  // Benefits
  const benefits = [];
  if (job.equityEligible) benefits.push('Equity compensation');
  if (job.relocationSupport) benefits.push('Relocation assistance');
  if (job.visaSponsorship) benefits.push('Visa sponsorship');
  if (benefits.length > 0) {
    structuredData['jobBenefits'] = benefits.join(', ');
  }

  return structuredData;
}

/**
 * Resolve the ISO code / slug / display name for a country.
 * Prefers the caller-supplied context; falls back to a static map for the
 * launch markets so callers that don't have the Country object still work.
 */
function resolveCountry(
  countryId: string,
  context?: JobPostingCountryContext,
): { isoCode: string; slug: string; name: string } {
  const fallback: Record<
    string,
    { isoCode: string; slug: string; name: string }
  > = {
    country_us: { isoCode: 'US', slug: 'united-states', name: 'United States' },
    country_in: { isoCode: 'IN', slug: 'india', name: 'India' },
    country_gb: { isoCode: 'GB', slug: 'united-kingdom', name: 'United Kingdom' },
    country_ca: { isoCode: 'CA', slug: 'canada', name: 'Canada' },
    country_au: { isoCode: 'AU', slug: 'australia', name: 'Australia' },
    country_pl: { isoCode: 'PL', slug: 'poland', name: 'Poland' },
  };

  const base = fallback[countryId] || {
    isoCode: 'US',
    slug: 'united-states',
    name: 'United States',
  };

  return {
    isoCode: context?.isoCode || base.isoCode,
    slug: context?.slug || base.slug,
    name: context?.name || base.name,
  };
}

/**
 * Helper function to parse salary band string
 */
function parseSalaryBand(salaryBand: string): [number | null, number | null] {
  // Handle various formats: "120000-150000", "120k-150k", "15-25 LPA"
  const cleanBand = salaryBand.replace(/[k,\s]/gi, '').replace('LPA', '00000');
  const match = cleanBand.match(/(\d+)-(\d+)/);

  if (match) {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);

    // Handle 'k' notation
    const multiplier = salaryBand.toLowerCase().includes('k') ? 1000 : 1;

    return [min * multiplier, max * multiplier];
  }

  return [null, null];
}

/**
 * Generate structured data script tag for embedding in HTML
 */
export function generateStructuredDataScript(
  job: Job,
  baseUrl?: string,
  options?: JobPostingOptions,
): string {
  const structuredData = generateJobPostingStructuredData(job, baseUrl, options);

  return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>`;
}
