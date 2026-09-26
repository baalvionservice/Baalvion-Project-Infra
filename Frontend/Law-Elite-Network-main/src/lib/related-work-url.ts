import { entertainmentUrl } from './entertainment-url';
import { teamUrl, competitionUrl } from './sports-url';
import type { RelatedWork } from '@/types/person';

/** Resolves a Person.relatedWorks entry's `entitySlug` to a real URL, keyed by `type` -- the one place that knows which data source each work type links into. */
export function relatedWorkUrl(work: RelatedWork): string | null {
  if (!work.entitySlug) return null;
  switch (work.type) {
    case 'movie':
    case 'show':
    case 'album':
    case 'song':
      return entertainmentUrl(work.entitySlug);
    case 'team':
      return teamUrl(work.entitySlug);
    case 'sports-event':
      return competitionUrl(work.entitySlug);
    default:
      return null;
  }
}
