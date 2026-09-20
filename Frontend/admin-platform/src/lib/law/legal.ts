import { serviceClients } from '@/lib/api/client';
import { rowOf, rowsOf, slugify } from '@/lib/law/people';

export { rowsOf, slugify };

/** Mirror law-service utils/legalValidation.js and the site's types/legal.ts. */
export const COURT_LEVELS = ['trial', 'appellate', 'supreme', 'international', 'other'] as const;
export const CASE_STATUSES = ['ongoing', 'concluded', 'settled', 'dismissed', 'appealed'] as const;

type Row = Record<string, unknown>;

export interface CourtRecord {
  id: number; slug: string; name: string; level: string; country_code?: string | null; description: string; url?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export interface CaseRecord {
  id: number; slug: string; case_name: string; court_slug: string; jurisdiction: string; country_code?: string | null; status: string; summary: string;
  parties: Row[]; lawyers: Row[]; judges: Row[]; important_dates: Row[]; timeline: Row[]; documents: Row[]; related_article_slugs: string[];
  seo_title?: string | null; seo_description?: string | null; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

const law = serviceClients.law;

function resource<T extends { id: number }>(name: string) {
  return {
    list: (params: Record<string, unknown>) => law.get(`/admin/${name}`, { params }).then((r) => r.data),
    get: (id: number | string) => law.get(`/admin/${name}/${id}`).then((r) => rowOf<T>(r.data)),
    create: (body: Partial<T>) => law.post(`/admin/${name}`, body).then((r) => rowOf<T>(r.data)),
    update: (id: number, body: Partial<T>) => law.patch(`/admin/${name}/${id}`, body).then((r) => rowOf<T>(r.data)),
  };
}

export const courtsApi = resource<CourtRecord>('court_profiles');
export const casesApi = resource<CaseRecord>('case_profiles');

/** Mirrors law-service utils/entertainmentValidation.js and the site's ENTERTAINMENT_TYPES. */
export const ENTERTAINMENT_TYPES = [
  ['movie', 'Movie'], ['tv-show', 'TV show'], ['streaming-show', 'Streaming show'], ['music-release', 'Music release'],
  ['album', 'Album'], ['song', 'Song'], ['award', 'Award'], ['event', 'Entertainment event'],
] as const;

export interface EntertainmentRecord {
  id: number; slug: string; title: string; type: string; release_date?: string | null; description: string;
  people_involved: Row[]; related_entities: Row[]; related_article_slugs: string[]; videos: Row[]; interviews: Row[];
  seo_title?: string | null; seo_description?: string | null; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const entertainmentApi = resource<EntertainmentRecord>('entertainment_entities');

export const COMPETITION_LEVELS = ['olympic', 'championship', 'tournament', 'league', 'other'] as const;
export const COMMON_SPORTS = ['Basketball', 'American Football', 'Football (Soccer)', 'Baseball', 'Tennis', 'Golf', 'Athletics', 'Swimming', 'Boxing', 'Motorsport', 'Cricket', 'Other'] as const;

export interface SportsTeamRecord {
  id: number; slug: string; name: string; sport: string; country_code?: string | null; description: string; url?: string | null;
  verified: boolean; source_note?: string | null; published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export interface SportsCompetitionRecord {
  id: number; slug: string; name: string; sport: string; level: string; country_code?: string | null; description: string; event_date?: string | null;
  people_involved: Row[]; related_article_slugs: string[]; videos: Row[]; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const sportsTeamsApi = resource<SportsTeamRecord>('sports_teams');
export const sportsCompetitionsApi = resource<SportsCompetitionRecord>('sports_competitions');

export const TOPIC_PILLARS = ['legal', 'entertainment', 'sports', 'general'] as const;

export interface TopicRecord {
  id: number; slug: string; name: string; pillar: string; aliases: string[]; description?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const topicsApi = resource<TopicRecord>('topics');
