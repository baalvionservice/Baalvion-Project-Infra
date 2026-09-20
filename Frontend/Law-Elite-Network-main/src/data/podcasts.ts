import type { Podcast } from '@/types/media';

/**
 * Real shows only: a title, an actual host, and links to episodes that exist.
 * Empty until the first show is verified and added, and /podcasts stays
 * unindexed until then.
 */
export const PODCASTS: Podcast[] = [];

export function getAllPodcasts(): Podcast[] {
  return PODCASTS;
}

export function getPodcastBySlug(slug: string): Podcast | null {
  return PODCASTS.find((p) => p.slug === slug) ?? null;
}
