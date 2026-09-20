import type { Person } from '@/types/person';

/** One rule for "may search engines see this profile": used by page metadata and the sitemap so they can never disagree. */
export const isPersonIndexable = (p: Person): boolean => p.indexable ?? !p.thin;
