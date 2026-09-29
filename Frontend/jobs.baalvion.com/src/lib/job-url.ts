/**
 * Canonical job URLs.
 *
 * `/careers/jobs/<place>/<role-slug>-<id>` — for example
 * `/careers/jobs/virar/frontend-engineer-42`.
 *
 * The old shape was `/careers/countries/india/jobs/42`: a bare numeric id with the role
 * nowhere in the path. Search engines and people both read the URL, and neither could
 * tell what that one was for. The id stays on the end because it is what actually
 * resolves the record — the slug in front of it is for humans, and a retitled role
 * keeps working.
 *
 * One helper so the job card, sitemap, ItemList markup, JobPosting `url` and the
 * middleware redirect can never disagree about where a job lives.
 */

export function slugifyRole(title: string): string {
  return String(title)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

type JobLike = {
  id: string | number;
  title: string;
  placeSlug?: string | null;
  city?: string | null;
  countryId?: string | null;
};

type CountryLike = { id: string; slug: string };

/**
 * The place segment. A job resolved to a known town uses it; anything else — a fully
 * remote role, or a town the gazetteer hasn't got — falls back to its country, which
 * is always a real page.
 */
export function jobPlaceSegment(job: JobLike, countries: CountryLike[] = []): string {
  if (job.placeSlug) return job.placeSlug;
  const country = countries.find((c) => c.id === job.countryId);
  return country?.slug ?? 'worldwide';
}

export function jobPath(job: JobLike, countries: CountryLike[] = []): string {
  const place = jobPlaceSegment(job, countries);
  return `/careers/jobs/${place}/${slugifyRole(job.title)}-${job.id}`;
}

export function jobUrl(job: JobLike, baseUrl: string, countries: CountryLike[] = []): string {
  return `${baseUrl}${jobPath(job, countries)}`;
}

/** Pull the job id back out of a `<role-slug>-<id>` segment. */
export function jobIdFromSlug(segment: string): string | null {
  const match = String(segment).match(/-(\d+)$/);
  return match ? match[1] : null;
}
