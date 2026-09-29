import { fetchPublicApi } from '@/lib/api/public-fetch';
import { getMergedLegalCases } from '@/lib/legal-server';
import type { Person, PersonCategorySlug } from '@/types/person';
import type { RelatedWork } from '@/types/person';

/** One row from law-service GET /v1/people (published profiles, photo metadata, tags). */
interface ApiPerson {
  slug: string;
  full_name: string;
  display_name?: string | null;
  category: PersonCategorySlug;
  country_code?: string | null;
  status?: Person['status'];
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  short_bio?: string | null;
  biography?: string | null;
  career?: Person['career'];
  education?: Person['education'];
  awards?: Person['awards'];
  notable_works?: { title: string; year?: number; note?: string }[];
  timeline?: Person['timeline'];
  social?: Person['social'];
  sports_info?: Person['sportsInfo'] | Record<string, never>;
  official_website?: string | null;
  sources?: Person['sources'];
  verified?: boolean;
  source_note?: string | null;
  indexable?: boolean;
  featured?: boolean;
  last_reviewed_at?: string | null;
  photo?: { id: number; alt_text?: string; credit: string; license: string; license_url?: string; source_url?: string } | null;
  links?: { kind: string; target_slug: string; relationship?: string | null }[];
}

const orUndef = <T,>(v: T | null | undefined): T | undefined => (v == null || (Array.isArray(v) && v.length === 0) ? undefined : v);

function toPerson(a: ApiPerson, cases: Map<string, { caseName: string }>): Person {
  const links = a.links ?? [];
  const relatedWorks: RelatedWork[] = [];

  for (const l of links.filter((x) => x.kind === 'legal-case')) {
    const legalCase = cases.get(l.target_slug);
    if (legalCase) relatedWorks.push({ title: legalCase.caseName, type: 'legal-case', role: l.relationship ?? undefined, entitySlug: l.target_slug });
  }
  for (const w of a.notable_works ?? []) {
    if (relatedWorks.some((r) => r.title.toLowerCase().startsWith(w.title.toLowerCase()))) continue;
    relatedWorks.push({ title: w.title, type: 'other', year: w.year, role: w.note });
  }

  return {
    slug: a.slug,
    fullName: a.full_name,
    displayName: a.display_name ?? undefined,
    category: a.category,
    countryCode: a.country_code ?? undefined,
    biography: a.biography || a.short_bio || '',
    shortBio: a.short_bio ?? undefined,
    career: a.career ?? [],
    education: orUndef(a.education),
    awards: orUndef(a.awards),
    birthDate: a.birth_date ?? undefined,
    birthPlace: a.birth_place ?? undefined,
    deathDate: a.death_date ?? undefined,
    officialWebsite: a.official_website ?? undefined,
    social: a.social && Object.keys(a.social).length ? a.social : undefined,
    sportsInfo: a.sports_info && Object.keys(a.sports_info).length ? (a.sports_info as Person['sportsInfo']) : undefined,
    timeline: orUndef(a.timeline),
    relatedWorks: orUndef(relatedWorks),
    relatedArticleSlugs: undefined,
    topicSlugs: orUndef(links.filter((l) => l.kind === 'topic').map((l) => l.target_slug)),
    sources: orUndef(a.sources),
    photo: a.photo
      ? {
          url: `/media/people/${a.photo.id}`,
          alt: a.photo.alt_text || a.full_name,
          credit: a.photo.credit,
          license: a.photo.license,
          licenseUrl: a.photo.license_url ?? undefined,
          sourceUrl: a.photo.source_url ?? undefined,
        }
      : undefined,
    avatarUrl: a.photo ? `/media/people/${a.photo.id}` : undefined,
    avatarSeed: a.slug,
    status: a.status ?? 'active',
    indexable: a.indexable,
    featured: a.featured || undefined,
    verification: {
      verified: !!a.verified,
      sourceNote: a.source_note ?? undefined,
      lastReviewedAt: a.last_reviewed_at ?? undefined,
    },
  };
}

/** Profiles managed in the admin panel. Empty when law-service is unreachable, so the site falls back to its bundled roster instead of failing. */
export async function fetchApiPeople(): Promise<Person[]> {
  const json = await fetchPublicApi('/people');
  const rows = Array.isArray(json?.data) ? (json.data as ApiPerson[]) : [];
  const cases = new Map((await getMergedLegalCases()).map((c) => [c.slug, c]));
  return rows.map((r) => toPerson(r, cases));
}
