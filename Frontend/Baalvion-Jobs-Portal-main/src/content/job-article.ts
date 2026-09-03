import { departmentContext } from './department-context';
import { locationContext } from './location-context';

/**
 * Composes a job posting page.
 *
 * The shape follows how a real posting reads: a paragraph about the team and what it is
 * responsible for, then primary responsibilities, then skills required, then preferred.
 * The length comes from the depth of those lists — from the actual work — not from
 * bolted-on sections.
 *
 * An earlier version of this file generated "Your first three months", "How hiring
 * works" and a FAQ block onto every posting. That was the wrong instinct: templated
 * sections repeated across four hundred pages read as generated, because they were.
 * They are gone. What remains is the role's own content, plus two pieces of written
 * editorial context — the team and the place — that genuinely differ between postings.
 *
 * Nothing here invents a fact about a role. If a posting has thin content, this produces
 * a short page rather than padding it out.
 */

export type ArticleSection = {
  id: string;
  heading: string;
  body?: string[];
  bullets?: string[];
};

export type JobArticle = {
  sections: ArticleSection[];
  wordCount: number;
};

type Job = {
  id: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  placeSlug?: string | null;
  metroSlug?: string | null;
  departmentId?: string;
  remoteAllowed?: boolean;
  responsibilities?: string[];
  qualifications?: string[];
  preferredQualifications?: string[];
  requiredSkills?: string[];
};

export function buildJobArticle(
  job: Job,
  opts: { countryName?: string; departmentName?: string } = {},
): JobArticle {
  const dept = departmentContext(job.departmentId);
  const place = locationContext(job.placeSlug ?? job.metroSlug ?? null);

  const sections: ArticleSection[] = [];

  // ── About this role ─────────────────────────────────────────────────────────
  // The team's remit first, then the specific job — which is the order a posting
  // reads in, and the order that makes the opening paragraph worth quoting.
  const opening: string[] = [];
  if (dept?.whatWeDo) opening.push(dept.whatWeDo);
  if (job.description) opening.push(job.description);
  if (dept?.context) opening.push(dept.context);

  if (opening.length > 0) {
    sections.push({ id: 'overview', heading: 'About this role', body: opening });
  }

  if (job.responsibilities && job.responsibilities.length > 0) {
    sections.push({
      id: 'responsibilities',
      heading: 'Primary responsibilities',
      bullets: job.responsibilities,
    });
  }

  if (job.qualifications && job.qualifications.length > 0) {
    sections.push({
      id: 'qualifications',
      heading: 'Skills required',
      // The skills line goes at the top of this list rather than in a section of its
      // own — on its own it was a sentence naming four tags, which told a candidate
      // nothing the list below does not say better.
      body: job.requiredSkills?.length
        ? [`Day to day this role works with ${listOut(job.requiredSkills)}.`]
        : undefined,
      bullets: job.qualifications,
    });
  }

  if (job.preferredQualifications && job.preferredQualifications.length > 0) {
    sections.push({
      id: 'preferred',
      heading: 'Preferred',
      body: ['None of these are required. They are the things that would help, and a strong application is regularly missing all of them.'],
      bullets: job.preferredQualifications,
    });
  }

  if (dept?.howYouWork) {
    sections.push({
      id: 'how-we-work',
      heading: opts.departmentName ? `Working in ${opts.departmentName}` : 'How the team works',
      body: [dept.howYouWork, ...(dept.growth ? [dept.growth] : [])],
    });
  }

  if (place) {
    sections.push({
      id: 'location',
      heading: job.city && job.city !== 'Remote' ? `About ${job.city}` : 'Where this role sits',
      body: [place.presence, place.living, ...(place.note ? [place.note] : [])],
    });
  }

  const wordCount = sections.reduce(
    (n, s) =>
      n +
      (s.body ?? []).join(' ').split(/\s+/).filter(Boolean).length +
      (s.bullets ?? []).join(' ').split(/\s+/).filter(Boolean).length,
    0,
  );

  return { sections, wordCount };
}

/** "React, TypeScript and Next.js" — an Oxford-comma-free list that reads as a sentence. */
function listOut(items: string[]): string {
  const list = items.slice(0, 8);
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}
