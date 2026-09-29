import { fetchPublicApi } from '@/lib/api/public-fetch';
import type { CaseDocument, CaseImportantDate, CaseParticipant, CaseStatus, CaseTimelineEntry, Court, CourtLevel, LegalCase } from '@/types/legal';

interface ApiCourt {
  slug: string; name: string; level: CourtLevel; country_code?: string | null; description?: string; url?: string | null; indexable?: boolean;
}

interface ApiCase {
  slug: string; case_name: string; court_slug: string; jurisdiction?: string; country_code?: string | null; status: CaseStatus; summary?: string;
  parties?: CaseParticipant[]; lawyers?: CaseParticipant[]; judges?: CaseParticipant[];
  important_dates?: CaseImportantDate[]; timeline?: CaseTimelineEntry[]; documents?: CaseDocument[]; related_article_slugs?: string[];
  seo_title?: string | null; seo_description?: string | null; verified?: boolean; source_note?: string | null; last_reviewed_at?: string | null; indexable?: boolean;
}

const rows = <T,>(json: any): T[] => (Array.isArray(json?.data) ? (json.data as T[]) : []);
const orUndef = <T,>(v: T | null | undefined) => (v == null || v === '' ? undefined : v);

const toCourt = (c: ApiCourt): Court => ({
  slug: c.slug, name: c.name, level: c.level, countryCode: orUndef(c.country_code), description: c.description ?? '', url: orUndef(c.url), indexable: c.indexable,
});

const toCase = (c: ApiCase): LegalCase => ({
  slug: c.slug, caseName: c.case_name, courtSlug: c.court_slug, jurisdiction: c.jurisdiction ?? '', countryCode: orUndef(c.country_code),
  parties: c.parties ?? [], lawyers: c.lawyers ?? [], judges: c.judges ?? [], status: c.status,
  importantDates: c.important_dates ?? [], summary: c.summary ?? '',
  documents: c.documents?.length ? c.documents : undefined,
  timeline: c.timeline?.length ? c.timeline : undefined,
  relatedArticleSlugs: c.related_article_slugs?.length ? c.related_article_slugs : undefined,
  seo: c.seo_title || c.seo_description ? { metaTitle: orUndef(c.seo_title), metaDescription: orUndef(c.seo_description) } : undefined,
  verification: { verified: !!c.verified, sourceNote: orUndef(c.source_note), lastReviewedAt: orUndef(c.last_reviewed_at) },
  indexable: c.indexable,
});

/** Admin-managed cases and courts, plus the slugs an editor has archived. Empty when law-service is unreachable, so the site falls back to its bundled data. */
export async function fetchApiLegal() {
  const [cases, courts, hidden] = await Promise.all([fetchPublicApi('/legal/cases'), fetchPublicApi('/legal/courts'), fetchPublicApi('/legal/hidden')]);
  return {
    cases: rows<ApiCase>(cases).map(toCase),
    courts: rows<ApiCourt>(courts).map(toCourt),
    hiddenCases: new Set<string>(hidden?.data?.cases ?? []),
    hiddenCourts: new Set<string>(hidden?.data?.courts ?? []),
  };
}

export async function fetchApiHiddenPeople(): Promise<Set<string>> {
  const json = await fetchPublicApi('/people/hidden');
  return new Set<string>(Array.isArray(json?.data) ? json.data : []);
}
