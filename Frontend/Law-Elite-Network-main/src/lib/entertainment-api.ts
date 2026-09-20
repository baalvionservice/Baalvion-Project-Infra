import { fetchPublicApi } from '@/lib/api/public-fetch';
import type {
  EntertainmentEntity, EntertainmentPersonInvolvement, EntertainmentTypeSlug, RelatedEntertainmentEntity,
} from '@/types/entertainment';
import type { MediaItem } from '@/types/media';

interface ApiEntertainment {
  slug: string; title: string; type: EntertainmentTypeSlug; release_date?: string | null; description?: string;
  people_involved?: EntertainmentPersonInvolvement[]; related_entities?: RelatedEntertainmentEntity[]; related_article_slugs?: string[];
  videos?: MediaItem[]; interviews?: MediaItem[];
  seo_title?: string | null; seo_description?: string | null; verified?: boolean; source_note?: string | null; last_reviewed_at?: string | null; indexable?: boolean;
}

const orUndef = <T,>(v: T | null | undefined) => (v == null || v === '' ? undefined : v);
const listOrUndef = <T,>(v: T[] | undefined) => (v && v.length ? v : undefined);

const toEntity = (e: ApiEntertainment): EntertainmentEntity => ({
  slug: e.slug, title: e.title, type: e.type, releaseDate: orUndef(e.release_date), description: e.description ?? '',
  peopleInvolved: e.people_involved ?? [],
  relatedEntities: listOrUndef(e.related_entities),
  relatedArticleSlugs: listOrUndef(e.related_article_slugs),
  videos: listOrUndef(e.videos), interviews: listOrUndef(e.interviews),
  seo: e.seo_title || e.seo_description ? { metaTitle: orUndef(e.seo_title), metaDescription: orUndef(e.seo_description) } : undefined,
  verification: { verified: !!e.verified, sourceNote: orUndef(e.source_note), lastReviewedAt: orUndef(e.last_reviewed_at) },
  indexable: e.indexable,
});

/** Admin-managed entertainment entries plus the slugs an editor archived. Empty when law-service is unreachable, so the site serves its bundled entries. */
export async function fetchApiEntertainment() {
  const [list, hidden] = await Promise.all([fetchPublicApi('/entertainment'), fetchPublicApi('/entertainment/hidden')]);
  return {
    entities: (Array.isArray(list?.data) ? (list.data as ApiEntertainment[]) : []).map(toEntity),
    hidden: new Set<string>(Array.isArray(hidden?.data) ? hidden.data : []),
  };
}
