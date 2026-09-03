import { permanentRedirect, notFound } from 'next/navigation';
import { talentService } from '@/services/talent.service';
import { jobPath } from '@/lib/job-url';

/**
 * Legacy job URL → the canonical /careers/jobs/<place>/<role-slug>-<id>.
 *
 * `force-dynamic` matters here: on a prerendered route Next cannot send a redirect
 * status, so it falls back to a 200 page carrying a 1-second `<meta http-equiv=refresh>`.
 * Search engines treat that as a thin duplicate rather than a consolidation, leaving two
 * URLs competing for the same job. Rendering per request makes this a real HTTP 308.
 */
export const dynamic = 'force-dynamic';

export default async function LegacyJobRedirectPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const job = await talentService.getJobById(params.id);
    if (!job) notFound();

    const country = await talentService.getCountryById(job.countryId);
    if (!country) permanentRedirect('/careers/open-positions');

    permanentRedirect(jobPath(job as any, [country as any]));
}
